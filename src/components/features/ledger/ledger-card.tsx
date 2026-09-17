"use client";

import Link from "next/link";
import { Settings2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { InterestRateBadge } from "@/components/features/ledger/interest-rate-badge";
import { shouldShowBreakdown } from "@/lib/ledger-balance";
import type { LedgerBalanceBreakdown } from "@/lib/ledger-balance";
import { formatDateForDisplay } from "@/lib/date-utils";
import type { NextInterestPreview } from "@/lib/ledger-interest";

export type LedgerCardData = {
  id: string;
  title: string;
  annualInterestRate: number;
  /** 合計残高（元本 + 未払利息）。記録者（オーナー）視点で渡す */
  balance: number;
  breakdown: LedgerBalanceBreakdown;
  nextInterest?: NextInterestPreview;
};

type Props = {
  ledger: LedgerCardData;
  /**
   * 表示の視点。"partner"（公開ページ）のときは符号を反転して相手視点で出す。
   * 元本・未払利息は金額の大きさだけを見せるので反転しない。
   */
  viewpoint?: "owner" | "partner";
  /** 取引一覧をこの口座で絞り込んでいるか */
  selected?: boolean;
  /** 渡すとカードが「この口座で絞り込む」ボタンになる */
  onSelect?: () => void;
  /** 渡すと右端に口座の設定へのリンクを出す */
  settingsHref?: string;
};

/**
 * 相手ページ・公開ページの両方で使う口座カード。
 * 残高を主役にして、利子のある口座では元本と未払利息の内訳を併記する。
 */
export function LedgerCard({
  ledger,
  viewpoint = "owner",
  selected = false,
  onSelect,
  settingsHref,
}: Props) {
  const balance = viewpoint === "partner" ? -ledger.balance : ledger.balance;
  const showBreakdown = shouldShowBreakdown(
    ledger.breakdown,
    ledger.annualInterestRate,
  );
  const nextInterest = ledger.nextInterest;

  const body = (
    <>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-sm font-medium truncate">{ledger.title}</span>
          <InterestRateBadge annualInterestRate={ledger.annualInterestRate} />
          {selected && (
            <span className="shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-primary/15 text-primary">
              絞り込み中
            </span>
          )}
        </div>
        <span
          className={cn(
            "shrink-0 font-bold text-base tabular-nums",
            balance < 0 ? "text-destructive" : "text-foreground",
          )}
        >
          {balance < 0 ? "-" : ""}¥{Math.abs(balance).toLocaleString()}
        </span>
      </div>

      {showBreakdown && (
        <p className="mt-1 text-[11px] text-muted-foreground">
          元本 ¥{Math.abs(ledger.breakdown.principal).toLocaleString()} ・ 未払利息{" "}
          <span className="font-semibold text-amber-600 dark:text-amber-400">
            ¥{Math.abs(ledger.breakdown.unpaidInterest).toLocaleString()}
          </span>
        </p>
      )}

      {nextInterest?.isEligible && (
        <p className="mt-0.5 text-[11px] text-muted-foreground">
          次回の利子 {formatDateForDisplay(nextInterest.nextDate)} に{" "}
          <span className="font-semibold text-amber-600 dark:text-amber-400">
            +¥{nextInterest.amount.toLocaleString()}
          </span>{" "}
          見込み
        </p>
      )}
    </>
  );

  return (
    <div
      className={cn(
        "flex items-stretch rounded-xl border bg-card overflow-hidden transition-colors",
        selected && "border-primary bg-primary/5",
      )}
    >
      {onSelect ? (
        <button
          type="button"
          onClick={onSelect}
          aria-pressed={selected}
          className="flex-1 min-w-0 text-left px-3.5 py-3 hover:bg-muted/50 transition-colors"
        >
          {body}
        </button>
      ) : (
        <div className="flex-1 min-w-0 px-3.5 py-3">{body}</div>
      )}

      {settingsHref && (
        <Link
          href={settingsHref}
          aria-label={`${ledger.title}の設定`}
          className="shrink-0 flex items-center border-l px-3 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <Settings2 className="size-4" />
        </Link>
      )}
    </div>
  );
}
