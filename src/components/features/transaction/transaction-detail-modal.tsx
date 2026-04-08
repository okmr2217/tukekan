"use client";

import type { TransactionWithPartner } from "@/actions/transaction";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { formatDateTimeForDisplay } from "@/lib/dateUtils";

type Props = {
  transaction: TransactionWithPartner | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm">{children}</span>
    </div>
  );
}

export function TransactionDetailModal({ transaction, open, onOpenChange }: Props) {
  if (!transaction) return null;

  const isLending = transaction.amount > 0;
  const absAmount = Math.abs(transaction.amount);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>取引の詳細</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <DetailRow label="相手">
            {transaction.partnerName}
          </DetailRow>
          <DetailRow label="金額">
            <span className={cn("font-bold", isLending ? "text-foreground" : "text-destructive")}>
              {isLending ? "貸し" : "借り"} ¥{absAmount.toLocaleString()}
            </span>
          </DetailRow>
          {transaction.description && (
            <DetailRow label="メモ">
              {transaction.description}
            </DetailRow>
          )}
          <DetailRow label="取引日時">
            {formatDateTimeForDisplay(transaction.date)}
          </DetailRow>
          <DetailRow label="作成日時">
            {formatDateTimeForDisplay(transaction.createdAt)}
          </DetailRow>
          <DetailRow label="更新日時">
            {formatDateTimeForDisplay(transaction.updatedAt)}
          </DetailRow>
        </div>
      </DialogContent>
    </Dialog>
  );
}
