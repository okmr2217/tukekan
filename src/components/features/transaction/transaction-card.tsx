"use client";

import { Pencil } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { formatDateTimeForDisplay } from "@/lib/dateUtils";
import type { TransactionWithPartner } from "@/actions/transaction";

type Props = {
  transaction: TransactionWithPartner;
  onEdit: (transaction: TransactionWithPartner) => void;
};

export function TransactionCard({ transaction, onEdit }: Props) {
  const isLending = transaction.amount > 0;
  const absAmount = Math.abs(transaction.amount);
  const isGrayedOut = transaction.isArchived || transaction.partnerIsArchived;

  return (
    <div
      className={cn(
        "rounded-lg border bg-card p-4 shadow-sm",
        isGrayedOut && "opacity-50",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        {/* Left: partner, description, date */}
        <div className="flex flex-col gap-1 min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-sm">{transaction.partnerName}</span>
            {transaction.isArchived && (
              <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                アーカイブ
              </span>
            )}
          </div>
          {transaction.description && (
            <span className="text-sm text-muted-foreground truncate">
              {transaction.description}
            </span>
          )}
          <span className="text-xs text-muted-foreground">
            {formatDateTimeForDisplay(transaction.date)}
          </span>
        </div>

        {/* Right: amount + edit button */}
        <div className="flex items-center gap-1 shrink-0">
          <span
            className={cn(
              "font-bold text-base tabular-nums",
              isLending ? "text-foreground" : "text-destructive",
            )}
          >
            {isLending ? "+" : "-"}¥{absAmount.toLocaleString()}
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={() => onEdit(transaction)}
            aria-label="編集"
          >
            <Pencil className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
