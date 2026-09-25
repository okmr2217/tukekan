"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TransactionLabelOption } from "@/lib/transaction-labels";

type Props = {
  option: TransactionLabelOption;
  selected: boolean;
  disabled?: boolean;
  onSelect: () => void;
};

/** 取引ボタンの表示プリセットの選択肢。設定画面とオンボーディングで使う */
export function TransactionLabelOptionButton({
  option,
  selected,
  disabled,
  onSelect,
}: Props) {
  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={disabled}
      aria-pressed={selected}
      className={cn(
        "w-full text-left rounded-lg border-2 p-3 transition-colors disabled:opacity-60",
        selected
          ? "border-primary bg-primary/5"
          : "border-border hover:bg-accent",
      )}
    >
      <div className="flex items-center gap-1.5 mb-2">
        <span className="text-sm font-medium">{option.title}</span>
        {selected && <Check className="h-4 w-4 text-primary shrink-0" />}
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
}
