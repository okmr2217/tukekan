"use client";

import { useEffect, useState } from "react";
import { Label } from "@/components/ui/label";
import { getLedgersByPartner } from "@/actions/ledger";
import { cn } from "@/lib/utils";

type LedgerOption = { id: string; title: string; weeklyInterestRate: number };

type Props = {
  partnerId: string;
  selectedId: string;
  onSelect: (id: string) => void;
  disabled?: boolean;
};

export function LedgerPickerField({
  partnerId,
  selectedId,
  onSelect,
  disabled = false,
}: Props) {
  const [ledgers, setLedgers] = useState<LedgerOption[]>([]);

  useEffect(() => {
    if (!partnerId) {
      setLedgers([]);
      return;
    }
    let active = true;
    getLedgersByPartner(partnerId).then((data) => {
      if (active) setLedgers(data);
    });
    return () => {
      active = false;
    };
  }, [partnerId]);

  useEffect(() => {
    if (ledgers.length > 0 && !ledgers.some((l) => l.id === selectedId)) {
      onSelect(ledgers[0].id);
    }
  }, [ledgers, selectedId, onSelect]);

  // 口座が1つ（または未取得）のときは選ぶ意味がないので何も出さない
  if (ledgers.length <= 1) return null;

  return (
    <div className="space-y-1.5">
      <Label>口座</Label>
      <div className="flex flex-wrap gap-1.5">
        {ledgers.map((l) => {
          const isSelected = selectedId === l.id;
          return (
            <button
              key={l.id}
              type="button"
              onClick={() => onSelect(l.id)}
              disabled={disabled}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm font-medium transition-all active:scale-[0.98]",
                isSelected
                  ? "bg-primary/10 border-primary/40 text-primary"
                  : "bg-muted border-transparent text-foreground/80 hover:bg-muted/80",
              )}
            >
              {l.title}
              {l.weeklyInterestRate > 0 && (
                <span
                  className={cn(
                    "text-[10px] font-semibold px-1.5 py-0.5 rounded-full",
                    isSelected
                      ? "bg-primary/15 text-primary"
                      : "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400",
                  )}
                >
                  週{l.weeklyInterestRate}%
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
