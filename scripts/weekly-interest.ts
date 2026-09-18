/**
 * 週次自動利子ジョブ（GitHub Actions から毎日 9:00 JST に実行）。
 *
 * 実際のロジックは `src/lib/interest-job.ts` の runInterestJob() にあり、
 * 管理画面（/admin/jobs）の手動実行と共通。このスクリプトは
 * 「DBにつないで実行し、結果をログに出す」だけの薄い入り口。
 *
 * - 実行方法:        npx tsx scripts/weekly-interest.ts
 * - 試し打ち(dry-run): npx tsx scripts/weekly-interest.ts --dry-run
 */

import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import {
  describeJobResult,
  describeLedgerResult,
  runInterestJob,
} from "../src/lib/interest-job";
import { getWeekdayLabel } from "../src/lib/ledger-interest";
import { formatDateToJST, toJST } from "../src/lib/date-utils";
import "dotenv/config";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({
  adapter,
});

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const now = new Date();

  console.log(
    `Starting weekly interest job...${dryRun ? " (dry-run)" : ""} ` +
      `(${formatDateToJST(now)} ${getWeekdayLabel(toJST(now).getDay())}曜日 JST)`,
  );

  const result = await runInterestJob(prisma, { now, dryRun });

  console.log(
    `Found ${result.targetCount} ledger(s) accruing interest on ${getWeekdayLabel(
      result.weekday,
    )}曜日.`,
  );
  for (const ledger of result.ledgers) {
    console.log(describeLedgerResult(ledger));
  }

  console.log(`Weekly interest job completed. ${describeJobResult(result)}`);
}

main()
  .catch((e) => {
    console.error("Weekly interest job failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
