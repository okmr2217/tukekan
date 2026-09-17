-- 公開ページ（/share/[token]）を口座（Ledger）単位から相手（Partner）単位に戻す。
--
-- 注意: "Partner"."shareToken" / "shareTokenExpiresAt" の列そのものは
-- ベースライン（0001_baseline）から存在したままになっている。
-- 20260821000000_ledger_share_and_notes で口座へ移したときに、移行スクリプトの
-- 完了を待つため列を落とさなかったが、その削除マイグレーションは書かれなかった。
-- そのため列は IF NOT EXISTS で扱い、中身は「口座側が正」として作り直す。
--
-- 1. 相手側に残っている古いトークン（口座へ移す前のもの）を消す。
--    そのまま残すと、失効させたつもりの古いURLが相手ページとして復活してしまう。
-- 2. いま生きている口座のトークンを相手へ引き継ぐ。1人の相手が複数の口座で
--    リンクを発行していた場合は「有効期限がいちばん先のもの」を残す。
--    トークンの値はそのまま引き継ぐので、配布済みのURLは相手ページとして生き続ける。
-- 3. Ledger からトークンの列を落とす。

-- AlterTable
ALTER TABLE "Partner" ADD COLUMN IF NOT EXISTS "shareToken" TEXT;
ALTER TABLE "Partner" ADD COLUMN IF NOT EXISTS "shareTokenExpiresAt" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "Partner_shareToken_key" ON "Partner"("shareToken");

-- 口座へ移す前の古いトークンを破棄する
UPDATE "Partner"
SET "shareToken" = NULL, "shareTokenExpiresAt" = NULL
WHERE "shareToken" IS NOT NULL;

-- Backfill: 口座の共有トークンを相手へ引き継ぐ
UPDATE "Partner" p
SET "shareToken" = l."shareToken",
    "shareTokenExpiresAt" = l."shareTokenExpiresAt"
FROM (
  SELECT DISTINCT ON ("partnerId")
    "partnerId", "shareToken", "shareTokenExpiresAt"
  FROM "Ledger"
  WHERE "shareToken" IS NOT NULL
  ORDER BY "partnerId", "shareTokenExpiresAt" DESC NULLS LAST, "createdAt" ASC
) l
WHERE p."id" = l."partnerId";

-- DropIndex
DROP INDEX IF EXISTS "Ledger_shareToken_key";

-- AlterTable
ALTER TABLE "Ledger" DROP COLUMN IF EXISTS "shareToken";
ALTER TABLE "Ledger" DROP COLUMN IF EXISTS "shareTokenExpiresAt";
