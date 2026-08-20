# GitHub Actions

このプロジェクトの `.github/workflows/` に定義されているワークフロー一覧と、それぞれの目的・注意点をまとめる。

## ワークフロー一覧

| ファイル | 名前 | トリガー | 目的 |
| --- | --- | --- | --- |
| [`keep-supabase-alive.yml`](../.github/workflows/keep-supabase-alive.yml) | Ping Supabase to Prevent Pausing | 定期実行 (`0 0 * * 0,3`) + 手動 | Supabase の無料枠プロジェクトが一定期間アクセスなしで自動一時停止されるのを防ぐため、DBに軽いクエリを打つ |
| [`weekly-interest.yml`](../.github/workflows/weekly-interest.yml) | Weekly Interest Job | 定期実行 (`0 0 * * 3`, 毎週水曜 09:00 JST) + 手動 | `scripts/weekly-interest.ts` を実行し、週次の利息計算バッチを本番DBに対して走らせる |
| [`migrate-to-ledgers.yml`](../.github/workflows/migrate-to-ledgers.yml) | Migrate to Ledgers (one-shot) | 手動のみ | 本番DBに対する「バックアップ → マイグレーション適用 → Ledger移行スクリプト」のワンショット移行作業。定期実行はしない |

---

## keep-supabase-alive.yml

- **cron**: 日曜・水曜の 00:00 UTC に実行（`0 0 * * 0,3`）
- Node.js をセットアップし `@supabase/supabase-js` をインストールした上で、`Account` テーブルに `select().limit(1)` を投げるだけの軽量ジョブ
- 必要な Secrets:
  - `SUPABASE_URL`
  - `SUPABASE_ANON_KEY`
- `workflow_dispatch` にも対応しているため、手動実行で疎通確認が可能

## weekly-interest.yml

- **cron**: 毎週水曜 00:00 UTC（JST 09:00）に実行
- `npm ci` で依存関係をインストールした後、`npx tsx scripts/weekly-interest.ts` を実行
- 必要な Secrets:
  - `DATABASE_URL`（本番DB接続用）
- ロジックの詳細は `scripts/weekly-interest.ts` を参照

## migrate-to-ledgers.yml

- **トリガー**: `workflow_dispatch` のみ（定期実行なし）。実行時に `confirm` 入力欄へ `migrate-production` と入力しないとジョブが失敗して止まる安全装置がある
- 本番DBに対する不可逆な操作を含むため、実行前に以下を確認すること:
  - `DATABASE_URL` / `DIRECT_URL` の両方が GitHub Secrets に設定されていること
    - `DATABASE_URL`: pgbouncer 経由（6543番ポート、通常はアプリ実行時に使用）
    - `DIRECT_URL`: 直接接続（5432番ポート、`pg_dump` 用）
  - このジョブ内では Prisma migrate CLI がプーラー経由だとハングするため、`DATABASE_URL` にも `DIRECT_URL`（セッションモード）を上書きして使っている
- 主なステップ:
  1. `confirm` 入力の検証
  2. チェックアウト・依存関係インストール
  3. サーバー側 PostgreSQL 17 に合わせて `pg_dump` を PGDG からインストール（Ubuntu標準は v16のため）
  4. DB疎通確認（`pg_isready`）
  5. マイグレーション適用前の状態確認（`prisma migrate status`）
  6. `pg_dump` で本番DBをバックアップし、`actions/upload-artifact@v4` で14日間保持
  7. `prisma migrate deploy` でマイグレーション適用
  8. `prisma/migrations/migrate-to-ledgers.ts` で Ledger 移行スクリプトを実行
  9. マイグレーション適用後の状態確認
  10. `GITHUB_STEP_SUMMARY` に Partner / Ledger / Transaction の件数サマリーを出力
- 実行後は必ずジョブサマリーとバックアップアーティファクトを確認すること

---

## 運用上の注意

- `keep-supabase-alive.yml` と `weekly-interest.yml` は定期実行ジョブなので、Secrets の失効やDBスキーマ変更時は動作確認が必要
- `migrate-to-ledgers.yml` は一度限りの移行用ワークフローであり、通常の開発フローでは触れない。誤って再実行しないよう注意する
- Secrets はすべてリポジトリの GitHub Actions Secrets に設定されている前提。ローカルの `.env` とは別管理
