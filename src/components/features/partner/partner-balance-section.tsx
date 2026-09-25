"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Settings2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { buildLatestSummary } from "./balance-card";
import { LedgerFormDialog } from "./ledger-form-dialog";
import { InterestRateBadge } from "@/components/features/ledger/interest-rate-badge";
import { ownerBalanceStatement, type BalanceTone } from "@/lib/balance-wording";
import { shouldShowBreakdown } from "@/lib/ledger-balance";
import { formatDateForDisplay } from "@/lib/date-utils";
import type { LedgerBalanceBreakdown } from "@/lib/ledger-balance";
import type { NextInterestPreview } from "@/lib/ledger-interest";
import type { LedgerWithBalance } from "@/actions/ledger";
import type { PartnerById } from "@/actions/partner";
import type { TransactionWithPartner } from "@/actions/transaction";

type Props = {
  partner: PartnerById;
  ledgers: LedgerWithBalance[];
  /** 全口座を合算した残高の内訳 */
  breakdown: LedgerBalanceBreakdown;
  /** いちばん新しい取引（残高の下に一言そえる） */
  latestTransaction?: TransactionWithPartner;
};

/** 色を付けるのは金額だけ。債権なら緑・債務なら赤・精算済みはそのまま */
const AMOUNT_TONE: Record<BalanceTone, string> = {
  credit: "text-emerald-600 dark:text-emerald-400",
  debt: "text-red-600 dark:text-red-400",
  settled: "text-foreground",
};

/** 記録者視点の残高の符号から色を決める */
function toneOf(balance: number): BalanceTone {
  if (balance > 0) return "credit";
  if (balance < 0) return "debt";
  return "settled";
}

/**
 * 相手ページの残高。上に全口座の合計、下のトレイに口座ごとのカードを並べる。
 *
 * 口座が1つだけのときは合計と同じ金額を重ねて出さず、口座のカードには
 * 利率・次回の利子・口座の設定だけを出す。
 */
export function PartnerBalanceSection({
  partner,
  ledgers,
  breakdown,
  latestTransaction,
}: Props) {
  const [addLedgerOpen, setAddLedgerOpen] = useState(false);

  const statement = ownerBalanceStatement(breakdown.total, partner.name);
  const maxRate = Math.max(0, ...ledgers.map((l) => l.annualInterestRate));
  const showBreakdown = shouldShowBreakdown(breakdown, maxRate);
  const showLedgerBalance = ledgers.length > 1;

  return (
    <div>
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
            ¥{Math.abs(breakdown.total).toLocaleString()}
          </p>
          {latestTransaction && (
            <p className="mt-1 text-xs text-muted-foreground">
              {buildLatestSummary(latestTransaction)}
            </p>
          )}
          {showBreakdown && (
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
          <div className="flex items-center justify-between pl-1 mb-1.5">
            <p className="text-[11px] font-medium text-muted-foreground">
              口座
              <span className="ml-1 tabular-nums">{ledgers.length}</span>
            </p>
            <button
              onClick={() => setAddLedgerOpen(true)}
              className="flex items-center gap-1 text-[11px] px-2 py-1 -mr-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <Plus className="size-3.5" />
              追加
            </button>
          </div>
          <ul className="space-y-2">
            {ledgers.map((ledger) => (
              <LedgerItem
                key={ledger.id}
                ledger={ledger}
                showBalance={showLedgerBalance}
              />
            ))}
          </ul>
        </div>
      </div>

      <LedgerFormDialog
        partnerId={partner.id}
        open={addLedgerOpen}
        onOpenChange={setAddLedgerOpen}
      />
    </div>
  );
}

/** 口座1つぶんのカード。残高と、利子があればその内訳・次回の利子 */
function LedgerItem({
  ledger,
  showBalance,
}: {
  ledger: LedgerWithBalance;
  showBalance: boolean;
}) {
  const showBreakdown =
    showBalance &&
    shouldShowBreakdown(ledger.breakdown, ledger.annualInterestRate);

  return (
    <li className="flex items-start gap-2 rounded-xl border bg-card pl-3.5 pr-2 py-2.5">
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
                AMOUNT_TONE[toneOf(ledger.balance)],
              )}
            >
              {ledger.balance < 0 ? "-" : ""}¥
              {Math.abs(ledger.balance).toLocaleString()}
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
        <NextInterestLine nextInterest={ledger.nextInterest} />
      </div>
      <Link
        href={`/ledgers/${ledger.id}/settings`}
        aria-label={`${ledger.title}の設定`}
        className="shrink-0 p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
      >
        <Settings2 className="size-4" />
      </Link>
    </li>
  );
}

function NextInterestLine({
  nextInterest,
}: {
  nextInterest: NextInterestPreview;
}) {
  if (!nextInterest.isEligible) return null;
  return (
    <p className="text-[11px] text-muted-foreground">
      次回の利子 {formatDateForDisplay(nextInterest.nextDate)} に{" "}
      <span className="font-semibold text-amber-600 dark:text-amber-400">
        +¥{nextInterest.amount.toLocaleString()}
      </span>{" "}
      見込み
    </p>
  );
}
