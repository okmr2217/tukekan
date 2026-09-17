"use client";

import { useState, useTransition } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { updateTransactionLabelPreset } from "@/actions/auth";
import {
  TRANSACTION_LABEL_OPTIONS,
  type TransactionLabelPreset,
} from "@/lib/transaction-labels";

type Props = {
  preset: TransactionLabelPreset;
};

export function TransactionLabelSection({ preset }: Props) {
  const [selected, setSelected] = useState<TransactionLabelPreset>(preset);
  const [isPending, startTransition] = useTransition();

  const handleSelect = (value: TransactionLabelPreset) => {
    if (value === selected || isPending) return;
    const previous = selected;
    setSelected(value);
    startTransition(async () => {
      const result = await updateTransactionLabelPreset(value);
      if (result.error) {
        setSelected(previous);
        toast.error(result.error);
        return;
      }
      toast.success("取引ボタンの表示を変更しました");
    });
  };

  return (
    <section>
      <h2 className="text-xs font-medium text-muted-foreground mb-2">取引</h2>
      <div className="bg-card rounded-lg border border-border overflow-hidden">
        <div className="p-4">
          <div className="text-sm font-medium mb-1">取引ボタンの表示</div>
          <p className="text-xs text-muted-foreground mb-3">
            金額の記録のしかたは変わりません。ボタンに出す言い方と、開いたときに選ばれている側だけが変わります。
          </p>

          <div className="space-y-2">
            {TRANSACTION_LABEL_OPTIONS.map((option) => {
              const isSelected = selected === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleSelect(option.value)}
                  disabled={isPending}
                  aria-pressed={isSelected}
                  className={cn(
                    "w-full text-left rounded-lg border-2 p-3 transition-colors disabled:opacity-60",
                    isSelected
                      ? "border-primary bg-primary/5"
                      : "border-border hover:bg-accent",
                  )}
                >
                  <div className="flex items-center gap-1.5 mb-2">
                    <span className="text-sm font-medium">{option.title}</span>
                    {isSelected && (
                      <Check className="h-4 w-4 text-primary shrink-0" />
                    )}
                    <span className="text-xs text-muted-foreground truncate">
                      {option.hint}
                    </span>
                  </div>

                  {/* 実際のボタンと同じ並び（+ が左） */}
                  <div className="flex gap-2">
                    <span
                      className={cn(
                        "flex-1 rounded-md border px-2 py-1.5 text-center text-xs font-medium",
                        option.defaultIsLending
                          ? "bg-emerald-600 text-white border-emerald-600"
                          : "border-emerald-300 text-emerald-700 dark:border-emerald-800 dark:text-emerald-400",
                      )}
                    >
                      {option.lendingLabel}
                    </span>
                    <span
                      className={cn(
                        "flex-1 rounded-md border px-2 py-1.5 text-center text-xs font-medium",
                        option.defaultIsLending
                          ? "border-red-300 text-red-600 dark:border-red-900 dark:text-red-400"
                          : "bg-red-600 text-white border-red-600",
                      )}
                    >
                      {option.borrowingLabel}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
