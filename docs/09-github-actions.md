# GitHub Actions

このプロジェクトの `.github/workflows/` に定義されているワークフロー一覧と、それぞれの目的・注意点をまとめる。

## ワークフロー一覧

| ファイル | 名前 | トリガー | 目的 |
| --- | --- | --- | --- |
| [`keep-supabase-alive.yml`](../.github/workflows/keep-supabase-alive.yml) | Ping Supabase to Prevent Pausing | 定期実行 (`0 0 * * 0,3`) + 手動 | Supabase の無料枠プロジェクトが一定期間アクセスなしで自動一時停止されるのを防ぐため、DBに軽いクエリを打つ |
| [`weekly-interest.yml`](../.github/workflows/weekly-interest.yml) | Weekly Interest Job | 定期実行 (`0 0 * * *`, 毎日 09:00 JST) + 手動 | `scripts/weekly-interest.ts` を実行し、その日が発生曜日にあたる口座だけ利息を計算する（各口座につき週1回） |
| [`migrate-to-ledgers.yml`](../.github/workflows/migrate-to-ledgers.yml) | Migrate to Ledgers (one-shot) | 手動のみ | 本番DBに対する「バックアップ → マイグレーション適用 → Ledger移行スクリプト」のワンショット移行作業。定期実行はしない |
| [`migrate-ledger-share-and-notes.yml`](../.github/workflows/migrate-ledger-share-and-notes.yml) | Migrate Ledger Share and Notes (one-shot) | 手動のみ | 共有トークン・口座メモ追加のワンショット移行作業 |
| [`migrate-ledger-tiered-rate.yml`](../.github/workflows/migrate-ledger-tiered-rate.yml) | Migrate Ledger Tiered Interest Rate (one-shot) | 手動のみ | 週利率の2段階化のワンショット移行作業。バックフィルはマイグレーションSQLに含まれる |
| [`migrate-transaction-purpose.yml`](../.github/workflows/migrate-transaction-purpose.yml) | Migrate Transaction Purpose (one-shot) | 手動のみ | 取引への「用途」追加と、既存メモ（description）の用途への移植のワンショット移行作業。移植はマイグレーションSQLに含まれる |
| [`migrate-transaction-label-preset.yml`](../.github/workflows/migrate-transaction-label-preset.yml) | Migrate Transaction Label Preset (one-shot) | 手動のみ | `Account.transactionLabelPreset`（取引ボタンの名目ラベルのプリセット）追加のワンショット移行作業。既存行は既定値 `BOTH` で埋まる |
| [`migrate-ledger-annual-interest.yml`](../.github/workflows/migrate-ledger-annual-interest.yml) | Migrate Ledger Annual Interest (one-shot) | 手動のみ | 利子システム改修（年利への一本化・発生曜日/単複利の追加・`Transaction.kind` 追加）のワンショット移行作業。**不可逆なデータ変換を含む** |
| [`migrate-partner-share-token.yml`](../.github/workflows/migrate-partner-share-token.yml) | Migrate Partner Share Token (one-shot) | 手動のみ | 公開ページを口座単位から相手単位へ移すワンショット移行作業。**不可逆なデータ変換を含む** |

---

## keep-supabase-alive.yml

- **cron**: 日曜・水曜の 00:00 UTC に実行（`0 0 * * 0,3`）
- Node.js をセットアップし `@supabase/supabase-js` をインストールした上で、`Account` テーブルに `select().limit(1)` を投げるだけの軽量ジョブ
- 必要な Secrets:
  - `SUPABASE_URL`
  - `SUPABASE_ANON_KEY`
- `workflow_dispatch` にも対応しているため、手動実行で疎通確認が可能

## weekly-interest.yml

- **cron**: 毎日 00:00 UTC（JST 09:00）に実行
- `npm ci` で依存関係をインストールした後、`npx tsx scripts/weekly-interest.ts` を実行
- 毎日起動するが、実際に処理するのは「その日（JST）が `Ledger.interestAccrualWeekday` に一致する口座」だけ。
  各口座の利息が発生するのは週1回
- 同じ日に二重で利息を発生させないよう、`Ledger.lastInterestAccruedAt` が当日（JST）ならスキップする。
  そのため `workflow_dispatch` での手動再実行は安全
- 利息額は「対象額 × 年利 ÷ 52（四捨五入）」。対象額は単利なら元本、複利なら元本＋未払利息で、
  0以下の口座はスキップする
- 作成される取引は `kind = "INTEREST"` で、元本には足されず未払利息としてたまる
- 必要な Secrets:
  - `DATABASE_URL`（本番DB接続用）。**ジョブ全体の `env` に設定する**。
    `npm ci` の postinstall で走る `prisma generate` が `prisma.config.ts` 経由で `DATABASE_URL` を要求するため、
    実行ステップだけに渡すと `npm ci` の時点で `PrismaConfigEnvError` で失敗する
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

## migrate-transaction-purpose.yml

- **トリガー**: `workflow_dispatch` のみ。`confirm` 入力欄へ `migrate-production` と入力しないとジョブが失敗して止まる安全装置がある
- `migrate-ledger-tiered-rate.yml` と同じ「確認 → バックアップ → `prisma migrate deploy`」の構成。追加のスクリプト実行はない
- `prisma/migrations/20260917000000_add_transaction_purpose/migration.sql` が以下を実行する:
  - `Transaction` に `purpose` カラムを追加
  - 既存の `description` の値を `purpose` へコピーし、`description` を `NULL` にリセット
- **不可逆な操作**であり、`description` の内容は移植後に消える。実行前にジョブが取得するバックアップアーティファクトを必ず確認すること
- ジョブサマリーに取引件数・`purpose` ありの件数・`description` ありの件数（移行後は0件になるはず）が出力される

## migrate-transaction-label-preset.yml

- **トリガー**: `workflow_dispatch` のみ。`confirm` 入力欄へ `migrate-production` と入力しないとジョブが失敗して止まる安全装置がある
- `migrate-transaction-purpose.yml` と同じ「確認 → バックアップ → `prisma migrate deploy`」の構成。追加のスクリプト実行はない
- `prisma/migrations/20260918000000_add_transaction_label_preset/migration.sql` が `Account` に `transactionLabelPreset TEXT NOT NULL DEFAULT 'BOTH'` を追加する
- 既存データの書き換えはなく、既存アカウントはすべて既定の `BOTH`（貸した・返済した / 借りた・返済された）になる。**他の移行ワークフローと違い不可逆なデータ変換は含まない**
- ジョブサマリーにアカウント件数とプリセットの分布が出力される

## migrate-ledger-annual-interest.yml

- **トリガー**: `workflow_dispatch` のみ。`confirm` 入力欄へ `migrate-production` と入力しないとジョブが失敗して止まる安全装置がある
- `migrate-transaction-label-preset.yml` と同じ「確認 → バックアップ → `prisma migrate deploy`」の構成。追加のスクリプト実行はない
- `prisma/migrations/20260919000000_ledger_annual_interest_and_transaction_kind/migration.sql` が以下を実行する:
  - `Ledger` に `annualInterestRate` / `interestAccrualWeekday` / `interestCompounding` / `lastInterestAccruedAt` を追加
  - 年利を「`weeklyInterestRateFrom5000` × 52」でバックフィル
  - `Ledger` から `weeklyInterestRateUnder5000` / `weeklyInterestRateFrom5000` を削除
  - `Transaction` に `kind TEXT NOT NULL DEFAULT 'NORMAL'` を追加
- **不可逆な操作**。特に「5000円未満」の週利率は移行後に復元できない。実行前にジョブが取得するバックアップアーティファクトを必ず確認すること
- 既存取引の `kind` はすべて `NORMAL` のままで、**過去の利子取引を遡って分離することはしない**。
  ジョブサマリーに `purpose` が「利子」で始まる取引の件数を出力するので、
  **ここが0でない場合は** 過去の利子が元本に混ざったままであることを意味する。
  遡って分離したい場合は `UPDATE "Transaction" SET "kind" = 'INTEREST' WHERE "purpose" LIKE '利子%'` 相当のバックフィルを別途検討する
  （合計残高は変わらず、元本と未払利息の内訳だけが変わる）
- ジョブサマリーに各口座の年利・発生曜日・単複利の一覧も出力される

## migrate-partner-share-token.yml

- **トリガー**: `workflow_dispatch` のみ。`confirm` 入力欄へ `migrate-production` と入力しないとジョブが失敗して止まる安全装置がある
- `migrate-ledger-annual-interest.yml` と同じ「確認 → バックアップ → `prisma migrate deploy`」の構成。追加のスクリプト実行はない
- `prisma/migrations/20260920000000_partner_share_token/migration.sql` が以下を実行する:
  - `Partner` の `shareToken` / `shareTokenExpiresAt` を（無ければ）追加する。
    この2列はベースラインから残ったままになっていた（口座へ移したときに削除マイグレーションが書かれなかった）ため、`IF NOT EXISTS` で扱う
  - `Partner` に残っていた**古い共有トークンを破棄する**。そのままにすると、失効させたつもりの古いURLが相手ページとして復活してしまう
  - 生きている口座のトークンを相手へ引き継ぐ（トークンの値はそのまま。配布済みのURLは相手ページとして使える）。
    1人の相手が複数の口座でリンクを発行していた場合は**有効期限がいちばん先のものだけが残り、他は失効する**
  - `Ledger` から `shareToken` / `shareTokenExpiresAt` を削除する
- **不可逆な操作**。実行前にジョブが取得するバックアップアーティファクトを必ず確認すること
- ジョブサマリーに移行後に共有リンクを持つ相手の一覧（名前・有効期限・口座数）が出力される

---

## 運用上の注意

- `keep-supabase-alive.yml` と `weekly-interest.yml` は定期実行ジョブなので、Secrets の失効やDBスキーマ変更時は動作確認が必要
- `migrate-to-ledgers.yml` は一度限りの移行用ワークフローであり、通常の開発フローでは触れない。誤って再実行しないよう注意する
- Secrets はすべてリポジトリの GitHub Actions Secrets に設定されている前提。ローカルの `.env` とは別管理
