"use client";

import { useState } from "react";
import { Plus, Pencil } from "lucide-react";
import { LedgerFormDialog } from "./ledger-form-dialog";
import type { LedgerWithBalance } from "@/actions/ledger";
import { cn } from "@/lib/utils";

type Props = {
  partnerId: string;
  ledgers: LedgerWithBalance[];
};

export function LedgerSection({ partnerId, ledgers }: Props) {
  const [addOpen, setAddOpen] = useState(false);
  const [editing, setEditing] = useState<LedgerWithBalance | undefined>();

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
            <button
              key={ledger.id}
              onClick={() => setEditing(ledger)}
              className="w-full text-left rounded-xl border bg-card px-3.5 py-3 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-sm font-medium truncate">{ledger.title}</span>
                  <span
                    className={cn(
                      "shrink-0 text-[11px] font-semibold px-2 py-0.5 rounded-full",
                      ledger.weeklyInterestRate > 0
                        ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400"
                        : "bg-muted text-muted-foreground",
                    )}
                  >
                    {ledger.weeklyInterestRate > 0
                      ? `週${ledger.weeklyInterestRate}%`
                      : "無利子"}
                  </span>
                </div>
                <Pencil className="size-3.5 text-muted-foreground shrink-0" />
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
            </button>
          ))}
        </div>
      </div>

      <LedgerFormDialog partnerId={partnerId} open={addOpen} onOpenChange={setAddOpen} />
      <LedgerFormDialog
        partnerId={partnerId}
        ledger={editing}
        open={!!editing}
        onOpenChange={(open) => !open && setEditing(undefined)}
      />
    </>
  );
}
