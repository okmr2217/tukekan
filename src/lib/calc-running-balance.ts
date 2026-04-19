import type { TransactionWithPartner } from "@/actions/transaction";

export type TransactionWithRunningBalance = TransactionWithPartner & {
  runningBalance: number;
};

/**
 * 特定の相手との取引リストに対して、occurredAt (date) 昇順で累積した
 * ポスト残高（runningBalance）を付与した配列を返す。
 * 残高の符号：自分が貸している（受け取るべき）状態がプラス。
 */
export function calcRunningBalance(
  transactions: TransactionWithPartner[],
): TransactionWithRunningBalance[] {
  const sorted = [...transactions].sort(
    (a, b) => a.date.getTime() - b.date.getTime(),
  );

  let balance = 0;
  return sorted.map((t) => {
    balance += t.amount;
    return { ...t, runningBalance: balance };
  });
}

/**
 * 複数の相手が混在する取引リストに対して、相手ごとに残高を計算し
 * 取引ID → runningBalance のマップを返す。
 */
export function buildRunningBalanceMap(
  transactions: TransactionWithPartner[],
): Map<string, number> {
  const grouped = new Map<string, TransactionWithPartner[]>();
  for (const t of transactions) {
    const group = grouped.get(t.partnerId) ?? [];
    grouped.set(t.partnerId, [...group, t]);
  }

  const balanceMap = new Map<string, number>();
  for (const group of grouped.values()) {
    for (const t of calcRunningBalance(group)) {
      balanceMap.set(t.id, t.runningBalance);
    }
  }
  return balanceMap;
}
