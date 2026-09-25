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

  const isHome = pathname === "/";
  const isTransactions = pathname === "/transactions";
  // 相手ページ（/partners/[id]）。アーカイブ済みの相手の一覧は相手ページではない
  const partnerMatch =
    pathname === "/partners/archived"
      ? null
      : pathname.match(/^\/partners\/([^/]+)$/);

  if (!isHome && !isTransactions && !partnerMatch) return null;

  // アーカイブ済みの相手は候補に出さないので、その相手のページでも初期選択にしない
  const defaultPartnerId = partners.some((p) => p.id === partnerMatch?.[1])
    ? partnerMatch?.[1]
    : undefined;
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
