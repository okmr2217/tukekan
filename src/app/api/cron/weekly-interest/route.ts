/**
 * 週次自動利子ジョブの入り口（Cron Triggers 専用）。
 *
 * 毎日 00:00 JST に worker.ts の scheduled が Worker 内部から POST する。
 * scheduled が発行した使い捨てトークン（src/lib/scheduled-job-token.ts）がないリクエストは
 * 404 で返すので、本番ドメインから直接叩いても何も起きない。
 *
 * ロジックの本体は src/lib/interest-job.ts の runInterestJob() で、
 * 管理画面（/admin/jobs）の手動実行・scripts/weekly-interest.ts と共通。
 * このアプリで API Route を使うのはここだけ（docs/05-tech-stack.md）。
 */

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { adminAuditLog } from "@/db/schema";
import {
  describeJobResult,
  describeLedgerResult,
  runInterestJob,
} from "@/lib/interest-job";
import {
  SCHEDULED_JOB_TOKEN_HEADER,
  isValidScheduledJobToken,
} from "@/lib/scheduled-job-token";

export async function POST(request: Request) {
  if (
    !isValidScheduledJobToken(request.headers.get(SCHEDULED_JOB_TOKEN_HEADER))
  ) {
    return new Response("Not Found", { status: 404 });
  }

  const result = await runInterestJob(db);
  for (const ledger of result.ledgers) {
    console.log(describeLedgerResult(ledger));
  }
  const summary = describeJobResult(result);

  // 管理画面の「ジョブ」ページで最後の自動実行を確認できるように残す
  await db.insert(adminAuditLog).values({
    actorEmail: "cron",
    action: "SCHEDULED_INTEREST_JOB",
    summary,
    targetType: "Job",
    targetId: "weekly-interest",
  });

  if (result.created > 0) {
    // 利息の取引が増えたので、影響を受けた画面のキャッシュを落とす
    revalidatePath("/", "layout");
  }

  return Response.json({ summary, created: result.created });
}
