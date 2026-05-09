"use client";

import type { TransactionWithPartner } from "@/actions/transaction";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatDateTimeForDisplay } from "@/lib/dateUtils";
import { Pencil, Archive, ArchiveRestore, Trash2 } from "lucide-react";

type Props = {
  transaction: TransactionWithPartner | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (transaction: TransactionWithPartner) => void;
  onArchiveToggle: (transaction: TransactionWithPartner) => void;
  onDelete: (transaction: TransactionWithPartner) => void;
};

function DetailRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm">{children}</span>
    </div>
  );
}

export function TransactionDetailModal({
  transaction,
  open,
  onOpenChange,
  onEdit,
  onArchiveToggle,
  onDelete,
}: Props) {
  if (!transaction) return null;

  const isLending = transaction.amount > 0;
  const absAmount = Math.abs(transaction.amount);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader className="flex-row items-center justify-between space-y-0 pr-8">
          <DialogTitle>取引の詳細</DialogTitle>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={() => onEdit(transaction)}
            aria-label="編集"
          >
            <Pencil className="h-4 w-4" />
          </Button>
        </DialogHeader>
        <div className="space-y-4">
          <DetailRow label="相手">{transaction.partnerName}</DetailRow>
          <DetailRow label="金額">
            <span
              className={cn(
                "font-bold",
                isLending ? "text-foreground" : "text-destructive",
              )}
            >
              {isLending ? "貸し" : "借り"} ¥{absAmount.toLocaleString()}
            </span>
          </DetailRow>
          {transaction.description && (
            <DetailRow label="メモ">{transaction.description}</DetailRow>
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
        <div className="flex justify-between pt-4 border-t">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onArchiveToggle(transaction)}
          >
            {transaction.isArchived ? (
              <>
                <ArchiveRestore className="h-4 w-4 mr-2" />
                アーカイブ解除
              </>
            ) : (
              <>
                <Archive className="h-4 w-4 mr-2" />
                アーカイブ
              </>
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-destructive hover:text-destructive"
            onClick={() => onDelete(transaction)}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            削除
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
