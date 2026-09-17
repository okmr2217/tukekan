"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { TransactionModal } from "@/components/features/transaction/transaction-modal";
import { TransactionFilterSheet } from "@/components/features/transaction/transaction-filter-sheet";
import type { Partner } from "@/actions/partner";

type Props = {
  partners: Partner[];
  suggestions: string[];
};

export function FABController({ partners, suggestions }: Props) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const isTransactions = pathname === "/transactions";
  const partnerMatch = pathname.match(/^\/partners\/([^/]+)$/);

  if (!isTransactions && !partnerMatch) return null;

  const defaultPartnerId = partnerMatch?.[1];
  // 相手ページで口座を絞り込んでいるときは、その口座を初期値にする
  const defaultLedgerId = defaultPartnerId
    ? (searchParams.get("ledger") ?? undefined)
    : undefined;

  return (
    <>
      {isTransactions && <TransactionFilterSheet partners={partners} />}
      <TransactionModal
        partners={partners}
        suggestions={suggestions}
        defaultPartnerId={defaultPartnerId}
        defaultLedgerId={defaultLedgerId || undefined}
      />
    </>
  );
}
