# CLAUDE.md

このファイルは、このリポジトリで Claude Code（claude.ai/code）が作業する際のガイドです。

## プロジェクト概要

ツケカン — グループ（家族・友人など）内でのお金の貸し借りを管理するWebアプリ。
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
| [docs/08-group-feature-design.md](./docs/08-group-feature-design.md) | グループ機能設計 |
| [docs/09-github-actions.md](./docs/09-github-actions.md) | GitHub Actions ワークフロー一覧・詳細 |
| [docs/summary.md](./docs/summary.md) | アプリ全体のサマリー（技術スタック・データモデル・画面構成など） |

## GitHub Actions

`.github/workflows/` に定期実行・手動実行のワークフローが定義されている。内容・トリガー・必要な Secrets などの詳細は [docs/09-github-actions.md](./docs/09-github-actions.md) を参照すること。特に `migrate-to-ledgers.yml` は本番DBに対する不可逆なワンショット移行作業なので、実行前に必ず同ドキュメントの注意事項を確認する。

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
