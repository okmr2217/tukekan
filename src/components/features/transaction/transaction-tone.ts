import type { MoneyTone } from "@/lib/transaction-wording";

/**
 * 取引まわりの配色。
 * 見ている人にとって債権（受け取る側）なら緑、債務（返す側）なら赤で統一する。
 * 認証ページ・公開ページ・カード・ダイアログのすべてでこの表を使う。
 */

/** 金額や残高の文字色 */
export const TONE_TEXT: Record<MoneyTone, string> = {
  credit: "text-emerald-600 dark:text-emerald-400",
  debt: "text-destructive",
  settled: "text-muted-foreground",
};

/** 名目チップの背景＋文字色 */
export const TONE_CHIP: Record<MoneyTone, string> = {
  credit:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400",
  debt: "bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400",
  settled: "bg-muted text-muted-foreground",
};

/** 利息は元本の貸し借りと別勘定なので、名目チップだけ琥珀色にする */
export const INTEREST_CHIP =
  "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400";

export function movementChipClass(
  tone: MoneyTone,
  isInterest: boolean,
): string {
  return isInterest ? INTEREST_CHIP : TONE_CHIP[tone];
}
