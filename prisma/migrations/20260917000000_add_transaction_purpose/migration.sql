-- 取引（Transaction）に「用途」を追加する。
-- これまで単一行の「メモ」(description) に入れていた
-- 「麻雀」「ランチ」「返済」などの用途は purpose に移し、
-- description は複数行の詳細テキスト（メモ）として空の状態から使い直す。

-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN "purpose" TEXT;

-- Backfill: 既存の description を purpose へ移植し、description は空にする
UPDATE "Transaction"
SET
  "purpose" = "description",
  "description" = NULL
WHERE "description" IS NOT NULL;
