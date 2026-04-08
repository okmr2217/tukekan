"use client";

import { Pencil, MoreVertical, Archive, ArchiveRestore, Trash2, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatCompactTime, formatShortDate } from "@/lib/dateUtils";
import type { TransactionWithPartner } from "@/actions/transaction";

type Props = {
  transaction: TransactionWithPartner;
  onEdit: (transaction: TransactionWithPartner) => void;
  onDetail: (transaction: TransactionWithPartner) => void;
  onArchiveToggle: (transaction: TransactionWithPartner) => void;
  onDelete: (transaction: TransactionWithPartner) => void;
};

export function TransactionCard({ transaction, onEdit, onDetail, onArchiveToggle, onDelete }: Props) {
  const isLending = transaction.amount > 0;
  const absAmount = Math.abs(transaction.amount);
  const isGrayedOut = transaction.isArchived || transaction.partnerIsArchived;

  const createdStr = formatShortDate(transaction.createdAt);
  const updatedStr = formatShortDate(transaction.updatedAt);
  const showUpdated = createdStr !== updatedStr;

  return (
    <div
      className={cn(
        "rounded-xl border bg-card px-3.5 py-2.5 shadow-sm space-y-1",
        isGrayedOut && "opacity-50",
      )}
    >
      {/* 上段: 取引日時・作成日 ／ ボタン類 */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xs font-medium text-muted-foreground">
            {formatCompactTime(transaction.date)}
          </span>
          <span className="text-xs text-muted-foreground/60">
            作成 {createdStr}
            {showUpdated && ` · 更新 ${updatedStr}`}
          </span>
        </div>
        <div className="flex items-center gap-1 shrink-0 -mr-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-muted-foreground hover:text-foreground"
            onClick={() => onEdit(transaction)}
            aria-label="編集"
          >
            <Pencil className="h-3 w-3" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-muted-foreground hover:text-foreground"
                aria-label="その他の操作"
              >
                <MoreVertical className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onDetail(transaction)}>
                <FileText className="h-4 w-4 mr-2" />
                詳細
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onArchiveToggle(transaction)}>
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
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onDelete(transaction)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                削除
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* 中段: 相手名 ／ 金額 */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="font-semibold text-sm truncate">{transaction.partnerName}</span>
          {transaction.isArchived && (
            <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded-md shrink-0">
              アーカイブ
            </span>
          )}
        </div>
        <span
          className={cn(
            "font-bold text-base tabular-nums shrink-0",
            isLending ? "text-foreground" : "text-destructive",
          )}
        >
          {isLending ? "+" : "-"}¥{absAmount.toLocaleString()}
        </span>
      </div>

      {/* 下段: メモ（ある場合のみ） */}
      {transaction.description && (
        <div className="-mt-0.5">
          <span className="text-xs text-muted-foreground leading-relaxed">
            {transaction.description}
          </span>
        </div>
      )}
    </div>
  );
}
