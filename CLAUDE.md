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
| [docs/03-data-design.md](./docs/03-data-design.md) | データ設計（ER図、テーブル、Prisma Schema） |
| [docs/04-screens.md](./docs/04-screens.md) | 画面設計（画面一覧、レイアウト） |
| [docs/05-tech-stack.md](./docs/05-tech-stack.md) | 技術スタック、ディレクトリ構成 |
| [docs/06-security.md](./docs/06-security.md) | セキュリティ、非機能要件 |
| [docs/07-phases.md](./docs/07-phases.md) | 開発フェーズ |
| [docs/09-github-actions.md](./docs/09-github-actions.md) | GitHub Actions ワークフロー一覧・詳細 |
| [docs/10-admin.md](./docs/10-admin.md) | 管理画面（/admin）・Cloudflare Access 認証 |
| [docs/11-cloudflare-workers.md](./docs/11-cloudflare-workers.md) | ホスティング（Cloudflare Workers / OpenNext）・デプロイ手順 |
| [docs/summary.md](./docs/summary.md) | アプリ全体のサマリー（技術スタック・データモデル・画面構成など） |

## GitHub Actions

`.github/workflows/` に定期実行・手動実行のワークフローが定義されている。内容・トリガー・必要な Secrets などの詳細は [docs/09-github-actions.md](./docs/09-github-actions.md) を参照すること。特に `migrate-to-ledgers.yml`・`migrate-ledger-annual-interest.yml`・`migrate-partner-share-token.yml`・`migrate-partner-share-note.yml` は本番DBに対する不可逆なワンショット移行作業なので、実行前に必ず同ドキュメントの注意事項を確認する。

## 管理画面

`/admin` は運営者向けの管理画面で、アプリ本体のログイン（JWT + Cookie）ではなく **Cloudflare Access** で認証する。詳細は [docs/10-admin.md](./docs/10-admin.md) を参照。実装時の約束:

- 管理画面のページとServer Actionは、**必ず先頭で `requireAdmin()`（`src/lib/admin-auth.ts`）を呼ぶ**。`src/proxy.ts` のゲートがあっても省かない
- 管理画面からの書き込みは「共有リンクの失効」「利子ジョブの手動実行」の2つだけ。**書き込みを足すときは必ず `AdminAuditLog` に記録する**
- `src/lib/cf-access.ts` は Edge ランタイム（proxy）からも読むので、`next/headers` や prisma を import しない

## ホスティング（Cloudflare Workers）

本番は OpenNext で Cloudflare Workers にデプロイしている。詳細は [docs/11-cloudflare-workers.md](./docs/11-cloudflare-workers.md)。実装時の約束:

- Prisma クライアントは **`@prisma/client` から import する**（生成先は `node_modules/.prisma/client`）。独自の出力先に戻すと Workers 上で WASM が読めなくなる
- アプリ内の DB アクセスは `src/lib/prisma.ts` の `prisma` を使う（Workers ではリクエストごとにクライアントを作るため、自前でグローバルな `PrismaClient` を作らない）

## 開発時の参照ガイド

タスクの種類に応じて、以下のドキュメントを明示的に参照しながら実装する（詳細は [docs/README.md](./docs/README.md) の「バイブコーディング時の参照ガイド」を参照）。

| タスク種別 | 参照ドキュメント |
| --- | --- |
| 画面実装 | `docs/04-screens.md` + `docs/05-tech-stack.md` |
| DB操作 | `docs/03-data-design.md` |
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
