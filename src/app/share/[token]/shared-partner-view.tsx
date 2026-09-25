"use client";

import { parseAsString, useQueryState } from "nuqs";
import { BalanceCard } from "@/components/features/partner/balance-card";
import { LedgerFilterChips } from "@/components/features/ledger/ledger-filter-chips";
import { SharedTransactionList } from "@/components/features/transaction/shared-transaction-list";
import { partnerBalanceStatement } from "@/lib/balance-wording";
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
 * 絞り込むのは取引一覧だけで、残高はいつも全口座の合計を出す。
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

  const maxRate = Math.max(0, ...ledgers.map((l) => l.annualInterestRate));
  const interestLedgers = ledgers.filter((l) => l.annualInterestRate > 0);

  // 複数の口座が混ざって並ぶときだけ、カードに口座名を出すために使う
  const ledgerTitles = new Map(ledgers.map((l) => [l.id, l.title]));

  return (
    <main className="mx-auto w-full max-w-lg px-4 py-6 space-y-6">
      {/* 残高（口座ごとの内訳つき） */}
      <BalanceCard
        balance={balance}
        statement={partnerBalanceStatement(balance, ownerName, partnerName)}
        breakdown={
          shouldShowBreakdown(breakdown, maxRate) ? breakdown : undefined
        }
        ledgers={ledgers}
        viewpoint="partner"
      />

      {/* 利子のルール（口座ごと） */}
      {interestLedgers.length > 0 && (
        <div>
          <p className="text-xs font-medium tracking-widest text-muted-foreground uppercase mb-2">
            利子について
          </p>
          <div className="rounded-xl border bg-card px-4 py-3.5 space-y-3">
            {interestLedgers.map((ledger) => (
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
        <h2 className="text-sm font-semibold text-muted-foreground mb-3">
          取引履歴（{visibleTransactions.length}件）
        </h2>
        {ledgers.length > 1 && (
          <div className="mb-3">
            <LedgerFilterChips
              ledgers={ledgers}
              activeLedgerId={activeLedgerId}
              onChange={setSelectedLedgerId}
            />
          </div>
        )}
        {visibleTransactions.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            取引履歴はありません
          </p>
        ) : (
          <SharedTransactionList
            transactions={visibleTransactions}
            ownerName={ownerName}
            ledgerTitles={
              ledgers.length > 1 && !selectedLedger ? ledgerTitles : undefined
            }
          />
        )}
      </div>
    </main>
  );
}
