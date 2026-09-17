/**
 * 口座（Ledger）の残高の内訳。
 *
 * 利息は元本に足さず「未払利息」として別勘定に積み、返済時はまず未払利息から充当する。
 *
 *   - kind === "INTEREST" の取引 → 未払利息を増やす
 *   - プラスの通常取引（貸し）     → 元本を増やす
 *   - マイナスの取引（返済・借り） → まず未払利息に充当し、残りを元本から引く
 *
 * 不変条件: principal + unpaidInterest === 全取引の金額合計（= 従来の残高）。
 * つまり合計残高は分離前と変わらず、増えるのは内訳だけ。
 */

import { isInterestKind } from "@/lib/transaction-kind";

export type LedgerBalanceBreakdown = {
  /** 元本残高。プラス = 自分の債権 */
  principal: number;
  /** 未払利息。0以上 */
  unpaidInterest: number;
  /** 合計残高（principal + unpaidInterest） */
  total: number;
};

export const EMPTY_BREAKDOWN: LedgerBalanceBreakdown = {
  principal: 0,
  unpaidInterest: 0,
  total: 0,
};

/** 内訳の計算に必要な最小限の取引の形 */
export type BreakdownInput = {
  amount: number;
  kind?: string | null;
  date: Date;
  createdAt?: Date;
};

/** date 昇順（同値なら createdAt 昇順）に並べ替える */
function sortChronologically<T extends BreakdownInput>(transactions: T[]): T[] {
  return [...transactions].sort((a, b) => {
    const diff = a.date.getTime() - b.date.getTime();
    if (diff !== 0) return diff;
    return (a.createdAt?.getTime() ?? 0) - (b.createdAt?.getTime() ?? 0);
  });
}

/**
 * 取引を古い順に適用しながら、各時点の内訳を返す。
 * 返り値は入力と同じ並び順ではなく、時系列昇順になる。
 */
export function calcLedgerRunningBreakdown<T extends BreakdownInput>(
  transactions: T[],
): Array<T & LedgerBalanceBreakdown> {
  let principal = 0;
  let unpaidInterest = 0;

  return sortChronologically(transactions).map((t) => {
    if (isInterestKind(t.kind)) {
      unpaidInterest += t.amount;
    } else if (t.amount >= 0) {
      principal += t.amount;
    } else {
      // 返済はまず未払利息に充当し、余りを元本から引く
      const repayment = -t.amount;
      const applied = Math.min(repayment, Math.max(unpaidInterest, 0));
      unpaidInterest -= applied;
      principal -= repayment - applied;
    }

    return {
      ...t,
      principal,
      unpaidInterest,
      total: principal + unpaidInterest,
    };
  });
}

/** 取引リスト全体を適用した最終的な内訳を返す */
export function calcLedgerBreakdown(
  transactions: BreakdownInput[],
): LedgerBalanceBreakdown {
  const rows = calcLedgerRunningBreakdown(transactions);
  const last = rows[rows.length - 1];
  if (!last) return EMPTY_BREAKDOWN;
  return {
    principal: last.principal,
    unpaidInterest: last.unpaidInterest,
    total: last.total,
  };
}

/**
 * 残高カードに内訳（元本／未払利息）を出すべきか。
 * 利子が設定されている口座、または未払利息が残っている口座だけ出す。
 */
export function shouldShowBreakdown(
  breakdown: LedgerBalanceBreakdown,
  annualInterestRate: number,
): boolean {
  return annualInterestRate > 0 || breakdown.unpaidInterest !== 0;
}
