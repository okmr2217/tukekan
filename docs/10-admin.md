# 10. 管理画面（/admin）

運営者がツケカン全体の状況を把握し、運用上の異常に対処するための画面。
アプリ本体（ユーザー向け）とは認証もレイアウトも別で、**Cloudflare Access** で保護する。

---

## 10.1 なにをする画面か

ツケカンは「各ユーザーが自分のデータだけを見る」アプリなので、運営者から見ると
次のことが分からない。管理画面はそこを埋めるためにある。

| 知りたいこと | 対応する画面 |
| --- | --- |
| どれくらい使われているか | ダッシュボード |
| 誰がどれだけ貸し借りしているか | アカウント、取引 |
| 利子ジョブがちゃんと動いているか | 口座、ジョブ |
| 未認証で読めるリンクがいくつ生きているか | 共有リンク |
| 運営者が何をしたか | 監査ログ |

### 設計方針

- **見るのが主、触るのは最小限**。他人のデータなので、管理画面からできる書き込みは
  「共有リンクの失効」と「利子ジョブの手動実行」の2つだけ。取引やアカウントの編集・削除はできない
- **書き込みは必ず監査ログに残す**（`AdminAuditLog`）。ログは管理画面からは消せない
- **認可はデータに触る直前で確認する**。アプリ本体が毎回 `getSession()` を呼ぶのと同じく、
  管理画面は各ページ・各Server Actionの先頭で `requireAdmin()` を呼ぶ

---

## 10.2 認証：Cloudflare Access

管理画面はアプリ本体のログイン（JWT + HttpOnly Cookie）を**使わない**。
本体のアカウントに「管理者フラグ」を足すと、乗っ取られたユーザーが管理者になりうるし、
パスワード再発行の導線も増える。運営者は数人なので、認証はアプリの外（Cloudflare）に出す。

### 仕組み

```
ブラウザ ──> Cloudflare Access ──> ツケカン (/admin)
              ↑ ここでサインイン      ↑ Cloudflare が署名した JWT を検証する
```

Access を通ったリクエストには Cloudflare が署名した JWT が付く。

- ヘッダー: `Cf-Access-Jwt-Assertion`
- Cookie: `CF_Authorization`

アプリ側は Access のチーム用 JWKS（`https://<team>.cloudflareaccess.com/cdn-cgi/access/certs`）で
署名を検証し、`iss` と `aud` を突き合わせる。検証を通らないリクエストは
「Cloudflare を経由していない＝オリジンを直接叩いている」ことになるので、必ず拒否する。

### 3層のゲート

| 層 | 実装 | 役割 |
| --- | --- | --- |
| 1. Cloudflare Access | Cloudflare 側の設定 | そもそもアプリにリクエストを通さない |
| 2. `src/proxy.ts` | Next.js の proxy（旧 middleware） | `/admin` 配下を入り口で 403 にする |
| 3. `requireAdmin()` | `src/lib/admin-auth.ts` | 各ページ・各Server Actionで再確認する |

2があっても3は省かない。Server Action はページとは別のリクエストとして飛んでくるので、
「データに触る関数自身が確認する」形にしておかないと、いつか穴が空く。

### 環境変数

| 変数 | 必須 | 説明 |
| --- | --- | --- |
| `CF_ACCESS_TEAM_DOMAIN` | ○ | Access のチームドメイン。`example` でも `example.cloudflareaccess.com` でも `https://example.cloudflareaccess.com` でもよい |
| `CF_ACCESS_AUD` | ○ | Access アプリケーションの Audience (AUD) タグ。カンマ区切りで複数指定できる |
| `ADMIN_EMAILS` | | 管理者のメールアドレスの許可リスト（カンマ区切り）。**未設定なら Access のポリシーを通った人は全員管理者**。Access 側のポリシーに加えて二重に絞りたいときに使う |
| `ADMIN_DEV_EMAIL` | | ローカル開発用の抜け道。設定するとその人として管理画面に入れる。**`NODE_ENV=production` では無効**なので本番では効かない |

`CF_ACCESS_TEAM_DOMAIN` と `CF_ACCESS_AUD` のどちらかが未設定だと、管理画面は
「有効になっていない」とみなして 403 を返す（ローカルで `ADMIN_DEV_EMAIL` を設定した場合を除く）。

### Cloudflare 側の設定手順

1. Zero Trust ダッシュボード → Access → Applications → Add an application（Self-hosted）
2. Application domain に `<本番ドメイン>` / Path に `admin` を指定する
3. Policy で許可する相手を決める（例: 特定のメールアドレス、特定のドメイン）
4. アプリケーションの **Audience (AUD) Tag** をコピーして `CF_ACCESS_AUD` に設定する
5. チームドメイン（`<team>.cloudflareaccess.com`）を `CF_ACCESS_TEAM_DOMAIN` に設定する

> **注意**: オリジン（Worker の `*.workers.dev` など）に Access を通さず直接アクセスできる状態だと、
> 1層目が素通りになる。それでも2層目・3層目で JWT を検証しているので `/admin` は開けないが、
> 可能なら Cloudflare 経由のみを許可するよう設定しておくのが望ましい。

---

## 10.3 画面構成

```
/admin                     ダッシュボード（全体サマリーと異常の一覧）
/admin/accounts            アカウント一覧（名前・メールで検索）
/admin/accounts/[id]       アカウント詳細（相手・口座・直近の取引）
/admin/ledgers             口座一覧（利子つき口座の監視）
/admin/transactions        取引の横断検索（キーワード・アカウント・種別・期間）
/admin/share-links         共有リンクの一覧と失効
/admin/jobs                利子ジョブの状況と手動実行
/admin/audit               監査ログ
```

レイアウトはアプリ本体（スマホ前提の1カラム + ボトムバー）と別で、
PCで一覧を見るためのサイドバー構成（`src/app/admin/layout.tsx`）。色やコンポーネントは本体と共通。

### ダッシュボード

- 規模（アカウント・相手・口座・取引の件数、直近30日の増加）
- お金の総量（貸借残高の合計、未払利息の合計、累計の貸出／返済・借入）
- 異常の一覧（利子ジョブが止まっていそうな口座、まもなく期限切れの共有リンク）
- 直近の取引・最近のアカウント

### 口座 / ジョブ

利子は週1回、口座ごとに指定した曜日に自動で発生する（Cron Triggers。[docs/11-cloudflare-workers.md](./11-cloudflare-workers.md) の 11.5）。
このジョブが失敗しても、ユーザーは「利息が付かない」ことに気づきにくい。そこで:

- **停止の疑い**: 利子つきで利息が発生するはずなのに、最後の発生から8日以上たっている口座に印を付ける
- **試し打ち（dry-run）**: DBを変更せず、「いま実行したら何が起きるか」だけを計算する
- **手動実行**: Cron Triggers の自動実行が失敗したときに、管理画面から同じ処理を流す
- **最後の自動実行**: Cron Triggers からの実行結果（`AdminAuditLog` の `SCHEDULED_INTEREST_JOB`）を表示する

手動実行のロジックは自動実行とまったく同じ（`src/lib/interest-job.ts` を共用）。
同じ日に二重で発生させない仕組み（`Ledger.lastInterestAccruedAt`）が効いているので、
何度押しても利息が二重に付くことはない。

### 共有リンク

`/share/[token]` は**未認証で残高と取引履歴が読める唯一の経路**なので、
いま何本のリンクが生きているかを把握できるようにしてある。
誤って配ってしまったリンクは管理者が失効させられる（オーナーは発行し直せる）。

トークンの値そのものは画面に出さない。出してしまうと、管理画面から他人の公開ページを
そのまま開けてしまい、「見るだけ」の範囲を超えるため。

### 監査ログ

管理画面から行った操作を `AdminAuditLog` に残す。操作者は Cloudflare Access が認証した
メールアドレス（`Account` とはひも付かないので外部キーは張らない）。

| action | 内容 | DBを変更するか |
| --- | --- | --- |
| `REVOKE_SHARE_TOKEN` | 共有リンクの失効 | する |
| `RUN_INTEREST_JOB` | 利子ジョブの実行 | する |
| `DRY_RUN_INTEREST_JOB` | 利子ジョブの試し打ち | しない |
| `SCHEDULED_INTEREST_JOB` | 利子ジョブの自動実行（管理画面の操作ではなく Cron Triggers。`actorEmail` は `cron`） | する |

---

## 10.4 ファイル構成

```
src/
├── proxy.ts                          /admin の入り口のゲート（Next.js 16 で middleware.ts から改称）
├── lib/
│   ├── cf-access.ts                  Access の JWT 検証（Edge からも読むので Node 依存なし）
│   ├── admin-auth.ts                 requireAdmin() など、サーバー側の認可
│   ├── admin-audit.ts                監査ログの操作種別
│   └── interest-job.ts               利子ジョブの本体（cron と管理画面で共用）
├── actions/admin/
│   ├── types.ts                      管理画面が扱う型と定数
│   ├── queries.ts                    読み取り（全アカウント横断）
│   └── mutations.ts                  書き込み（共有リンクの失効・利子ジョブの実行）
├── app/admin/                        各ページ
└── components/features/admin/        サイドバー・テーブル・操作ボタン
```

---

## 10.5 データモデル

`AdminAuditLog` テーブル（定義は [`src/db/schema.ts`](../src/db/schema.ts)、列の説明は [03-data-design.md](./03-data-design.md) の 3.3）。

| 列 | 内容 |
| --- | --- |
| `actorEmail` | Cloudflare Access が認証したメールアドレス（Cron からの自動実行は `"cron"`） |
| `action` | `REVOKE_SHARE_TOKEN` / `RUN_INTEREST_JOB` / `DRY_RUN_INTEREST_JOB` / `SCHEDULED_INTEREST_JOB` |
| `targetType` / `targetId` | `"Partner"` / `"Job"` とその識別子 |
| `summary` | 人が読むための要約 |
| `createdAt` | 記録日時（索引あり。`actorEmail` にも索引） |

---

## 10.6 ローカルでの動かし方

```bash
# .env に追記（Cloudflare Access を立てずに管理画面を見るための抜け道）
ADMIN_DEV_EMAIL=you@example.com

npm run dev
# → http://localhost:3000/admin
```

`ADMIN_DEV_EMAIL` は `NODE_ENV=production` では読まれないので、本番に紛れ込んでも無効。
サイドバーに「開発用バイパス」と出るので、本物の Access 経由かどうかは画面で見分けられる。
