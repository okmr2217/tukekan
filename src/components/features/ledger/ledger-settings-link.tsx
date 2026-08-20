"use client";

import { useState } from "react";
import { Pencil } from "lucide-react";
import { cn } from "@/lib/utils";
import { LedgerFormDialog } from "@/components/features/partner/ledger-form-dialog";
import type { LedgerById } from "@/actions/ledger";

type Props = {
  ledger: LedgerById;
};

export function LedgerSettingsLink({ ledger }: Props) {
  const [editOpen, setEditOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setEditOpen(true)}
        className="w-full flex items-center justify-between gap-2 rounded-xl border bg-card px-3.5 py-3 hover:bg-muted/50 transition-colors text-left"
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-sm font-medium truncate">{ledger.title}</span>
          <span
            className={cn(
              "shrink-0 text-[11px] font-semibold px-2 py-0.5 rounded-full",
              ledger.effectiveWeeklyInterestRate > 0
                ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400"
                : "bg-muted text-muted-foreground",
            )}
          >
            {ledger.effectiveWeeklyInterestRate > 0 ? `週${ledger.effectiveWeeklyInterestRate}%` : "無利子"}
          </span>
        </div>
        <Pencil className="size-3.5 text-muted-foreground shrink-0" />
      </button>

      <LedgerFormDialog
        partnerId={ledger.partnerId}
        ledger={ledger}
        open={editOpen}
        onOpenChange={setEditOpen}
      />
    </>
  );
}
