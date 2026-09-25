# CLAUDE.md

このファイルは、このリポジトリで Claude Code（claude.ai/code）が作業する際のガイドです。

## プロジェクト概要

ツケカン — 友人・家族などとのお金の貸し借りを管理するWebアプリ。
技術スタックやデータモデルの詳細は [`docs/summary.md`](./docs/summary.md) を参照。

## ドキュメント

要件定義・設計ドキュメントは [`docs/`](./docs) 配下にまとまっている。詳細は [`docs/README.md`](./docs/README.md) を参照。

| ファイル | 内容 |
| --- | --- |
| [docs/01-overview.md](./docs/01-overview.md) | プロジェクト概要、ユーザー要件 |
| [docs/02-features.md](./docs/02-features.md) | 機能要件（MVP + 将来機能） |
| [docs/03-data-design.md](./docs/03-data-design.md) | データ設計（ER図、テーブル、D1 / Drizzle のスキーマ） |
| [docs/04-screens.md](./docs/04-screens.md) | 画面設計（画面一覧、レイアウト） |
| [docs/05-tech-stack.md](./docs/05-tech-stack.md) | 技術スタック、ディレクトリ構成 |
| [docs/06-security.md](./docs/06-security.md) | セキュリティ、非機能要件 |
| [docs/07-phases.md](./docs/07-phases.md) | 開発フェーズ |
| [docs/09-github-actions.md](./docs/09-github-actions.md) | GitHub Actions ワークフロー一覧・詳細 |
| [docs/10-admin.md](./docs/10-admin.md) | 管理画面（/admin）・Cloudflare Access 認証 |
| [docs/11-cloudflare-workers.md](./docs/11-cloudflare-workers.md) | ホスティング（Cloudflare Workers / OpenNext）・DB（D1）・デプロイ手順 |
| [docs/summary.md](./docs/summary.md) | アプリ全体のサマリー（技術スタック・データモデル・画面構成など） |

## GitHub Actions

`.github/workflows/` には本番デプロイ（`deploy.yml`）だけがある。`main` への push で D1 のマイグレーションを当ててから Worker をデプロイする。詳細は [docs/09-github-actions.md](./docs/09-github-actions.md) を参照すること。

## 管理画面

`/admin` は運営者向けの管理画面で、アプリ本体のログイン（JWT + Cookie）ではなく **Cloudflare Access** で認証する。詳細は [docs/10-admin.md](./docs/10-admin.md) を参照。実装時の約束:

- 管理画面のページとServer Actionは、**必ず先頭で `requireAdmin()`（`src/lib/admin-auth.ts`）を呼ぶ**。`src/proxy.ts` のゲートがあっても省かない
- 管理画面からの書き込みは「共有リンクの失効」「利子ジョブの手動実行」の2つだけ。**書き込みを足すときは必ず `AdminAuditLog` に記録する**
- `src/lib/cf-access.ts` は Edge ランタイム（proxy）からも読むので、`next/headers` や DB クライアント（`src/lib/db.ts`）を import しない

## ホスティング（Cloudflare Workers）・DB（Cloudflare D1）

本番は OpenNext で Cloudflare Workers にデプロイし、DB は Cloudflare D1（SQLite）を Drizzle ORM で使っている。詳細は [docs/11-cloudflare-workers.md](./docs/11-cloudflare-workers.md)。実装時の約束:

- アプリ内の DB アクセスは **`src/lib/db.ts` の `db`** を使う。スキーマは `src/db/schema.ts`
- **`db.transaction()` は使わない**（D1 は対話的なトランザクションを使えない）。まとめて成功/失敗させたい書き込みは `db.batch([...])` にする
- スキーマを変えたら `npm run db:generate` で `drizzle/` にマイグレーションを生成してコミットする（本番へはデプロイ時に自動で当たる）
- 年利は DB では整数のベーシスポイント（`Ledger.annualInterestRateBp`）。アプリ内では `toInterestSettings()` / `toAnnualInterestRateBp()`（`src/lib/ledger-interest.ts`）で % と変換する
- 部分一致検索は `src/db/sql.ts` の `contains()` を使う（`%` `_` をエスケープする）
- 定期ジョブ（週次自動利子ジョブ）は GitHub Actions ではなく **Cron Triggers** で動く。`wrangler.jsonc` の `triggers.crons` と `worker.ts` の `SCHEDULED_ROUTES` は必ずそろえる

## 開発時の参照ガイド

タスクの種類に応じて、以下のドキュメントを明示的に参照しながら実装する（詳細は [docs/README.md](./docs/README.md) の「バイブコーディング時の参照ガイド」を参照）。

| タスク種別 | 参照ドキュメント |
| --- | --- |
| 画面実装 | `docs/04-screens.md` + `docs/05-tech-stack.md` |
| DB操作 | `docs/03-data-design.md` + `docs/11-cloudflare-workers.md` |
| 認証実装 | `docs/06-security.md` + `docs/05-tech-stack.md` |
| 機能確認 | `docs/02-features.md` |
| ディレクトリ確認 | `docs/05-tech-stack.md` |
| フェーズ進捗 | `docs/07-phases.md` |
| CI/CD・定期ジョブ | `docs/09-github-actions.md` |
| デプロイ・ホスティング | `docs/11-cloudflare-workers.md` |
| 管理画面 | `docs/10-admin.md` + `docs/06-security.md` |

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
