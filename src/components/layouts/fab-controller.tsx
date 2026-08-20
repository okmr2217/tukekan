"use client";

import { usePathname } from "next/navigation";
import { TransactionModal } from "@/components/features/transaction/transaction-modal";
import { TransactionFilterSheet } from "@/components/features/transaction/transaction-filter-sheet";
import type { Partner } from "@/actions/partner";

type Props = {
  partners: Partner[];
  suggestions: string[];
  ledgerPartnerMap: Record<string, string>;
};

export function FABController({ partners, suggestions, ledgerPartnerMap }: Props) {
  const pathname = usePathname();

  const isTransactions = pathname === "/transactions";
  const ledgerMatch = pathname.match(/^\/ledgers\/([^/]+)$/);

  if (!isTransactions && !ledgerMatch) return null;

  const defaultLedgerId = ledgerMatch?.[1];
  const defaultPartnerId = defaultLedgerId
    ? ledgerPartnerMap[defaultLedgerId]
    : undefined;

  return (
    <>
      {isTransactions && <TransactionFilterSheet partners={partners} />}
      <TransactionModal
        partners={partners}
        suggestions={suggestions}
        defaultPartnerId={defaultPartnerId}
        defaultLedgerId={defaultLedgerId}
      />
    </>
  );
}
