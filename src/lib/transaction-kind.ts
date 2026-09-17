/**
 * 取引の種別。
 *
 *   NORMAL   : 通常の貸し借り・返済（ユーザーが記録する取引）
 *   INTEREST : 週次ジョブが自動発生させた利息
 *
 * 利息は元本とは別勘定（未払利息）として扱うため、金額の符号だけでは区別できない。
 * Account.transactionLabelPreset と同じく、Prisma の enum ではなく文字列で持つ。
 */

export const TRANSACTION_KINDS = ["NORMAL", "INTEREST"] as const;

export type TransactionKind = (typeof TRANSACTION_KINDS)[number];

export const DEFAULT_TRANSACTION_KIND: TransactionKind = "NORMAL";

export function isTransactionKind(value: unknown): value is TransactionKind {
  return TRANSACTION_KINDS.includes(value as TransactionKind);
}

export function toTransactionKind(value: unknown): TransactionKind {
  return isTransactionKind(value) ? value : DEFAULT_TRANSACTION_KIND;
}

export function isInterestKind(value: unknown): boolean {
  return toTransactionKind(value) === "INTEREST";
}
