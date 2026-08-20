-- CreateTable
CREATE TABLE "Ledger" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "weeklyInterestRate" DECIMAL(5,2) DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "partnerId" TEXT NOT NULL,

    CONSTRAINT "Ledger_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Ledger_partnerId_idx" ON "Ledger"("partnerId");

-- AddForeignKey
ALTER TABLE "Ledger" ADD CONSTRAINT "Ledger_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "Partner"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN "ledgerId" TEXT;

-- CreateIndex
CREATE INDEX "Transaction_ledgerId_idx" ON "Transaction"("ledgerId");

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_ledgerId_fkey" FOREIGN KEY ("ledgerId") REFERENCES "Ledger"("id") ON DELETE SET NULL ON UPDATE CASCADE;
