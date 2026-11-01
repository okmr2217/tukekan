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

/**
 * 金額ボタンの色はアプリ共通の債権軸に揃える。
 *   + （自分の債権が増える / 貸した・返済した）= 緑
 *   - （自分の債務が増える / 借りた・返済された）= 赤
 * 取引カードや残高表示と同じ意味になるので、登録時と一覧で色が反転しない。
 */
export const AMOUNT_SIDE_CLASSES = {
  lending: {
    selected:
      "bg-emerald-600 text-white border-emerald-600 dark:bg-emerald-600 dark:border-emerald-600",
    unselected:
      "bg-transparent border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-400 dark:hover:bg-emerald-950",
  },
  borrowing: {
    selected: "bg-red-600 text-white border-red-600 dark:bg-red-700 dark:border-red-700",
    unselected:
      "bg-transparent border-red-300 text-red-600 hover:bg-red-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950",
  },
} as const;

export const AMOUNT_SIDE_BASE =
  "flex-1 rounded-md border px-3 py-2 text-sm font-medium transition-colors active:scale-95 disabled:pointer-events-none disabled:opacity-50";
