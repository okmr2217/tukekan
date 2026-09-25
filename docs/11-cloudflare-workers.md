# 11. ホスティング（Cloudflare Workers）・DB（Cloudflare D1）

ツケカンは Vercel から **Cloudflare Workers** に移行した。Next.js は
[OpenNext（`@opennextjs/cloudflare`）](https://opennext.js.org/cloudflare) で Worker に変換してデプロイする。
DB も Supabase（PostgreSQL + Prisma）から **Cloudflare D1（SQLite）+ Drizzle ORM** に移した（11.7）。

---

## 11.1 構成

```
ブラウザ ──> Cloudflare（カスタムドメイン / Access）──> Worker「tukekan」
                                                         ├─ 静的ファイル: Workers Static Assets（.open-next/assets）
                                                         └─ SSR / Server Actions / proxy.ts
                                                               └─ Drizzle ORM ──> D1「tukekan-db」（バインディング env.DB）
```

| ファイル | 役割 |
| --- | --- |
| `wrangler.jsonc` | Worker の設定（名前・互換性フラグ・静的アセット・D1 などのバインディング・Cron Triggers） |
| `worker.ts` | Worker のエントリ。OpenNext の生成物（`.open-next/worker.js`）の `fetch` に、Cron Triggers 用の `scheduled` を足したもの（11.5） |
| `open-next.config.ts` | OpenNext の設定。ISR 等を使っていないのでキャッシュは既定のまま |
| `next.config.ts` | `initOpenNextCloudflareForDev()` で、`next dev` でもバインディング（ローカルの D1）を使えるようにする |
| `src/db/schema.ts` | DB スキーマ（Drizzle） |
| `src/lib/db.ts` | DB クライアント。リクエストのコンテキストから `env.DB` を取り出して Drizzle に渡す |
| `drizzle/` | マイグレーション SQL（`drizzle-kit` が生成し、`wrangler` が適用する） |
| `drizzle.config.ts` | `drizzle-kit` の設定 |
| `cloudflare-env.d.ts` | `npm run cf-typegen` が生成する `CloudflareEnv`（`env.DB` など）とランタイムの型 |

---

## 11.2 DB（D1 / Drizzle ORM）

### 約束

- アプリ内の DB アクセスは **`src/lib/db.ts` の `db`** を使う（`import { db } from "@/lib/db"`）。
  D1 はバインディング経由でしかつなげないので、自前で接続を作らない
- テーブルの定義は `src/db/schema.ts`。クエリは Drizzle のクエリビルダ（`db.select()...`）か
  リレーショナルクエリ（`db.query.xxx.findMany({ with })`）で書く
- **トランザクション**: D1 は `BEGIN` / `COMMIT` による対話的なトランザクションを使えない（`db.transaction()` は使わない）。
  複数の書き込みを「全部成功か全部失敗か」にしたいときは **`db.batch([...])`** を使う。
  D1 の batch は1つのトランザクションとして実行され、途中で1つでも失敗すれば全体がロールバックされる。
  利子ジョブの「利息の取引の作成」と「`lastInterestAccruedAt` の更新」、相手の作成と最初の口座の作成がこれに当たる
- **部分一致検索**は `src/db/sql.ts` の `contains()` を使う（`%` `_` をエスケープした `LIKE`）。
  SQLite の `LIKE` は英字の大文字・小文字を区別しないので、Postgres 時代の `mode: "insensitive"` は不要になった
- **型の持ち方**: 日時は UNIX ミリ秒の整数、真偽値は 0/1 の整数（どちらも Drizzle が `Date` / `boolean` に変換する）。
  年利は `Ledger.annualInterestRateBp`（0.01% 単位の整数。5.25% → 525）で持ち、
  アプリ内では `toInterestSettings()` / `toAnnualInterestRateBp()`（`src/lib/ledger-interest.ts`）で % と相互に変換する
- **1クエリのバインドパラメータは100個まで**（D1 の制限）。`inArray()` に長い配列を渡すときは注意する
- 外部キー制約は D1 でも有効（`Ledger` は相手の削除で一緒に消え、`Transaction.ledgerId` は口座の削除で null になる。
  取引が残っている相手・アカウントは削除できない）

### スキーマを変えるとき

1. `src/db/schema.ts` を編集する
2. `npm run db:generate` で `drizzle/` にマイグレーション SQL を生成する（生成物はコミットする）
3. `npm run db:migrate:local` でローカルの D1 に当てて動作確認する
4. `main` に入れると、デプロイのワークフローが本番の D1 に当ててからデプロイする（11.4）。
   手元から当てるときは `npm run db:migrate:remote`

SQLite は列の型変更や制約の追加が苦手で、`drizzle-kit` はテーブルを作り直す SQL を出すことがある。
生成された SQL は必ず目で確認し、データを変換する移行はローカルで試してから当てる。

### ローカル開発

- `npm run dev`（`next dev`）で、`.wrangler/state` にあるローカルの D1 を使う。最初に `npm run db:migrate:local` でテーブルを作る
- 中身を見る・直すときは `npx wrangler d1 execute tukekan-db --local --command 'SELECT ...'`
- ローカルの DB を作り直したいときは `.wrangler/state/v3/d1` を消してから `npm run db:migrate:local`
- 本番のデータを覗くときは `--remote`（書き込みは慎重に）

---

## 11.3 環境変数・シークレット

Worker の「設定 → 変数とシークレット」、または `npx wrangler secret put <名前>` で設定する。
`wrangler.jsonc` には書かない。

| 名前 | 必須 | 内容 |
| --- | --- | --- |
| `JWT_SECRET` | ○ | セッション JWT の署名鍵（Vercel で使っていたものと同じ値にすればログイン状態を引き継げる） |
| `CF_ACCESS_TEAM_DOMAIN` / `CF_ACCESS_AUD` | ○ | 管理画面の Access 検証（[10-admin.md](./10-admin.md)） |
| `ADMIN_EMAILS` | | 管理者の許可リスト（任意） |

DB の接続情報はない（D1 は `wrangler.jsonc` の `d1_databases` のバインディングでつながる）。

ローカルで開発・プレビューするときは、リポジトリ直下に `.dev.vars`（git 管理外）を作って同じ名前で書く。

---

## 11.4 コマンドとデプロイ

| コマンド | 内容 |
| --- | --- |
| `npm run dev` | `next dev` で開発（ローカルの D1 を使う） |
| `npm run preview` | OpenNext でビルドし、ローカルの workerd（本番と同じランタイム）で動かす。`.dev.vars` を読む |
| `npm run deploy` | 手元からビルドして Cloudflare にデプロイ（`wrangler login` 済みか `CLOUDFLARE_API_TOKEN` が必要）。通常は GitHub Actions に任せる |
| `npm run cf-typegen` | `wrangler.jsonc` のバインディングから `cloudflare-env.d.ts`（`CloudflareEnv` の型）を生成する。バインディングを変えたら流し直す |
| `npm run db:generate` | スキーマの変更からマイグレーション SQL を生成する |
| `npm run db:migrate:local` / `db:migrate:remote` | 未適用のマイグレーションをローカル / 本番の D1 に当てる |

`main` への push で [`.github/workflows/deploy.yml`](../.github/workflows/deploy.yml) が走り、
`opennextjs-cloudflare build` → `wrangler d1 migrations apply tukekan-db --remote` → `opennextjs-cloudflare deploy`
の順で本番を更新する。Actions タブから手動実行（`workflow_dispatch`）もできる。

- 必要な Repository secrets: `CLOUDFLARE_ACCOUNT_ID` / `CLOUDFLARE_API_TOKEN`
  （トークンには「Workers Scripts: 編集」と「D1: 編集」相当の権限が要る）
- マイグレーションはデプロイより先に当たる。**古いコードでも動く形（列の追加など）で変える**と、デプロイが失敗しても本番が壊れない
- Worker の実行時シークレット（11.3）は Cloudflare 側に保存されており、デプロイしても消えない
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
  - 同じ日に二重で利息を発生させないよう、`Ledger.lastInterestAccruedAt` が当日（JST）ならスキップする。
    利息の取引と `lastInterestAccruedAt` は `db.batch()` で同時に書くので、片方だけが残ることはない
- **なぜ Worker 内部で HTTP を経由するか**: `scheduled` は Next の外にあるので、内部 fetch にして
  Next のルートハンドラから `src/lib/db.ts` や `revalidatePath` をそのまま使えるようにしている
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
  `curl "http://localhost:8787/__scheduled?cron=0+15+*+*+*"` を叩く（ローカルの D1 に書き込む）
- **手元から流す**: `npx tsx scripts/weekly-interest.ts`（`--dry-run` でDBを変更せずに見積もりだけ）。
  ローカルの D1 に対して同じ `runInterestJob()` を動かす。本番 DB での見積もりは管理画面の「ジョブ」ページで行う

---

## 11.6 切り替え手順（Vercel → Workers）

1. Workers にデプロイし（済）、`*.workers.dev` の URL でログイン・取引登録・共有リンク・`/admin` の 403 を確認する
2. Worker の「設定 → ドメインとルート」で本番ドメイン（`tukekan.paritto.dev`）をカスタムドメインとして追加する（済）
   （DNS の向き先が Vercel から Worker に切り替わる）
3. Cloudflare Access の管理画面アプリ（`tukekan.paritto.dev/admin`）がそのまま効いていることを確認する（済）
4. `wrangler.jsonc` に `"workers_dev": false` と `"preview_urls": false` を足して（済）、
   Access を通らない `*.workers.dev` からの入り口を閉じる（[10-admin.md](./10-admin.md) の「オリジンへの直接アクセス」の注意に相当）
5. しばらく並行稼働させてから Vercel のプロジェクトを削除する

---

## 11.7 Supabase から D1 へのデータ移行（2026-09-25 完了）

一度だけ行った作業の記録。移行用のスクリプト（`scripts/migrate-supabase-to-d1.ts`）は完了後に削除した（git の履歴に残っている）。

1. `npx wrangler d1 create tukekan-db --location apac` で D1 を作り、`database_id` を `wrangler.jsonc` に書いた
2. `npm run db:migrate:remote` でテーブルを作った
3. Supabase の全テーブルを SQL に書き出し（日時は UTC のミリ秒、真偽値は 0/1、年利は % → ベーシスポイント）、
   `npx wrangler d1 execute tukekan-db --remote --file=...` で流し込んだ
4. 検算: 取引 516 件・金額合計 168,060・口座 30・年利合計 52000bp・アカウント 8・相手 33・共有リンク 8 が一致
5. `main` にマージしてデプロイし、本番で共有ページ・ログイン後の残高・統計が D1 のデータで出ることを確認した
6. Worker のシークレット `DATABASE_URL`、GitHub の Secrets `DATABASE_URL` / `DIRECT_URL` / `SUPABASE_URL` / `SUPABASE_ANON_KEY` を削除し、
   Supabase のプロジェクトを停止した

旧スキーマの残骸 `PartnerNote`（2行・アプリからは未使用）は移していない。
