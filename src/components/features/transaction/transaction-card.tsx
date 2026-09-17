"use client";

import Link from "next/link";
import { StickyNote } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCompactTime, formatShortDate } from "@/lib/date-utils";
import type { TransactionWithPartner } from "@/actions/transaction";
import { isInterestKind } from "@/lib/transaction-kind";

type Props = {
  transaction: TransactionWithPartner;
  runningBalance: number;
  onClick: () => void;
  showPartnerName?: boolean;
};

export function TransactionCard({
  transaction,
  runningBalance,
  onClick,
  showPartnerName = false,
}: Props) {
  const isLending = transaction.amount > 0;
  const isInterest = isInterestKind(transaction.kind);
  const absAmount = Math.abs(transaction.amount);
  const absBalance = Math.abs(runningBalance);
  const isGrayedOut = transaction.isArchived || transaction.partnerIsArchived;

  const createdStr = formatShortDate(transaction.createdAt);
  const updatedStr = formatShortDate(transaction.updatedAt);
  const showUpdated = createdStr !== updatedStr;

  return (
    <div
      className={cn(
        "rounded-xl border bg-card px-3 py-2 shadow-sm cursor-pointer hover:bg-accent/50 transition-colors",
        isGrayedOut && "opacity-50",
      )}
      onClick={onClick}
    >
      {/* 上段: タイプバッジ・日時 */}
      <div className="flex items-center gap-1.5 min-w-0">
        <span
          className={cn(
            "shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold leading-none",
            isLending
              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400"
              : "bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400",
          )}
        >
          {isLending ? "貸し" : "借り"}
        </span>
        {isInterest && (
          <span className="shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold leading-none bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400">
            利息
          </span>
        )}
        <span className="text-xs font-medium text-muted-foreground">
          {formatCompactTime(transaction.date)}
        </span>
        {showPartnerName && (
          <Link
            href={`/partners/${transaction.partnerId}`}
            className="text-xs font-medium text-foreground truncate max-w-[8rem] hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            {transaction.partnerName}
          </Link>
        )}
        {transaction.isArchived && (
          <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded shrink-0 leading-none">
            アーカイブ
          </span>
        )}
      </div>

      {/* 中段: 用途 ／ 金額 */}
      <div className="flex items-baseline justify-between gap-3 mt-0.5">
        <span className="font-medium text-sm text-foreground min-w-0 flex items-baseline gap-1">
          {transaction.purpose ? (
            <span className="truncate">{transaction.purpose}</span>
          ) : (
            <span className="text-muted-foreground/60 text-xs">用途なし</span>
          )}
          {transaction.description && (
            <StickyNote
              className="size-3 shrink-0 self-center text-muted-foreground/60"
              aria-label="メモあり"
            />
          )}
        </span>
        <span
          className={cn(
            "font-bold text-base tabular-nums shrink-0",
            isLending
              ? "text-emerald-600 dark:text-emerald-400"
              : "text-destructive",
          )}
        >
          {isLending ? "+" : "-"}¥{absAmount.toLocaleString()}
        </span>
      </div>

      {/* 下段: 作成日 ／ 残高 */}
      <div className="flex items-center justify-between mt-0.75">
        <span className="text-xs text-muted-foreground/60">
          作成 {createdStr}
          {showUpdated && ` · 更新 ${updatedStr}`}
        </span>
        <div className="flex items-center gap-1">
          <span className="text-xs text-muted-foreground">残高</span>
          <span
            className={cn(
              "text-xs tabular-nums",
              runningBalance > 0
                ? "text-emerald-600 dark:text-emerald-400"
                : runningBalance < 0
                  ? "text-destructive"
                  : "text-muted-foreground",
            )}
          >
            {runningBalance < 0 ? "-" : ""}¥{absBalance.toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
}
