"use client";

import { usePathname } from "next/navigation";
import { TransactionModal } from "@/components/features/transaction/transaction-modal";
import type { Partner } from "@/actions/partner";

type Props = {
  partners: Partner[];
  suggestions: string[];
};

export function FABController({ partners, suggestions }: Props) {
  const pathname = usePathname();

  const isTransactions = pathname === "/transactions";
  const isPartnerDetail = /^\/partners\/[^/]+$/.test(pathname);

  if (!isTransactions && !isPartnerDetail) return null;

  const defaultPartnerId = isPartnerDetail
    ? pathname.split("/").pop()
    : undefined;

  return (
    <TransactionModal
      partners={partners}
      suggestions={suggestions}
      defaultPartnerId={defaultPartnerId}
    />
  );
}
