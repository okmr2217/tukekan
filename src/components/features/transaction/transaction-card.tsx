"use client";

import {
  Pencil,
  MoreVertical,
  Archive,
  ArchiveRestore,
  Trash2,
  FileText,
} from "lucide-react";
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
  runningBalance: number;
  onEdit: (transaction: TransactionWithPartner) => void;
  onDetail: (transaction: TransactionWithPartner) => void;
  onArchiveToggle: (transaction: TransactionWithPartner) => void;
  onDelete: (transaction: TransactionWithPartner) => void;
};

export function TransactionCard({
  transaction,
  runningBalance,
  onEdit,
  onDetail,
  onArchiveToggle,
  onDelete,
}: Props) {
  const isLending = transaction.amount > 0;
  const absAmount = Math.abs(transaction.amount);
  const absBalance = Math.abs(runningBalance);
  const isGrayedOut = transaction.isArchived || transaction.partnerIsArchived;

  const createdStr = formatShortDate(transaction.createdAt);
  const updatedStr = formatShortDate(transaction.updatedAt);
  const showUpdated = createdStr !== updatedStr;

  return (
    <div
      className={cn(
        "rounded-xl border bg-card px-3 py-2 shadow-sm",
        isGrayedOut && "opacity-50",
      )}
    >
      {/* 上段: タイプバッジ・日時 ／ アクション */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <span
            className={cn(
              "shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold leading-none",
              isLending
                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400"
                : "bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400",
            )}
          >
            {isLending ? "貸し" : "借り"}
          </span>
          <span className="text-xs font-medium text-muted-foreground">
            {formatCompactTime(transaction.date)}
          </span>
          {transaction.isArchived && (
            <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded shrink-0 leading-none">
              アーカイブ
            </span>
          )}
        </div>
        <div className="flex items-center gap-0.5 shrink-0 -mr-1">
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

      {/* 中段: メモ ／ 金額 */}
      <div className="flex items-baseline justify-between gap-3 mt-0.5">
        <span className="font-medium text-sm text-foreground min-w-0">
          {transaction.description ? (
            transaction.description
          ) : (
            <span className="text-muted-foreground/60 text-xs">メモなし</span>
          )}
        </span>
        <span
          className={cn(
            "font-bold text-base tabular-nums shrink-0",
            isLending
              ? "text-emerald-600 dark:text-emerald-400"
              : "text-destructive",
          )}
        >
          {isLending ? "+" : "-"}¥{absAmount.toLocaleString()}
        </span>
      </div>

      {/* 下段: 作成日 ／ 残高 */}
      <div className="flex items-center justify-between mt-0.75">
        <span className="text-xs text-muted-foreground/60">
          作成 {createdStr}
          {showUpdated && ` · 更新 ${updatedStr}`}
        </span>
        <div className="flex items-center gap-1">
          <span className="text-xs text-muted-foreground">残高</span>
          <span
            className={cn(
              "text-xs tabular-nums",
              runningBalance > 0
                ? "text-emerald-600 dark:text-emerald-400"
                : runningBalance < 0
                  ? "text-destructive"
                  : "text-muted-foreground",
            )}
          >
            {runningBalance < 0 ? "-" : ""}¥{absBalance.toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
}
