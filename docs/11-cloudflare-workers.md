# 11. ホスティング（Cloudflare Workers）

ツケカンは Vercel から **Cloudflare Workers** に移行した。Next.js は
[OpenNext（`@opennextjs/cloudflare`）](https://opennext.js.org/cloudflare) で Worker に変換してデプロイする。
DB は引き続き **Supabase（PostgreSQL）** を使う（D1 への移行は別フェーズ）。

---

## 11.1 構成

```
ブラウザ ──> Cloudflare（カスタムドメイン / Access）──> Worker「tukekan」
                                                         ├─ 静的ファイル: Workers Static Assets（.open-next/assets）
                                                         └─ SSR / Server Actions / proxy.ts
                                                               └─ pg（TCP・pg-cloudflare）──> Supabase
                                                                  （任意で Hyperdrive 経由）
```

| ファイル | 役割 |
| --- | --- |
| `wrangler.jsonc` | Worker の設定（名前・互換性フラグ・静的アセット・バインディング・Cron Triggers） |
| `worker.ts` | Worker のエントリ。OpenNext の生成物（`.open-next/worker.js`）の `fetch` に、Cron Triggers 用の `scheduled` を足したもの（11.5） |
| `open-next.config.ts` | OpenNext の設定。ISR 等を使っていないのでキャッシュは既定のまま |
| `next.config.ts` | Workers 向けのトレース設定（`pg-cloudflare` と Prisma の edge 版を含める）・`serverExternalPackages` |
| `src/lib/prisma.ts` | Workers ではリクエストごとに Prisma クライアントを作る（下記） |

### Prisma まわりの約束

- 生成先は `node_modules/.prisma/client`（既定の場所）で、import は **`@prisma/client`** から行う。
  Workers ではパッケージの `workerd` 条件で edge 版に解決され、WASM が事前コンパイル済みモジュールとして読まれる。
  `src/generated/...` のような独自の出力先に戻すと、Workers 上で
  `WebAssembly.Module(): Wasm code generation disallowed by embedder` になって DB に触れなくなる
- Workers ではリクエストをまたいでソケットを使い回せないため、`src/lib/prisma.ts` は
  Workers 上では React の `cache()` で「1リクエストに1クライアント」を作る。
  呼び出し側は今までどおり `import prisma from "@/lib/prisma"` でよい
- `scripts/` や `prisma/` のスクリプト（Node.js / tsx で動く）は自前で `PrismaClient` を作っており、影響を受けない

---

## 11.2 環境変数・シークレット

Worker の「設定 → 変数とシークレット」、または `npx wrangler secret put <名前>` で設定する。
`wrangler.jsonc` には書かない。

| 名前 | 必須 | 内容 |
| --- | --- | --- |
| `DATABASE_URL` | ○ | Supabase の接続文字列。**Supavisor の Transaction モード（ポート 6543）** を推奨（Workers はリクエストごとに接続を張るため） |
| `JWT_SECRET` | ○ | セッション JWT の署名鍵（Vercel で使っていたものと同じ値にすればログイン状態を引き継げる） |
| `CF_ACCESS_TEAM_DOMAIN` / `CF_ACCESS_AUD` | ○ | 管理画面の Access 検証（[10-admin.md](./10-admin.md)） |
| `ADMIN_EMAILS` | | 管理者の許可リスト（任意） |

ローカルで Worker として動かすときは、リポジトリ直下に `.dev.vars`（git 管理外）を作って同じ名前で書く。

### Hyperdrive（任意）

Supabase へ毎回新しく TCP 接続を張るより速くしたい場合は Hyperdrive を使う。

1. `npx wrangler hyperdrive create tukekan-db --connection-string="<Supabase の Session モード/直接接続の URL>"`
2. 返ってきた ID を `wrangler.jsonc` の `hyperdrive` に `{"binding": "HYPERDRIVE", "id": "..."}` で追加
3. `src/lib/prisma.ts` はバインディングがあれば自動でそちらを優先する（コード変更は不要）

---

## 11.3 コマンド

| コマンド | 内容 |
| --- | --- |
| `npm run dev` | 従来どおり `next dev`（Node.js）で開発 |
| `npm run preview` | OpenNext でビルドし、ローカルの workerd（本番と同じランタイム）で動かす。`.dev.vars` を読む |
| `npm run deploy` | 手元からビルドして Cloudflare にデプロイ（`wrangler login` 済みか `CLOUDFLARE_API_TOKEN` が必要）。通常は GitHub Actions に任せる |
| `npm run cf-typegen` | `wrangler.jsonc` のバインディングから `CloudflareEnv` の型を生成 |

ビルド時も `postinstall` の `prisma generate` が `DATABASE_URL` を要求する（値はダミーでもよい）。

---

## 11.4 デプロイ方法（GitHub Actions）

`main` への push で [`.github/workflows/deploy.yml`](../.github/workflows/deploy.yml) が走り、
`opennextjs-cloudflare build` → `opennextjs-cloudflare deploy` で本番の Worker「tukekan」を更新する。
Actions タブから手動実行（`workflow_dispatch`）もできる。

- 必要な Repository secrets: `CLOUDFLARE_ACCOUNT_ID` / `CLOUDFLARE_API_TOKEN`
  （トークンには「Workers Scripts: 編集」相当の権限が要る）
- ビルド時の `DATABASE_URL` はワークフロー内のダミー値（`prisma generate` が要求するだけで、DB にはつながない）
- Worker の実行時シークレット（11.2）は Cloudflare 側に保存されており、デプロイしても消えない。
  変更するときは `npx wrangler secret put <名前>` かダッシュボードで行う
- デプロイ先: `https://tukekan.paritto.dev`（カスタムドメイン。`*.workers.dev` とプレビューURLは `wrangler.jsonc` で無効化済み）

---

## 11.5 定期ジョブ（Cron Triggers）

週次自動利子ジョブは Worker の **Cron Triggers** で動かす（以前は GitHub Actions の `weekly-interest.yml`）。

```
Cron Triggers（毎日 15:00 UTC = 00:00 JST）
  └─> worker.ts の scheduled
        └─ Worker 内部で POST /api/cron/weekly-interest（使い捨てトークン付き）
              └─ src/app/api/cron/weekly-interest/route.ts
                    └─ runInterestJob()（src/lib/interest-job.ts）
```

- **スケジュール**: 毎日 00:00 JST（`0 15 * * *`）。GitHub Actions のころは cron が遅れたり混み合ったりするので 00:10 にずらしていたが、
  Cron Triggers は予定より早く動くことはなく、ジョブは実行時の時刻で JST の日付を決めるので、日付が変わった瞬間に合わせている。
  `wrangler.jsonc` の `triggers.crons`（UTC）と `worker.ts` の `SCHEDULED_ROUTES` で
  cron 式 → 叩くルートを対応づけているので、**両方をそろえて変える**
- **処理内容**: 毎日起動するが、実際に処理するのは「その日（JST）が `Ledger.interestAccrualWeekday` に一致する口座」だけ。
  各口座の利息が発生するのは週1回
  - 利息額は「対象額 × 年利 ÷ 52（四捨五入）」。対象額は単利なら元本、複利なら元本＋未払利息で、0以下の口座はスキップする
  - 作成される取引は `kind = "INTEREST"` で、元本には足されず未払利息としてたまる
  - 同じ日に二重で利息を発生させないよう、`Ledger.lastInterestAccruedAt` が当日（JST）ならスキップする
- **なぜ Worker 内部で HTTP を経由するか**: `scheduled` は Next の外にあるので、ここから直接 Prisma を使うと
  Prisma（WASM）を Next 側と二重にバンドルすることになる。内部 fetch にすれば、Next のルートハンドラから
  `src/lib/prisma.ts` のクライアントをそのまま使える
- **外から叩かれない仕組み**: `/api/cron/weekly-interest` は本番ドメインからも見えるが、
  `scheduled` が起動のたびに発行する使い捨てトークン（`src/lib/scheduled-job-token.ts`）がないと 404 を返す。
  トークンは同じ isolate の `globalThis` に置くだけで、シークレットの設定は要らない
- **実行の記録**: 実行結果の1行サマリーを `AdminAuditLog`（`action = "SCHEDULED_INTEREST_JOB"`, `actorEmail = "cron"`）に残し、
  管理画面の「ジョブ」ページに「最後の自動実行」として出す。口座ごとのログは Workers Logs（`observability`）で見られる
- **失敗したとき**: ルートが 2xx 以外を返すと `scheduled` が例外を投げるので、
  ダッシュボードの Worker →「Cron イベント」（またはログ）に失敗として残る。
  GitHub Actions のような失敗メールは来ないので、管理画面の「停止の疑い」「最後の自動実行」で気づく。
  流し直しは管理画面の「ジョブ」ページの「いま実行する」でよい（二重には発生しない）
- **ローカルで試す**: `npx opennextjs-cloudflare build` のあと `npx wrangler dev --test-scheduled` で起動し、
  `curl "http://localhost:8787/__scheduled?cron=0+15+*+*+*"` を叩く（`.dev.vars` の `DATABASE_URL` の DB に書き込むので注意）
- **手元から流す**: `npx tsx scripts/weekly-interest.ts`（`--dry-run` でDBを変更せずに見積もりだけ）。
  `DATABASE_URL` の DB に対して同じ `runInterestJob()` を動かす

---

## 11.6 切り替え手順（Vercel → Workers）

1. Workers にデプロイし（済）、`*.workers.dev` の URL でログイン・取引登録・共有リンク・`/admin` の 403 を確認する
2. Worker の「設定 → ドメインとルート」で本番ドメイン（`tukekan.paritto.dev`）をカスタムドメインとして追加する（済）
   （DNS の向き先が Vercel から Worker に切り替わる）
3. Cloudflare Access の管理画面アプリ（`tukekan.paritto.dev/admin`）がそのまま効いていることを確認する（済）
4. `wrangler.jsonc` に `"workers_dev": false` と `"preview_urls": false` を足して（済）、
   Access を通らない `*.workers.dev` からの入り口を閉じる（[10-admin.md](./10-admin.md) の「オリジンへの直接アクセス」の注意に相当）
5. しばらく並行稼働させてから Vercel のプロジェクトを削除する

Supabase の ping（`keep-supabase-alive.yml`）は DB に直接つなぐ GitHub Actions なので、
ホスティングの移行とは無関係にそのまま動く。利子ジョブは Cron Triggers に移した（11.5）。

---

## 11.7 今後の候補

- DB を Supabase から **D1** に移す（`Decimal` の持ち替え、`mode: "insensitive"` の書き換え、トランザクションの扱いの確認が必要）
