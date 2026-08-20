"use client";

import { BalanceDisplay, buildLatestSummary } from "@/components/features/partner/balance-card";
import type { LedgerById } from "@/actions/ledger";
import type { TransactionWithPartner } from "@/actions/transaction";

type Props = {
  ledger: LedgerById;
  userName: string;
  latestTransaction?: TransactionWithPartner;
};

export function LedgerBalanceCard({ ledger, userName, latestTransaction }: Props) {
  const latestSummary = latestTransaction
    ? buildLatestSummary(latestTransaction)
    : undefined;

  // balance > 0: ユーザーが貸している（相手が借りている）
  // balance < 0: 相手が貸している（ユーザーが借りている）
  const lenderName = ledger.balance >= 0 ? userName : ledger.partnerName;
  const borrowerName = ledger.balance >= 0 ? ledger.partnerName : userName;

  return (
    <BalanceDisplay
      balance={ledger.balance}
      lenderName={lenderName}
      borrowerName={borrowerName}
      latestSummary={latestSummary}
    />
  );
}
