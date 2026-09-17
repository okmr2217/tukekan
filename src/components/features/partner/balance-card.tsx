"use client";

import { cn } from "@/lib/utils";
import {
  partnerBalanceStatement,
  type BalanceStatement,
  type BalanceTone,
} from "@/lib/balance-wording";
import type { TransactionWithPartner } from "@/actions/transaction";
import type { LedgerBalanceBreakdown } from "@/lib/ledger-balance";

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

/** 見ている人にとって債権なら緑・債務なら赤・精算済みならニュートラル */
const TONE_CLASSES: Record<
  BalanceTone,
  {
    card: string;
    message: string;
    amount: string;
    badge: string;
    sub: string;
    divider: string;
  }
> = {
  credit: {
    card: "bg-emerald-50 dark:bg-emerald-950 border-emerald-200 dark:border-emerald-800",
    message: "text-emerald-700 dark:text-emerald-300",
    amount: "text-emerald-900 dark:text-emerald-100",
    badge: "bg-emerald-200 text-emerald-800 dark:bg-emerald-800 dark:text-emerald-200",
    sub: "text-emerald-600 dark:text-emerald-400",
    divider: "border-emerald-200 dark:border-emerald-800",
  },
  debt: {
    card: "bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-900",
    message: "text-red-700 dark:text-red-300",
    amount: "text-red-900 dark:text-red-100",
    badge: "bg-red-200 text-red-800 dark:bg-red-900 dark:text-red-200",
    sub: "text-red-600 dark:text-red-400",
    divider: "border-red-200 dark:border-red-900",
  },
  settled: {
    card: "bg-muted/50 border-border",
    message: "text-muted-foreground",
    amount: "text-foreground",
    badge: "bg-muted text-muted-foreground",
    sub: "text-muted-foreground",
    divider: "border-border",
  },
};

type BalanceDisplayProps = {
  /** 記録者視点の残高。表示は絶対値＋説明文で行うので符号は色に使わない */
  balance: number;
  statement: BalanceStatement;
  latestSummary?: string;
  /**
   * 元本／未払利息の内訳。利子のある口座だけ渡す。
   * 合計（balance）を主役にして、その下に内訳を併記する。
   */
  breakdown?: LedgerBalanceBreakdown;
};

export function BalanceDisplay({
  balance,
  statement,
  latestSummary,
  breakdown,
}: BalanceDisplayProps) {
  const tone = TONE_CLASSES[statement.tone];
  const absBalance = Math.abs(balance);

  return (
    <div className={cn("rounded-2xl border p-4", tone.card)}>
      <div className="flex items-center gap-1.5 mb-1">
        <span className={cn("text-xs font-semibold", tone.message)}>
          {statement.message}
        </span>
        {statement.tone !== "settled" && (
          <span
            className={cn(
              "ml-1 text-[10px] font-semibold px-1.5 py-0.5 rounded leading-none shrink-0",
              tone.badge,
            )}
          >
            未精算
          </span>
        )}
      </div>
      <p
        className={cn(
          "text-3xl font-medium leading-tight mb-1 tabular-nums",
          tone.amount,
        )}
      >
        ¥{absBalance.toLocaleString()}
      </p>
      {latestSummary && (
        <p className={cn("text-xs", tone.sub)}>{latestSummary}</p>
      )}
      {breakdown && (
        <div
          className={cn(
            "mt-2.5 pt-2.5 border-t flex items-center gap-3 text-xs",
            tone.divider,
          )}
        >
          <span className={tone.sub}>
            元本{" "}
            <span className={cn("font-semibold tabular-nums", tone.amount)}>
              ¥{Math.abs(breakdown.principal).toLocaleString()}
            </span>
          </span>
          <span className={cn("opacity-40", tone.sub)}>｜</span>
          <span className={tone.sub}>
            未払利息{" "}
            <span className={cn("font-semibold tabular-nums", tone.amount)}>
              ¥{Math.abs(breakdown.unpaidInterest).toLocaleString()}
            </span>
          </span>
        </div>
      )}
    </div>
  );
}

type SharedBalanceCardProps = {
  /** 記録者（オーナー）視点の残高 */
  balance: number;
  ownerName: string;
  partnerName: string;
  breakdown?: LedgerBalanceBreakdown;
};

/** 公開URL用。相手視点の表現に変換して表示する */
export function SharedBalanceCard({
  balance,
  ownerName,
  partnerName,
  breakdown,
}: SharedBalanceCardProps) {
  return (
    <BalanceDisplay
      balance={balance}
      statement={partnerBalanceStatement(balance, ownerName, partnerName)}
      breakdown={breakdown}
    />
  );
}
