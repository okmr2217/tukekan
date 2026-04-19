"use client";

import { cn } from "@/lib/utils";
import type { PartnerById } from "@/actions/partner";
import type { TransactionWithPartner } from "@/actions/transaction";

type Props = {
  partner: PartnerById;
  userName: string;
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

type BalanceDisplayProps = {
  balance: number;
  lenderName: string;
  borrowerName: string;
  latestSummary?: string;
};

function BalanceDisplay({ balance, lenderName, borrowerName, latestSummary }: BalanceDisplayProps) {
  const absBalance = Math.abs(balance);

  return (
    <div className="bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-4">
      {balance === 0 ? (
        <>
          <p className="text-xs text-emerald-600 dark:text-emerald-400 mb-1">精算済み</p>
          <p className="text-3xl font-medium text-emerald-900 dark:text-emerald-100 leading-tight mb-1">
            ¥0
          </p>
        </>
      ) : (
        <>
          <div className="flex items-center gap-1.5 mb-1">
            <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">
              {borrowerName}
            </span>
            <span className="text-xs text-emerald-500 dark:text-emerald-500">→</span>
            <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">
              {lenderName}
            </span>
            <span
              className={cn(
                "ml-1 text-[10px] font-semibold px-1.5 py-0.5 rounded leading-none",
                "bg-emerald-200 text-emerald-800 dark:bg-emerald-800 dark:text-emerald-200",
              )}
            >
              未精算
            </span>
          </div>
          <p className="text-3xl font-medium text-emerald-900 dark:text-emerald-100 leading-tight mb-1">
            ¥{absBalance.toLocaleString()}
          </p>
        </>
      )}
      {latestSummary && (
        <p className="text-xs text-emerald-600 dark:text-emerald-400">{latestSummary}</p>
      )}
    </div>
  );
}

export function BalanceCard({ partner, userName, latestTransaction }: Props) {
  const latestSummary = latestTransaction ? buildLatestSummary(latestTransaction) : undefined;

  // balance > 0: ユーザーが貸している（相手が借りている）
  // balance < 0: 相手が貸している（ユーザーが借りている）
  const lenderName = partner.balance >= 0 ? userName : partner.name;
  const borrowerName = partner.balance >= 0 ? partner.name : userName;

  return (
    <BalanceDisplay
      balance={partner.balance}
      lenderName={lenderName}
      borrowerName={borrowerName}
      latestSummary={latestSummary}
    />
  );
}

type SharedBalanceCardProps = {
  balance: number;
  ownerName: string;
  partnerName: string;
};

export function SharedBalanceCard({ balance, ownerName, partnerName }: SharedBalanceCardProps) {
  // 共有ページでも同じロジック: balance > 0 = ownerが貸している
  const lenderName = balance >= 0 ? ownerName : partnerName;
  const borrowerName = balance >= 0 ? partnerName : ownerName;

  return (
    <BalanceDisplay
      balance={balance}
      lenderName={lenderName}
      borrowerName={borrowerName}
    />
  );
}
