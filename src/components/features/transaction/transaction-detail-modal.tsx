"use client";

import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  ResponsiveDialogBody,
  ResponsiveDialogFooter,
} from "@/components/ui/responsive-dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatDateTimeForDisplay } from "@/lib/date-utils";
import {
  describeBalanceRole,
  describeTransaction,
  formatTransactionAmount,
  formatYen,
  transactionSentence,
  type TransactionViewpoint,
} from "@/lib/transaction-wording";
import { TONE_TEXT, movementChipClass } from "./transaction-tone";
import type { TransactionCardData } from "./transaction-card";
import {
  Pencil,
  Archive,
  ArchiveRestore,
  Trash2,
  ArrowRight,
} from "lucide-react";

export type TransactionDetailData = TransactionCardData & {
  /** 認証ページだけが持つ。公開ページには渡さない */
  createdAt?: Date;
  updatedAt?: Date;
};

/** 認証ページだけで出すフッターの操作 */
export type TransactionDetailActions<T> = {
  onEdit: (transaction: T) => void;
  onArchiveToggle: (transaction: T) => void;
  onDelete: (transaction: T) => void;
};

type Props<T extends TransactionDetailData> = {
  transaction: T | null;
  /** その取引を反映した直後の残高（記録者視点の符号のまま渡す） */
  runningBalance: number;
  /** 見ている人。公開ページは "partner" */
  viewpoint: TransactionViewpoint;
  /** 見ている人から見た相手の名前（認証ページ = 相手、公開ページ = 記録者） */
  counterpartyName: string;
  ledgerTitle?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** 渡したときだけフッターを出す。公開ページでは渡さない */
  actions?: TransactionDetailActions<T>;
};

function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3 px-3.5 py-2.5">
      <span className="shrink-0 text-[12px] text-muted-foreground">
        {label}
      </span>
      <span className="min-w-0 text-right text-[13px] break-words">
        {children}
      </span>
    </div>
  );
}

/**
 * 取引の詳細。認証ページ・公開ページで共通。
 *
 * 「取引」と「残高」をセクションで分け、残高は取引前→取引後を
 * 債権／債務つきで並べる。編集などのフッターは認証ページだけ。
 */
export function TransactionDetailModal<T extends TransactionDetailData>({
  transaction,
  runningBalance,
  viewpoint,
  counterpartyName,
  ledgerTitle,
  open,
  onOpenChange,
  actions,
}: Props<T>) {
  if (!transaction) return null;

  const statement = describeTransaction(transaction, runningBalance, viewpoint);
  const isInterest = statement.movement === "interest";
  const before = describeBalanceRole(statement.previousBalance);
  const after = describeBalanceRole(statement.balance);
  // 作成・更新は記録者だけの情報なので、createdAt を持つ認証ページでしか出ない
  const createdStr = transaction.createdAt
    ? formatDateTimeForDisplay(transaction.createdAt)
    : null;
  const updatedStr = transaction.updatedAt
    ? formatDateTimeForDisplay(transaction.updatedAt)
    : null;

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent>
        <ResponsiveDialogHeader className="border-b py-3.5 pb-3.5">
          <ResponsiveDialogTitle className="text-[15px] font-medium">
            取引の詳細
          </ResponsiveDialogTitle>
        </ResponsiveDialogHeader>

        <ResponsiveDialogBody>
          {/* 金額ヒーロー */}
          <div className="pt-6 pb-5 text-center">
            <div className="mb-2.5 flex items-center justify-center gap-1.5">
              <span
                className={cn(
                  "rounded-full px-2.5 py-0.5 text-[11px] font-semibold leading-5",
                  movementChipClass(statement.tone, isInterest),
                )}
              >
                {statement.label}
              </span>
              {transaction.isArchived && (
                <span className="rounded-full bg-muted px-2.5 py-0.5 text-[11px] leading-5 text-muted-foreground">
                  アーカイブ済み
                </span>
              )}
            </div>
            {/* 金額は色を持たせない（カードと揃える） */}
            <div className="text-[32px] font-medium leading-none tracking-tight tabular-nums text-foreground">
              {formatTransactionAmount(statement.amount)}
            </div>
            <div className="mt-2 text-[13px] text-muted-foreground">
              {transactionSentence(statement, counterpartyName)}
            </div>
          </div>

          {/* 取引の情報 */}
          <p className="mb-1.5 text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
            取引
          </p>
          <div className="divide-y divide-border/60 rounded-md bg-muted/50">
            <Row label="用途">
              {transaction.purpose ?? (
                <span className="text-muted-foreground/60">なし</span>
              )}
            </Row>
            {transaction.description && (
              <Row label="メモ">
                <span className="whitespace-pre-wrap">
                  {transaction.description}
                </span>
              </Row>
            )}
            <Row label="取引日時">
              {formatDateTimeForDisplay(transaction.date)}
            </Row>
            {ledgerTitle && <Row label="口座">{ledgerTitle}</Row>}
          </div>

          {/* 残高の情報 */}
          <p className="mt-4 mb-1.5 text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
            残高
          </p>
          <div className="rounded-md bg-muted/50 px-3.5 py-3">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <div className="text-[11px] text-muted-foreground">取引前</div>
                <div className="mt-0.5 text-[11px] text-muted-foreground">
                  {before.label}
                </div>
                <div
                  className={cn(
                    "text-[15px] font-medium tabular-nums",
                    TONE_TEXT[before.tone],
                  )}
                >
                  {formatYen(before.absAmount)}
                </div>
              </div>
              <ArrowRight className="size-4 shrink-0 text-muted-foreground/60" />
              <div className="min-w-0 text-right">
                <div className="text-[11px] text-muted-foreground">取引後</div>
                <div className="mt-0.5 text-[11px] text-muted-foreground">
                  {after.label}
                </div>
                <div
                  className={cn(
                    "text-[18px] font-semibold tabular-nums",
                    TONE_TEXT[after.tone],
                  )}
                >
                  {formatYen(after.absAmount)}
                </div>
              </div>
            </div>
            <p className="mt-2.5 border-t border-border/60 pt-2 text-[11px] text-muted-foreground">
              {after.tone === "settled"
                ? `${counterpartyName}さんとは精算済みです`
                : after.tone === "credit"
                  ? `${counterpartyName}さんから受け取る残高（債権）です`
                  : `${counterpartyName}さんに返す残高（債務）です`}
            </p>
          </div>

          {/* メタ情報（認証ページのみ） */}
          {createdStr ? (
            <p className="pt-3 pb-4 text-[11px] text-muted-foreground/80">
              作成 {createdStr}
              {updatedStr && updatedStr !== createdStr && ` ・ 更新 ${updatedStr}`}
            </p>
          ) : (
            <div className="pb-4" />
          )}
        </ResponsiveDialogBody>

        {actions && (
          <ResponsiveDialogFooter className="border-t">
            <div className="flex w-full gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => actions.onEdit(transaction)}
              >
                <Pencil className="mr-1.5 h-3.5 w-3.5" />
                編集
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => actions.onArchiveToggle(transaction)}
              >
                {transaction.isArchived ? (
                  <>
                    <ArchiveRestore className="mr-1.5 h-3.5 w-3.5" />
                    解除
                  </>
                ) : (
                  <>
                    <Archive className="mr-1.5 h-3.5 w-3.5" />
                    アーカイブ
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                onClick={() => actions.onDelete(transaction)}
                aria-label="削除"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </ResponsiveDialogFooter>
        )}
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
