"use server";

/**
 * 管理画面（/admin）の書き込み。
 *
 * 管理画面は他人のデータに触れるため、ここでできることは意図的に絞ってある:
 *   - 共有リンクの失効（誤って配ったリンクを止めるための緊急対応）
 *   - 利子ジョブの手動実行（Cron Triggers の自動実行が失敗したときの代替手段）
 *
 * 取引やアカウントの編集・削除は管理画面からは行わない。
 * どちらの操作も必ず AdminAuditLog に残す。
 */

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { adminAuditLog, partner as partnerTable } from "@/db/schema";
import { requireAdmin, type AdminIdentity } from "@/lib/admin-auth";
import { describeJobResult, runInterestJob } from "@/lib/interest-job";
import type { AdminAuditAction } from "@/lib/admin-audit";
import type { AdminActionState } from "./types";

/** 監査ログを1件書く */
async function recordAdminAction(
  actor: AdminIdentity,
  action: AdminAuditAction,
  summary: string,
  target?: { type: string; id: string },
): Promise<void> {
  await db.insert(adminAuditLog).values({
    actorEmail: actor.email,
    action,
    summary,
    targetType: target?.type ?? null,
    targetId: target?.id ?? null,
  });
}

/**
 * 相手の共有リンクを管理者権限で失効させる。
 *
 * オーナー自身の revokePartnerShareToken と結果は同じだが、
 * こちらは ownerId のスコープを外す代わりに監査ログを残す。
 */
export async function revokeShareTokenAsAdmin(
  partnerId: string,
): Promise<AdminActionState> {
  const actor = await requireAdmin();

  const partner = await db.query.partner.findFirst({
    where: eq(partnerTable.id, partnerId),
    columns: { id: true, name: true, shareToken: true },
    with: { owner: { columns: { name: true, email: true } } },
  });

  if (!partner) return { error: "相手が見つかりません" };
  if (!partner.shareToken) {
    return { error: "この相手には有効な共有リンクがありません" };
  }

  await db
    .update(partnerTable)
    .set({ shareToken: null, shareTokenExpiresAt: null })
    .where(eq(partnerTable.id, partnerId));

  await recordAdminAction(
    actor,
    "REVOKE_SHARE_TOKEN",
    `共有リンクを失効: ${partner.owner.name}（${partner.owner.email}）の相手「${partner.name}」`,
    { type: "Partner", id: partner.id },
  );

  // オーナー側の相手ページにも失効を反映する
  revalidatePath(`/partners/${partnerId}`);
  revalidatePath("/admin/share-links");
  revalidatePath("/admin");

  return {
    success: true,
    message: `「${partner.name}」の共有リンクを失効させました`,
  };
}

/**
 * 利子ジョブを手動実行する。
 *
 * dryRun なら計算するだけでDBは変更しない。本実行しても
 * lastInterestAccruedAt による二重防止が効くので、同じ日に何度押しても安全。
 */
export async function runInterestJobAsAdmin(
  dryRun: boolean,
): Promise<AdminActionState> {
  const actor = await requireAdmin();

  const result = await runInterestJob(db, { dryRun });
  const summary = describeJobResult(result);

  await recordAdminAction(
    actor,
    dryRun ? "DRY_RUN_INTEREST_JOB" : "RUN_INTEREST_JOB",
    summary,
    { type: "Job", id: "weekly-interest" },
  );

  if (!dryRun && result.created > 0) {
    // 利息の取引が増えたので、影響を受けた画面のキャッシュを落とす
    revalidatePath("/", "layout");
  }
  revalidatePath("/admin/jobs");
  revalidatePath("/admin");

  return { success: true, message: summary };
}
