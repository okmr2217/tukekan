"use client";

import type { TransactionWithPartner } from "@/actions/transaction";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatDateTimeForDisplay } from "@/lib/date-utils";
import {
  Pencil,
  Archive,
  ArchiveRestore,
  Trash2,
  ArrowDownLeft,
  ArrowUpRight,
  Calendar,
  History,
} from "lucide-react";

type Props = {
  transaction: TransactionWithPartner | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (transaction: TransactionWithPartner) => void;
  onArchiveToggle: (transaction: TransactionWithPartner) => void;
  onDelete: (transaction: TransactionWithPartner) => void;
};

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
  const amountColorClass = isLending
    ? "text-emerald-600 dark:text-emerald-400"
    : "text-destructive";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-0 p-0 overflow-hidden">
        {/* ヘッダー */}
        <DialogHeader className="px-4 py-3.5 border-b space-y-0">
          <DialogTitle className="text-[15px] font-medium">
            取引の詳細
          </DialogTitle>
        </DialogHeader>

        {/* 金額ヒーロー */}
        <div className="px-4 pt-6 pb-4 text-center">
          <Badge
            variant="secondary"
            className={cn(
              "mb-2.5 gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-medium",
              isLending
                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
                : "bg-destructive/10 text-destructive",
            )}
          >
            {isLending ? (
              <>
                <ArrowUpRight className="h-3 w-3" />
                貸し
              </>
            ) : (
              <>
                <ArrowDownLeft className="h-3 w-3" />
                借り
              </>
            )}
          </Badge>
          <div
            className={cn(
              "text-[32px] font-medium leading-none tracking-tight",
              amountColorClass,
            )}
          >
            ¥{absAmount.toLocaleString()}
          </div>
          <div className="mt-2 text-[13px] text-muted-foreground">
            {transaction.partnerName} さん{isLending ? "から" : "に"}
          </div>
        </div>

        {/* メモ（存在する時のみ） */}
        {transaction.description && (
          <div className="px-4 pb-3">
            <div className="rounded-md bg-muted/50 px-3.5 py-3">
              <div className="mb-1 text-[11px] text-muted-foreground">メモ</div>
              <div className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                {transaction.description}
              </div>
            </div>
          </div>
        )}

        {/* 取引日時 */}
        <div className="px-4 pb-3">
          <div className="flex items-center gap-2.5 rounded-md bg-muted/50 px-3.5 py-2.5">
            <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="text-[13px] text-muted-foreground">取引日時</span>
            <span className="ml-auto text-[13px]">
              {formatDateTimeForDisplay(transaction.date)}
            </span>
          </div>
        </div>

        {/* メタ情報（作成・更新日時） */}
        <div className="px-4 pb-4">
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground/80">
            <History className="h-3 w-3" />
            <span>
              作成 {formatDateTimeForDisplay(transaction.createdAt)} ・ 更新{" "}
              {formatDateTimeForDisplay(transaction.updatedAt)}
            </span>
          </div>
        </div>

        {/* アクションフッター */}
        <div className="flex gap-2 border-t px-4 py-3">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => onEdit(transaction)}
          >
            <Pencil className="h-3.5 w-3.5 mr-1.5" />
            編集
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => onArchiveToggle(transaction)}
          >
            {transaction.isArchived ? (
              <>
                <ArchiveRestore className="h-3.5 w-3.5 mr-1.5" />
                解除
              </>
            ) : (
              <>
                <Archive className="h-3.5 w-3.5 mr-1.5" />
                アーカイブ
              </>
            )}
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={() => onDelete(transaction)}
            aria-label="削除"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
