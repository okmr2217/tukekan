"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { InterestRateBadge } from "@/components/features/ledger/interest-rate-badge";
import type { BalanceStatement, BalanceTone } from "@/lib/balance-wording";
import { shouldShowBreakdown } from "@/lib/ledger-balance";
import { formatDateForDisplay } from "@/lib/date-utils";
import type { TransactionWithPartner } from "@/actions/transaction";
import type { LedgerBalanceBreakdown } from "@/lib/ledger-balance";
import type { NextInterestPreview } from "@/lib/ledger-interest";

function formatRelativeDate(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "今日";
  if (diffDays === 1) return "昨日";
  return `${diffDays}日前`;
}

export function buildLatestSummary(tx: TransactionWithPartner): string {
  const dateStr = formatRelativeDate(new Date(tx.date));
  const sign = tx.amount > 0 ? "+" : "-";
  const absAmount = Math.abs(tx.amount).toLocaleString();
  const desc = tx.purpose ? ` · ${tx.purpose}` : "";
  return `${dateStr}${desc} ${sign}¥${absAmount}`;
}

/** 色を付けるのは金額だけ。見ている人にとって債権なら緑・債務なら赤・精算済みはそのまま */
const AMOUNT_TONE: Record<BalanceTone, string> = {
  credit: "text-emerald-600 dark:text-emerald-400",
  debt: "text-red-600 dark:text-red-400",
  settled: "text-foreground",
};

/** 見ている人から見た残高の符号から色を決める */
function toneOf(balance: number): BalanceTone {
  if (balance > 0) return "credit";
  if (balance < 0) return "debt";
  return "settled";
}

export type BalanceCardLedger = {
  id: string;
  title: string;
  annualInterestRate: number;
  /** 合計残高（元本 + 未払利息）。記録者（オーナー）視点で渡す */
  balance: number;
  breakdown: LedgerBalanceBreakdown;
  nextInterest: NextInterestPreview;
};

type Props = {
  /** 全口座の合計（記録者視点）。表示は絶対値＋説明文で行う */
  balance: number;
  /** 見ている人の視点に合わせた説明文と色 */
  statement: BalanceStatement;
  latestSummary?: string;
  /** 元本／未払利息の内訳。利子のある口座があるときだけ渡す */
  breakdown?: LedgerBalanceBreakdown;
  ledgers: BalanceCardLedger[];
  /**
   * 表示の視点。"partner"（公開ページ）のときは口座の残高の符号を反転して相手視点で出す。
   * 元本・未払利息は金額の大きさだけを見せるので反転しない。
   */
  viewpoint?: "owner" | "partner";
  /** 口座の見出しの右端に置く操作（口座の追加など） */
  ledgersAction?: ReactNode;
  /** 口座カードの右端に置く操作（口座の設定へのリンクなど） */
  renderLedgerAction?: (ledger: BalanceCardLedger) => ReactNode;
};

/**
 * 相手ページ・公開ページの両方で使う残高カード。
 * 上に全口座の合計、下のトレイに口座ごとのカードを並べる。
 *
 * 口座が1つだけのときは合計と同じ金額を重ねて出さず、口座のカードには
 * 利率と次回の利子だけを出す。
 */
export function BalanceCard({
  balance,
  statement,
  latestSummary,
  breakdown,
  ledgers,
  viewpoint = "owner",
  ledgersAction,
  renderLedgerAction,
}: Props) {
  const showLedgerBalance = ledgers.length > 1;

  return (
    <div className="rounded-2xl border bg-card overflow-hidden">
      {/* 全口座の合計 */}
      <div className="px-4 pt-4 pb-3.5">
        <p className="text-xs text-muted-foreground">{statement.message}</p>
        <p
          className={cn(
            "mt-1 text-3xl font-semibold leading-tight tabular-nums",
            AMOUNT_TONE[statement.tone],
          )}
        >
          ¥{Math.abs(balance).toLocaleString()}
        </p>
        {latestSummary && (
          <p className="mt-1 text-xs text-muted-foreground">{latestSummary}</p>
        )}
        {breakdown && (
          <div className="mt-2.5 flex items-center gap-4 text-xs text-muted-foreground">
            <span>
              元本{" "}
              <span className="font-semibold tabular-nums text-foreground">
                ¥{Math.abs(breakdown.principal).toLocaleString()}
              </span>
            </span>
            <span>
              未払利息{" "}
              <span className="font-semibold tabular-nums text-amber-600 dark:text-amber-400">
                ¥{Math.abs(breakdown.unpaidInterest).toLocaleString()}
              </span>
            </span>
          </div>
        )}
      </div>

      {/* 口座ごと */}
      <div className="border-t bg-muted/50 px-3 pt-2 pb-3">
        <div className="flex items-center justify-between min-h-7 pl-1 mb-1.5">
          <p className="text-[11px] font-medium text-muted-foreground">
            口座
            <span className="ml-1 tabular-nums">{ledgers.length}</span>
          </p>
          {ledgersAction}
        </div>
        <ul className="space-y-2">
          {ledgers.map((ledger) => (
            <LedgerItem
              key={ledger.id}
              ledger={ledger}
              viewpoint={viewpoint}
              showBalance={showLedgerBalance}
              action={renderLedgerAction?.(ledger)}
            />
          ))}
        </ul>
      </div>
    </div>
  );
}

/** 口座1つぶんのカード。残高と、利子があればその内訳・次回の利子 */
function LedgerItem({
  ledger,
  viewpoint,
  showBalance,
  action,
}: {
  ledger: BalanceCardLedger;
  viewpoint: "owner" | "partner";
  showBalance: boolean;
  action?: ReactNode;
}) {
  const balance = viewpoint === "partner" ? -ledger.balance : ledger.balance;
  const showBreakdown =
    showBalance &&
    shouldShowBreakdown(ledger.breakdown, ledger.annualInterestRate);

  return (
    <li
      className={cn(
        "flex items-start gap-2 rounded-xl border bg-card pl-3.5 py-2.5",
        action ? "pr-2" : "pr-3.5",
      )}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 min-h-7">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-sm font-medium truncate">{ledger.title}</span>
            <InterestRateBadge annualInterestRate={ledger.annualInterestRate} />
          </div>
          {showBalance && (
            <span
              className={cn(
                "shrink-0 text-base font-semibold tabular-nums",
                AMOUNT_TONE[toneOf(balance)],
              )}
            >
              {balance < 0 ? "-" : ""}¥{Math.abs(balance).toLocaleString()}
            </span>
          )}
        </div>
        {showBreakdown && (
          <p className="text-[11px] text-muted-foreground">
            元本 ¥{Math.abs(ledger.breakdown.principal).toLocaleString()} ・
            未払利息{" "}
            <span className="font-semibold text-amber-600 dark:text-amber-400">
              ¥{Math.abs(ledger.breakdown.unpaidInterest).toLocaleString()}
            </span>
          </p>
        )}
        {ledger.nextInterest.isEligible && (
          <p className="text-[11px] text-muted-foreground">
            次回の利子 {formatDateForDisplay(ledger.nextInterest.nextDate)} に{" "}
            <span className="font-semibold text-amber-600 dark:text-amber-400">
              +¥{ledger.nextInterest.amount.toLocaleString()}
            </span>{" "}
            見込み
          </p>
        )}
      </div>
      {action}
    </li>
  );
}
