"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { updateTransactionLabelPreset } from "@/actions/auth";
import { TransactionLabelOptionButton } from "@/components/features/transaction/transaction-label-option-button";
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
            {TRANSACTION_LABEL_OPTIONS.map((option) => (
              <TransactionLabelOptionButton
                key={option.value}
                option={option}
                selected={selected === option.value}
                disabled={isPending}
                onSelect={() => handleSelect(option.value)}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
