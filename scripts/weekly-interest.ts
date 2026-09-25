/**
 * 週次自動利子ジョブを手元の D1（wrangler のローカル DB）に対して動かすためのスクリプト。
 *
 * 本番の定期実行は Cloudflare Workers の Cron Triggers（worker.ts → /api/cron/weekly-interest）が行う。
 * 本番 DB での「いま実行したら何が起きるか」の確認は、管理画面（/admin/jobs）の dry-run を使う。
 * 実際のロジックは `src/lib/interest-job.ts` の runInterestJob() にあり、
 * 自動実行・管理画面（/admin/jobs）の手動実行と共通。
 *
 * - 実行方法:        npx tsx scripts/weekly-interest.ts
 * - 試し打ち(dry-run): npx tsx scripts/weekly-interest.ts --dry-run
 */

import { getPlatformProxy } from "wrangler";
import { createDb, type Database } from "../src/lib/db";
import {
  describeJobResult,
  describeLedgerResult,
  runInterestJob,
} from "../src/lib/interest-job";
import { getWeekdayLabel } from "../src/lib/ledger-interest";
import { formatDateToJST, toJST } from "../src/lib/date-utils";

async function main() {
  const dryRun = process.argv.includes("--dry-run");

  // wrangler.jsonc の d1_databases（env.DB）を、`next dev` と同じローカルの D1 として受け取る
  const platform = await getPlatformProxy<CloudflareEnv>();
  try {
    await run(createDb(platform.env.DB), dryRun);
  } finally {
    await platform.dispose();
  }
}

async function run(db: Database, dryRun: boolean) {
  const now = new Date();

  console.log(
    `Starting weekly interest job...${dryRun ? " (dry-run)" : ""} ` +
      `(${formatDateToJST(now)} ${getWeekdayLabel(toJST(now).getDay())}曜日 JST)`,
  );

  const result = await runInterestJob(db, { now, dryRun });

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

main().catch((e) => {
  console.error("Weekly interest job failed:", e);
  process.exit(1);
});
