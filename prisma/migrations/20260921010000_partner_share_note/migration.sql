-- メモ機能（LedgerNote）を廃止し、メモは「公開ページ（/share/[token]）に表示する
-- 相手ごとの1つのメモ」に作り直す。
--
-- 相手に対して複数のメモを持つのをやめるため、既存のメモは相手ごとに
-- もっとも新しい1件だけを Partner.shareNote へ移し、LedgerNote テーブルは削除する。

-- AlterTable: 相手に公開ページ用のメモを追加
ALTER TABLE "Partner" ADD COLUMN "shareNote" TEXT;

-- Backfill: 相手ごとに最新のメモ1件だけを引き継ぐ（100文字を超える分は切り詰める）
UPDATE "Partner" p
SET "shareNote" = LEFT(latest."content", 100)
FROM (
  SELECT DISTINCT ON (l."partnerId")
    l."partnerId" AS "partnerId",
    n."content"   AS "content"
  FROM "LedgerNote" n
  JOIN "Ledger" l ON l."id" = n."ledgerId"
  ORDER BY l."partnerId", n."createdAt" DESC, n."id" DESC
) AS latest
WHERE latest."partnerId" = p."id";

-- DropTable
DROP TABLE "LedgerNote";
