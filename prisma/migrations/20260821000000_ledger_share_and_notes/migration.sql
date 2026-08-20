-- 口座（Ledger）に共有リンクとメモを持たせる。
-- 旧 Partner.shareToken / Partner.shareTokenExpiresAt と PartnerNote テーブルは
-- データ移行（migrate-ledger-share-and-notes.ts）が完了するまで削除しない。
-- 削除は移行後の別マイグレーションで行う。

-- AlterTable: Ledger に共有リンク用カラムを追加
ALTER TABLE "Ledger" ADD COLUMN "shareToken" TEXT;
ALTER TABLE "Ledger" ADD COLUMN "shareTokenExpiresAt" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "Ledger_shareToken_key" ON "Ledger"("shareToken");

-- CreateTable: LedgerNote（PartnerNote の口座版。旧テーブルとは独立して新設）
CREATE TABLE "LedgerNote" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "ownerId" TEXT NOT NULL,
    "ledgerId" TEXT NOT NULL,

    CONSTRAINT "LedgerNote_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LedgerNote_ledgerId_idx" ON "LedgerNote"("ledgerId");

-- CreateIndex
CREATE INDEX "LedgerNote_ownerId_idx" ON "LedgerNote"("ownerId");

-- AddForeignKey
ALTER TABLE "LedgerNote" ADD CONSTRAINT "LedgerNote_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LedgerNote" ADD CONSTRAINT "LedgerNote_ledgerId_fkey" FOREIGN KEY ("ledgerId") REFERENCES "Ledger"("id") ON DELETE CASCADE ON UPDATE CASCADE;
