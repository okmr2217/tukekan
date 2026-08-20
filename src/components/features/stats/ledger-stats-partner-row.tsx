"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PartnerLedgerStat } from "@/actions/ledger-stats";

function yen(amount: number) {
  return `${amount < 0 ? "-" : ""}¥${Math.abs(amount).toLocaleString()}`;
}

export function LedgerStatsPartnerRow({ stat }: { stat: PartnerLedgerStat }) {
  const [open, setOpen] = useState(false);
  const multiLedger = stat.ledgers.length > 1;

  return (
    <div className="rounded-lg border overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-3 px-3.5 py-3 hover:bg-muted/40 transition-colors text-left"
      >
        <div className="flex items-center gap-2 min-w-0">
          {open ? (
            <ChevronDown className="size-4 text-muted-foreground shrink-0" />
          ) : (
            <ChevronRight className="size-4 text-muted-foreground shrink-0" />
          )}
          <span className="text-sm font-medium truncate">{stat.partnerName}</span>
          {multiLedger && (
            <span className="shrink-0 text-[11px] text-muted-foreground border rounded-full px-1.5 py-0.5">
              {stat.ledgers.length}口座
            </span>
          )}
        </div>
        <div className="flex items-center gap-4 shrink-0 text-sm">
          {stat.estimatedInterestTotal > 0 && (
            <span className="hidden sm:inline text-xs font-semibold text-amber-600 dark:text-amber-400 tabular-nums">
              見込み利子 +{stat.estimatedInterestTotal.toLocaleString()}円
            </span>
          )}
          <span
            className={cn(
              "font-semibold tabular-nums",
              stat.balance < 0 ? "text-destructive" : "text-foreground",
            )}
          >
            {yen(stat.balance)}
          </span>
        </div>
      </button>

      {open && (
        <div className="border-t divide-y">
          {stat.ledgers.map((ledger) => (
            <div
              key={ledger.ledgerId}
              className="px-3.5 py-2.5 pl-9 grid grid-cols-2 gap-x-3 gap-y-1 md:grid-cols-6 md:items-center text-xs"
            >
              <div className="col-span-2 md:col-span-1 font-medium text-sm">
                {ledger.title}
              </div>
              <div>
                <span
                  className={cn(
                    "inline-block text-[11px] font-semibold px-2 py-0.5 rounded-full",
                    ledger.effectiveWeeklyInterestRate > 0
                      ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400"
                      : "bg-muted text-muted-foreground",
                  )}
                >
                  {ledger.effectiveWeeklyInterestRate > 0 ? `週${ledger.effectiveWeeklyInterestRate}%` : "無利子"}
                </span>
              </div>
              <div className="text-muted-foreground md:text-foreground">
                <span className="md:hidden">残高 </span>
                <span
                  className={cn(
                    "tabular-nums font-medium",
                    ledger.balance < 0 ? "text-destructive" : "",
                  )}
                >
                  {yen(ledger.balance)}
                </span>
              </div>
              <div className="text-muted-foreground tabular-nums">
                貸出 ¥{ledger.totalLent.toLocaleString()}
              </div>
              <div className="text-muted-foreground tabular-nums">
                借入 ¥{ledger.totalBorrowed.toLocaleString()}
              </div>
              <div className="flex items-center justify-between gap-2">
                {ledger.estimatedInterest > 0 ? (
                  <span className="text-amber-600 dark:text-amber-400 font-semibold tabular-nums">
                    見込み +¥{ledger.estimatedInterest.toLocaleString()}
                    <span className="text-muted-foreground font-normal">
                      （{ledger.elapsedDays}日）
                    </span>
                  </span>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
                <Link
                  href={`/partners/${stat.partnerId}`}
                  className="text-[11px] text-primary hover:underline shrink-0"
                >
                  口座を開く
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
