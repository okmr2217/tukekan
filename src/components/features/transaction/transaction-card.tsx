"use client";

import Link from "next/link";
import { StickyNote } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatTransactionTime } from "@/lib/date-utils";
import {
  describeBalanceRole,
  describeTransaction,
  formatTransactionAmount,
  formatYen,
  type TransactionViewpoint,
} from "@/lib/transaction-wording";
import { TONE_TEXT, movementChipClass } from "./transaction-tone";

/**
 * カードに出すのに必要な最小限の取引。
 * 認証ページの TransactionWithPartner も、公開ページの取引もこの形を満たす。
 */
export type TransactionCardData = {
  id: string;
  amount: number;
  purpose: string | null;
  description: string | null;
  date: Date;
  kind?: string | null;
  isArchived?: boolean;
};

type Props = {
  transaction: TransactionCardData;
  /** その取引を反映した直後の残高（記録者視点の符号のまま渡す） */
  runningBalance: number;
  /** 見ている人。公開ページは "partner" を渡して符号と文言を相手視点にする */
  viewpoint: TransactionViewpoint;
  onClick?: () => void;
  /** 相手名のチップ（全取引一覧のように相手が混ざるときだけ） */
  partnerName?: string;
  partnerHref?: string;
  /** 口座名のチップ（口座が混ざるときだけ） */
  ledgerTitle?: string;
  /** アーカイブ済みなどで控えめに出す */
  dimmed?: boolean;
};

/**
 * 取引カード。認証ページ・公開ページで共通。
 *
 * 左 = 取引の情報（名目・文脈・日時・用途・金額）、
 * 右 = 残高の情報（この取引の後に債権がいくら／債務がいくら）と、役割で列を分ける。
 * 残高を右の固定幅カラムに置くことで、一覧では残高が縦にそろって推移を追える。
 */
export function TransactionCard({
  transaction,
  runningBalance,
  viewpoint,
  onClick,
  partnerName,
  partnerHref,
  ledgerTitle,
  dimmed = false,
}: Props) {
  const statement = describeTransaction(transaction, runningBalance, viewpoint);
  const balanceRole = describeBalanceRole(statement.balance);
  const isInterest = statement.movement === "interest";

  return (
    <div
      className={cn(
        "flex items-stretch overflow-hidden rounded-xl border bg-card shadow-sm transition-colors",
        onClick && "cursor-pointer hover:bg-accent/50",
        dimmed && "opacity-50",
      )}
      onClick={onClick}
      {...(onClick
        ? {
            role: "button",
            tabIndex: 0,
            onKeyDown: (e: React.KeyboardEvent) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClick();
              }
            },
          }
        : {})}
    >
      {/* 左: 取引の情報 */}
      <div className="min-w-0 flex-1 px-3 py-2.5">
        {/* 名目・文脈・日時 */}
        <div className="flex min-w-0 items-center gap-1.5">
          <span
            className={cn(
              "shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold leading-none",
              movementChipClass(statement.tone, isInterest),
            )}
          >
            {statement.label}
          </span>
          {transaction.isArchived && (
            <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 text-[10px] leading-none text-muted-foreground">
              アーカイブ
            </span>
          )}
          {/* 口座・相手は幅が足りなければ削れてよい。名目と日時は常に残す */}
          <div className="flex min-w-0 flex-1 items-center gap-1.5 overflow-hidden">
            {ledgerTitle && (
              <span className="min-w-0 max-w-[6rem] truncate rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium leading-none text-muted-foreground">
                {ledgerTitle}
              </span>
            )}
            {partnerName &&
              (partnerHref ? (
                <Link
                  href={partnerHref}
                  className="truncate text-xs font-medium text-foreground hover:underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  {partnerName}
                </Link>
              ) : (
                <span className="truncate text-xs font-medium text-foreground">
                  {partnerName}
                </span>
              ))}
          </div>
          <span className="shrink-0 text-[11px] font-medium text-muted-foreground tabular-nums">
            {formatTransactionTime(transaction.date)}
          </span>
        </div>

        {/* 用途・金額 */}
        <div className="mt-1 flex items-baseline justify-between gap-2">
          <span className="flex min-w-0 items-baseline gap-1 text-sm font-medium text-foreground">
            {transaction.purpose ? (
              <span className="truncate">{transaction.purpose}</span>
            ) : (
              <span className="text-xs text-muted-foreground/60">用途なし</span>
            )}
            {transaction.description && (
              <StickyNote
                className="size-3 shrink-0 self-center text-muted-foreground/60"
                aria-label="メモあり"
              />
            )}
          </span>
          {/* 金額は色を持たせない。向きは名目チップ、債権／債務は残高の色が示す */}
          <span className="shrink-0 text-base font-bold tabular-nums text-foreground">
            {formatTransactionAmount(statement.amount)}
          </span>
        </div>
      </div>

      {/* 右: 残高の情報。一覧で縦に並ぶので、残高の推移が列として読める */}
      <div className="flex w-[104px] shrink-0 flex-col justify-center border-l bg-muted/30 px-2.5 py-2 text-right">
        <span className="text-[10px] leading-tight text-muted-foreground">
          {balanceRole.label}
        </span>
        <span
          className={cn(
            "truncate text-[13px] font-semibold tabular-nums",
            TONE_TEXT[balanceRole.tone],
          )}
        >
          {formatYen(balanceRole.absAmount)}
        </span>
      </div>
    </div>
  );
}
