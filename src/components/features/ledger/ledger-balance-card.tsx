"use client";

import { BalanceDisplay, buildLatestSummary } from "@/components/features/partner/balance-card";
import { ownerBalanceStatement } from "@/lib/balance-wording";
import { shouldShowBreakdown } from "@/lib/ledger-balance";
import type { LedgerById } from "@/actions/ledger";
import type { TransactionWithPartner } from "@/actions/transaction";

type Props = {
  ledger: LedgerById;
  latestTransaction?: TransactionWithPartner;
};

/** 口座の取引一覧ページ用。ユーザー（記録者）視点の表現で表示する */
export function LedgerBalanceCard({ ledger, latestTransaction }: Props) {
  const latestSummary = latestTransaction
    ? buildLatestSummary(latestTransaction)
    : undefined;

  return (
    <BalanceDisplay
      balance={ledger.balance}
      statement={ownerBalanceStatement(ledger.balance, ledger.partnerName)}
      latestSummary={latestSummary}
      breakdown={
        shouldShowBreakdown(ledger.breakdown, ledger.annualInterestRate)
          ? ledger.breakdown
          : undefined
      }
    />
  );
}
