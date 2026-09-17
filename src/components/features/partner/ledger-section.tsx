"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Settings2, ChevronRight } from "lucide-react";
import { LedgerFormDialog } from "./ledger-form-dialog";
import { InterestRateBadge } from "@/components/features/ledger/interest-rate-badge";
import type { LedgerWithBalance } from "@/actions/ledger";
import { cn } from "@/lib/utils";

type Props = {
  partnerId: string;
  ledgers: LedgerWithBalance[];
};

export function LedgerSection({ partnerId, ledgers }: Props) {
  const router = useRouter();
  const [addOpen, setAddOpen] = useState(false);

  return (
    <>
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-medium tracking-widest text-muted-foreground uppercase">
            口座
          </p>
          <button
            onClick={() => setAddOpen(true)}
            className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-md border border-border bg-transparent hover:bg-muted transition-colors"
          >
            <Plus className="size-3.5" />
            口座を追加
          </button>
        </div>

        <div className="space-y-2">
          {ledgers.map((ledger) => (
            <Link
              key={ledger.id}
              href={`/ledgers/${ledger.id}`}
              className="block w-full text-left rounded-xl border bg-card px-3.5 py-3 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-sm font-medium truncate">{ledger.title}</span>
                  <InterestRateBadge annualInterestRate={ledger.annualInterestRate} />
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      router.push(`/ledgers/${ledger.id}/settings`);
                    }}
                    aria-label="口座の設定"
                    className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  >
                    <Settings2 className="size-3.5" />
                  </button>
                  <ChevronRight className="size-4 text-muted-foreground" />
                </div>
              </div>
              <div className="mt-1.5 flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  貸出 ¥{ledger.totalLent.toLocaleString()} ・ 借入 ¥
                  {ledger.totalBorrowed.toLocaleString()}
                </span>
                <span
                  className={cn(
                    "font-semibold tabular-nums",
                    ledger.balance < 0 ? "text-destructive" : "text-foreground",
                  )}
                >
                  {ledger.balance < 0 ? "-" : ""}¥{Math.abs(ledger.balance).toLocaleString()}
                </span>
              </div>
              {ledger.breakdown.unpaidInterest > 0 && (
                <p className="mt-1 text-[11px] text-muted-foreground">
                  元本 ¥{ledger.breakdown.principal.toLocaleString()} ・ 未払利息{" "}
                  <span className="font-medium text-amber-600 dark:text-amber-400">
                    ¥{ledger.breakdown.unpaidInterest.toLocaleString()}
                  </span>
                </p>
              )}
            </Link>
          ))}
        </div>
      </div>

      <LedgerFormDialog partnerId={partnerId} open={addOpen} onOpenChange={setAddOpen} />
    </>
  );
}
