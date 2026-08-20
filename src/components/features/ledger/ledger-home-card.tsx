"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { LedgerForHome } from "@/actions/ledger";
import { formatRelativeDay } from "@/lib/date-utils";

type Props = {
  ledger: LedgerForHome;
};

export function LedgerHomeCard({ ledger }: Props) {
  const { lastTransaction } = ledger;
  const absBalance = Math.abs(ledger.balance);
  const isDefaultLedger = ledger.title === "通常";

  return (
    <Link
      href={`/ledgers/${ledger.id}`}
      className="flex items-center gap-3 rounded-xl border bg-card px-4 py-3 shadow-sm hover:bg-muted/50 transition-colors active:scale-[0.99]"
    >
      {/* Avatar */}
      <div className="size-10 rounded-full bg-muted flex items-center justify-center text-sm font-semibold shrink-0">
        {ledger.partnerName[0]}
      </div>

      {/* Name + last transaction */}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm flex items-center gap-1.5 truncate">
          <span className="truncate">{ledger.partnerName}</span>
          {!isDefaultLedger && (
            <span className="shrink-0 text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">
              {ledger.title}
            </span>
          )}
          {ledger.effectiveWeeklyInterestRate > 0 && (
            <span className="shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400">
              週{ledger.effectiveWeeklyInterestRate}%
            </span>
          )}
        </p>
        {lastTransaction ? (
          <p className="text-xs text-muted-foreground mt-0.5 truncate">
            {formatRelativeDay(new Date(lastTransaction.date))}
            {lastTransaction.description
              ? ` · ${lastTransaction.description}`
              : ""}
            {" "}
            <span
              className={cn(
                lastTransaction.amount > 0 ? "text-foreground" : "text-destructive",
              )}
            >
              {lastTransaction.amount > 0 ? "+" : "-"}
              ¥{Math.abs(lastTransaction.amount).toLocaleString()}
            </span>
          </p>
        ) : (
          <p className="text-xs text-muted-foreground mt-0.5">取引なし</p>
        )}
      </div>

      {/* Balance */}
      <div className="flex items-center gap-1.5 shrink-0">
        <span
          className={cn(
            "font-bold text-base tabular-nums",
            ledger.balance < 0 ? "text-destructive" : "text-foreground",
          )}
        >
          {ledger.balance < 0 ? "-" : ""}¥{absBalance.toLocaleString()}
        </span>
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
      </div>
    </Link>
  );
}
