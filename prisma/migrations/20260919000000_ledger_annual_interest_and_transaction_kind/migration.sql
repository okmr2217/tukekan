-- 口座（Ledger）の利子システムを大幅改修する。
--
-- 1. 週利率の2段階指定（5000円未満 / 5000円以上）を廃止し、年利(%)に一本化する。
--    既存データは「5000円以上」の週利率を ×52 して年利に変換する（1年=52週）。
-- 2. 利息の発生曜日を口座ごとに指定できるようにする（既定は現行どおり水曜）。
-- 3. 単利／複利を口座ごとに選べるようにする（既定は単利 = 元本のみに課金）。
-- 4. 同日の二重発生を防ぐため、最終発生日時を記録する。
-- 5. Transaction に種別（kind）を追加し、自動発生した利息を元本と区別できるようにする。
--    既存の取引はすべて 'NORMAL' 扱いのままにする（バックフィルはしない）。

-- AlterTable
ALTER TABLE "Ledger" ADD COLUMN "annualInterestRate" DECIMAL(6,2) DEFAULT 0;
ALTER TABLE "Ledger" ADD COLUMN "interestAccrualWeekday" INTEGER NOT NULL DEFAULT 3;
ALTER TABLE "Ledger" ADD COLUMN "interestCompounding" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Ledger" ADD COLUMN "lastInterestAccruedAt" TIMESTAMP(3);

-- Backfill: 「5000円以上」の週利率を年利(= 週利 × 52)に変換する
UPDATE "Ledger"
SET "annualInterestRate" = COALESCE("weeklyInterestRateFrom5000", 0) * 52;

-- AlterTable
ALTER TABLE "Ledger" DROP COLUMN "weeklyInterestRateUnder5000";
ALTER TABLE "Ledger" DROP COLUMN "weeklyInterestRateFrom5000";

-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN "kind" TEXT NOT NULL DEFAULT 'NORMAL';
