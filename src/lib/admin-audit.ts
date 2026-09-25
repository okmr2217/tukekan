/**
 * 管理画面から行った操作の記録（AdminAuditLog）。
 *
 * 管理画面は他人のデータに触れるため、書き込み操作は必ず監査ログに残す。
 * 例外的に、Cron Triggers による利子ジョブの自動実行もここに残す（実行履歴の確認用）。
 * 操作の種別は Prisma の enum ではなく文字列で持つ（Transaction.kind などと同じ方針）。
 */

export const ADMIN_AUDIT_ACTIONS = [
  /** 共有リンクを管理者が失効させた */
  "REVOKE_SHARE_TOKEN",
  /** 利子ジョブを管理者が手動実行した */
  "RUN_INTEREST_JOB",
  /** 利子ジョブを試し打ち（dry-run）した */
  "DRY_RUN_INTEREST_JOB",
  /** 利子ジョブが Cron Triggers から自動実行された（actorEmail は "cron"） */
  "SCHEDULED_INTEREST_JOB",
] as const;

export type AdminAuditAction = (typeof ADMIN_AUDIT_ACTIONS)[number];

export const ADMIN_AUDIT_ACTION_LABELS: Record<AdminAuditAction, string> = {
  REVOKE_SHARE_TOKEN: "共有リンクの失効",
  RUN_INTEREST_JOB: "利子ジョブの実行",
  DRY_RUN_INTEREST_JOB: "利子ジョブの試し打ち",
  SCHEDULED_INTEREST_JOB: "利子ジョブの自動実行",
};

export function toAdminAuditActionLabel(action: string): string {
  return ADMIN_AUDIT_ACTION_LABELS[action as AdminAuditAction] ?? action;
}

/** 書き込みを伴う操作かどうか（試し打ちは読み取りだけ） */
export function isMutatingAdminAction(action: string): boolean {
  return action !== "DRY_RUN_INTEREST_JOB";
}
