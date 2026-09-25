# GitHub Actions

このプロジェクトの `.github/workflows/` に定義されているワークフロー一覧と、それぞれの目的・注意点をまとめる。

## ワークフロー一覧

> 週次自動利子ジョブ（旧 `weekly-interest.yml`）は Cloudflare Workers の Cron Triggers に移した。
> [11-cloudflare-workers.md](./11-cloudflare-workers.md) の「11.5 定期ジョブ（Cron Triggers）」を参照。
>
> DB を Supabase から Cloudflare D1 に移したので、Supabase 向けのワークフロー
> （`keep-supabase-alive.yml` と、本番 DB へのワンショット移行 `migrate-*.yml`）は削除した。
> 移行の記録は git の履歴に残っている。D1 のスキーマ変更は `deploy.yml` の中で当てる。

| ファイル | 名前 | トリガー | 目的 |
| --- | --- | --- | --- |
| [`deploy.yml`](../.github/workflows/deploy.yml) | Deploy to Cloudflare Workers | `main` への push + 手動 | OpenNext でビルドし、D1 のマイグレーションを当ててから本番の Worker「tukekan」にデプロイする（[11-cloudflare-workers.md](./11-cloudflare-workers.md)） |

---

## deploy.yml

- **トリガー**: `main` への push と `workflow_dispatch`。`concurrency` でデプロイ同士が並行しないようにしている
- `npm ci` → `npx opennextjs-cloudflare build` → `npx wrangler d1 migrations apply tukekan-db --remote` → `npx opennextjs-cloudflare deploy`
  - マイグレーションは `drizzle/` の SQL のうち未適用のものだけが当たる（適用済みは D1 の `d1_migrations` テーブルで管理）
  - マイグレーションはデプロイより先に当たるので、古いコードでも動く形でスキーマを変える
- 必要な Secrets:
  - `CLOUDFLARE_ACCOUNT_ID`
  - `CLOUDFLARE_API_TOKEN`（「Workers Scripts: 編集」と「D1: 編集」相当の権限）
- Worker の実行時シークレット（`JWT_SECRET` など）は Cloudflare 側にあり、このワークフローでは扱わない

---

## 運用上の注意

- Secrets はすべてリポジトリの GitHub Actions Secrets に設定されている前提。ローカルの `.env` / `.dev.vars` とは別管理
- Supabase 時代の Secrets（`DATABASE_URL` / `DIRECT_URL` / `SUPABASE_URL` / `SUPABASE_ANON_KEY`）は D1 への移行後に削除した
