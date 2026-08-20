-- 口座（Ledger）の週利率を、残高帯（5000円未満／5000円以上）で
-- 2段階に指定できるようにする。既存の単一利率は両方の段階にそのままコピーする
-- （挙動を変えないまま、以降は個別に調整できるようにするだけ）。

-- AlterTable
ALTER TABLE "Ledger" ADD COLUMN "weeklyInterestRateUnder5000" DECIMAL(5,2) DEFAULT 0;
ALTER TABLE "Ledger" ADD COLUMN "weeklyInterestRateFrom5000" DECIMAL(5,2) DEFAULT 0;

-- Backfill: 既存の weeklyInterestRate を両段階にコピー
UPDATE "Ledger"
SET
  "weeklyInterestRateUnder5000" = "weeklyInterestRate",
  "weeklyInterestRateFrom5000" = "weeklyInterestRate"
WHERE "weeklyInterestRate" IS NOT NULL;

-- AlterTable
ALTER TABLE "Ledger" DROP COLUMN "weeklyInterestRate";
