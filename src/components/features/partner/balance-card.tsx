"use client";

import type { PartnerById } from "@/actions/partner";
import type { TransactionWithPartner } from "@/actions/transaction";

type Props = {
  partner: PartnerById;
  latestTransaction?: TransactionWithPartner;
};

function formatRelativeDate(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "今日";
  if (diffDays === 1) return "昨日";
  return `${diffDays}日前`;
}

function buildLatestSummary(tx: TransactionWithPartner): string {
  const dateStr = formatRelativeDate(new Date(tx.date));
  const sign = tx.amount > 0 ? "+" : "-";
  const absAmount = Math.abs(tx.amount).toLocaleString();
  const desc = tx.description ? ` · ${tx.description}` : "";
  return `${dateStr}${desc} ${sign}¥${absAmount}`;
}

export function BalanceCard({ partner, latestTransaction }: Props) {
  const absBalance = Math.abs(partner.balance);

  const balanceLabel =
    partner.balance > 0
      ? "あなたが貸している"
      : partner.balance < 0
        ? "あなたが借りている"
        : "精算済み";

  return (
    <div className="bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-4">
      <p className="text-xs text-emerald-600 dark:text-emerald-400 mb-1">
        {partner.name}との精算
      </p>
      <p className="text-xs text-emerald-600 dark:text-emerald-400 mb-1">
        {balanceLabel}
      </p>
      <p className="text-3xl font-medium text-emerald-900 dark:text-emerald-100 leading-tight mb-1">
        ¥{absBalance.toLocaleString()}
      </p>
      {latestTransaction && (
        <p className="text-xs text-emerald-600 dark:text-emerald-400">
          {buildLatestSummary(latestTransaction)}
        </p>
      )}
    </div>
  );
}
