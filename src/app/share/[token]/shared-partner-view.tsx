"use client";

import { parseAsString, useQueryState } from "nuqs";
import { SharedBalanceCard } from "@/components/features/partner/balance-card";
import { LedgerCard } from "@/components/features/ledger/ledger-card";
import { SharedTransactionCard } from "@/components/features/transaction/shared-transaction-card";
import { shouldShowBreakdown } from "@/lib/ledger-balance";
import {
  describeInterestRule,
  INTEREST_REPAYMENT_RULE_TEXT,
} from "@/lib/ledger-interest";
import type { SharedPartnerData } from "@/actions/partner";

type Props = {
  data: SharedPartnerData;
};

/**
 * 相手ごとの公開ページの本体。
 *
 * 金額はオーナー視点で渡ってくるので、表示は相手視点に反転する
 * （反転は各カードが担当する）。口座での絞り込みだけここで持つ。
 */
export function SharedPartnerView({ data }: Props) {
  const {
    partnerName,
    ownerName,
    shareNote,
    balance,
    breakdown,
    ledgers,
    transactions,
  } = data;

  const [selectedLedgerId, setSelectedLedgerId] = useQueryState(
    "ledger",
    parseAsString.withDefault(""),
  );

  const selectedLedger = ledgers.find((l) => l.id === selectedLedgerId) ?? null;
  const activeLedgerId = selectedLedger?.id ?? "";

  const visibleTransactions = activeLedgerId
    ? transactions.filter((t) => t.ledgerId === activeLedgerId)
    : transactions;

  const visibleLedgers = selectedLedger ? [selectedLedger] : ledgers;

  const shownBreakdown = selectedLedger ? selectedLedger.breakdown : breakdown;
  const shownBalance = selectedLedger ? selectedLedger.balance : balance;
  const shownRate = selectedLedger
    ? selectedLedger.annualInterestRate
    : Math.max(0, ...ledgers.map((l) => l.annualInterestRate));

  const toggleLedger = (ledgerId: string) => {
    setSelectedLedgerId(ledgerId === activeLedgerId ? null : ledgerId);
  };

  return (
    <main className="mx-auto w-full max-w-lg px-4 py-6 space-y-6">
      {/* 残高 */}
      <div>
        <p className="text-xs font-medium tracking-widest text-muted-foreground uppercase mb-2">
          {selectedLedger ? `残高・${selectedLedger.title}` : "現在の残高"}
        </p>
        <SharedBalanceCard
          balance={shownBalance}
          ownerName={ownerName}
          partnerName={partnerName}
          breakdown={
            shouldShowBreakdown(shownBreakdown, shownRate)
              ? shownBreakdown
              : undefined
          }
        />
      </div>

      {/* 口座一覧 */}
      <div>
        <p className="text-xs font-medium tracking-widest text-muted-foreground uppercase mb-2">
          口座
        </p>
        <div className="space-y-2">
          {ledgers.map((ledger) => (
            <LedgerCard
              key={ledger.id}
              ledger={ledger}
              viewpoint="partner"
              selected={ledger.id === activeLedgerId}
              onSelect={
                ledgers.length > 1 ? () => toggleLedger(ledger.id) : undefined
              }
            />
          ))}
        </div>
        {ledgers.length > 1 && (
          <p className="mt-1.5 text-[11px] text-muted-foreground">
            口座をタップすると、その口座だけに絞り込めます
          </p>
        )}
      </div>

      {/* 利子のルール（口座ごと） */}
      {visibleLedgers.some((l) => l.annualInterestRate > 0) && (
        <div>
          <p className="text-xs font-medium tracking-widest text-muted-foreground uppercase mb-2">
            利子について
          </p>
          <div className="rounded-xl border bg-card px-4 py-3.5 space-y-3">
            {visibleLedgers
              .filter((l) => l.annualInterestRate > 0)
              .map((ledger) => (
                <div key={ledger.id} className="space-y-1">
                  {ledgers.length > 1 && (
                    <p className="text-sm font-medium">{ledger.title}</p>
                  )}
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {describeInterestRule(ledger)}
                    {INTEREST_REPAYMENT_RULE_TEXT}
                  </p>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* 記録者からのメモ */}
      {shareNote && (
        <div>
          <p className="text-xs font-medium tracking-widest text-muted-foreground uppercase mb-2">
            {ownerName}さんからのメモ
          </p>
          <div className="rounded-xl border bg-card px-4 py-3.5 shadow-sm">
            <p className="text-sm text-foreground whitespace-pre-wrap break-words">
              {shareNote}
            </p>
          </div>
        </div>
      )}

      {/* 取引履歴 */}
      <div>
        <div className="flex items-center justify-between gap-2 mb-3">
          <h2 className="text-sm font-semibold text-muted-foreground">
            取引履歴（{visibleTransactions.length}件）
            {selectedLedger && ` ・ ${selectedLedger.title}`}
          </h2>
          {selectedLedger && (
            <button
              onClick={() => setSelectedLedgerId(null)}
              className="shrink-0 text-xs px-2.5 py-1 rounded-md border border-border hover:bg-muted transition-colors"
            >
              すべての口座
            </button>
          )}
        </div>
        {visibleTransactions.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            取引履歴はありません
          </p>
        ) : (
          <div className="space-y-2">
            {visibleTransactions.map((tx) => (
              <SharedTransactionCard
                key={tx.id}
                transaction={tx}
                ledgerTitle={
                  ledgers.length > 1 && !selectedLedger
                    ? ledgers.find((l) => l.id === tx.ledgerId)?.title
                    : undefined
                }
              />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
