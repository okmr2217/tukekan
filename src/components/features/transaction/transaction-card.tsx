"use client";

import Link from "next/link";
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
 * 上段 = 金額以外の取引の情報（名目・文脈・日時・用途）、
 * 下段 = 左に取引の金額、右にこの取引を反映した後の残高。
 *
 * 下段の左右はラベル＋右寄せの数字という同じ組み方にしてあるので、位置もサイズもそろう。
 * 一覧では金額も残高もそれぞれ縦にそろい、推移を列として追える。
 * 用途はカード幅をまるごと使えるので、金額が大きくても省略されにくい。
 * メモがあれば用途の下に本文を2行まで出す。
 * 残高が債権か債務かは色で示す（ことばでの説明は詳細ダイアログで出す）。
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
        "overflow-hidden rounded-xl border bg-card shadow-sm transition-colors",
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
      {/* 上段: 金額以外の取引の情報。用途はカード幅をまるごと使える */}
      <div className="px-3 pt-2.5 pb-2">
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
              <span className="min-w-0 max-w-[8rem] truncate rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium leading-none text-muted-foreground">
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

        <div className="mt-1 min-w-0 truncate text-sm font-medium text-foreground">
          {transaction.purpose ?? (
            <span className="text-xs text-muted-foreground/60">用途なし</span>
          )}
        </div>
        {/* メモは用途の下に出す。長いものはカードでは2行までにして、全文はダイアログで読ませる */}
        {transaction.description && (
          <p className="mt-0.5 line-clamp-2 whitespace-pre-wrap break-words text-xs leading-snug text-muted-foreground">
            {transaction.description}
          </p>
        )}
      </div>

      {/* 下段: 左が取引の金額、右が残高。どちらもラベル＋右寄せの数字でそろえる */}
      <div className="flex border-t bg-muted/30">
        <div className="flex min-w-0 flex-1 items-baseline justify-between gap-2 px-3 py-1.5">
          <span className="shrink-0 text-[11px] text-muted-foreground">
            金額
          </span>
          {/* 金額は色を持たせない。向きは名目チップ、債権／債務は残高の色が示す */}
          <span className="truncate text-base font-bold tabular-nums text-foreground">
            {formatTransactionAmount(statement.amount)}
          </span>
        </div>
        <div className="flex min-w-0 flex-1 items-baseline justify-between gap-2 border-l px-3 py-1.5">
          <span className="shrink-0 text-[11px] text-muted-foreground">
            残高
          </span>
          <span
            className={cn(
              "truncate text-base font-bold tabular-nums",
              TONE_TEXT[balanceRole.tone],
            )}
          >
            {formatYen(balanceRole.absAmount)}
          </span>
        </div>
      </div>
    </div>
  );
}
