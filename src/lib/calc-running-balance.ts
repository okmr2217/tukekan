import type { TransactionWithPartner } from "@/actions/transaction";
import {
  calcLedgerRunningBreakdown,
  type LedgerBalanceBreakdown,
} from "@/lib/ledger-balance";

export type TransactionWithRunningBalance = TransactionWithPartner &
  LedgerBalanceBreakdown & {
    /** その取引を適用した直後の合計残高（元本 + 未払利息） */
    runningBalance: number;
  };

/**
 * 取引リストに対して、occurredAt (date) 昇順で累積したポスト残高
 * （runningBalance と、元本／未払利息の内訳）を付与した配列を返す。
 * 残高の符号：自分が貸している（受け取るべき）状態がプラス。
 */
export function calcRunningBalance(
  transactions: TransactionWithPartner[],
): TransactionWithRunningBalance[] {
  return calcLedgerRunningBreakdown(transactions).map((t) => ({
    ...t,
    runningBalance: t.total,
  }));
}

/**
 * 複数の口座・相手が混在する取引リストに対して、口座ごとに残高を計算し
 * 取引ID → runningBalance のマップを返す。
 *
 * 利息の充当は口座単位の概念なので、口座（ledgerId）でグループ化する。
 * 口座に紐づいていない取引は、従来どおり相手（partnerId）単位でまとめる。
 */
export function buildRunningBalanceMap(
  transactions: TransactionWithPartner[],
): Map<string, number> {
  const grouped = new Map<string, TransactionWithPartner[]>();
  for (const t of transactions) {
    const key = t.ledgerId ?? `partner:${t.partnerId}`;
    const group = grouped.get(key) ?? [];
    grouped.set(key, [...group, t]);
  }

  const balanceMap = new Map<string, number>();
  for (const group of grouped.values()) {
    for (const t of calcRunningBalance(group)) {
      balanceMap.set(t.id, t.runningBalance);
    }
  }
  return balanceMap;
}
