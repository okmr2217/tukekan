"use client";

import Link from "next/link";
import { parseAsString, useQueryState } from "nuqs";
import { PartnerBalanceSection } from "./partner-balance-section";
import { PartnerShareCard } from "./partner-share-card";
import { LedgerFilterChips } from "@/components/features/ledger/ledger-filter-chips";
import { TransactionCardList } from "@/components/features/transaction/transaction-card-list";
import type { LedgerBalanceBreakdown } from "@/lib/ledger-balance";
import type { LedgerWithBalance } from "@/actions/ledger";
import type { Partner, PartnerById } from "@/actions/partner";
import type { TransactionWithPartner } from "@/actions/transaction";

type Props = {
  partner: PartnerById;
  ledgers: LedgerWithBalance[];
  /** 相手のすべての口座の取引（新しい順） */
  transactions: TransactionWithPartner[];
  /** 全口座を合算した残高の内訳 */
  breakdown: LedgerBalanceBreakdown;
  suggestions: string[];
  partners: Partner[];
};

export function PartnerDetailView({
  partner,
  ledgers,
  transactions,
  breakdown,
  suggestions,
  partners,
}: Props) {
  // 口座の絞り込みはURL（?ledger=）に持たせる。取引追加のFABもこの値を見て
  // 初期の口座を決めるため、コンポーネントの外からも読めるようにしている。
  const [selectedLedgerId, setSelectedLedgerId] = useQueryState(
    "ledger",
    parseAsString.withDefault(""),
  );

  // URLに知らない口座IDが入っていたときは「すべて」と同じ扱いにする
  const activeLedgerId =
    ledgers.find((l) => l.id === selectedLedgerId)?.id ?? "";

  const visibleTransactions = activeLedgerId
    ? transactions.filter((t) => t.ledgerId === activeLedgerId)
    : transactions;

  return (
    <div className="px-4 pt-3 pb-4 space-y-5 max-w-lg mx-auto w-full">
      {partner.isArchived && (
        <p className="rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">
          アーカイブ済みの相手です。ホームの一覧と取引フォームの候補には出ません。
          <Link
            href={`/partners/${partner.id}/edit`}
            className="ml-1 underline underline-offset-2 hover:text-foreground"
          >
            解除する
          </Link>
        </p>
      )}

      {/* 残高（口座ごとの内訳つき） */}
      <PartnerBalanceSection
        partner={partner}
        ledgers={ledgers}
        breakdown={breakdown}
        latestTransaction={transactions[0]}
      />

      {/* 共有リンク・共有メモ */}
      <PartnerShareCard partner={partner} />

      {/* 取引一覧 */}
      <div>
        <p className="text-xs font-medium tracking-widest text-muted-foreground uppercase mb-2">
          取引一覧
        </p>

        {/* 口座が複数あるときだけ、口座で絞り込むチップを出す */}
        {ledgers.length > 1 && (
          <div className="mb-3">
            <LedgerFilterChips
              ledgers={ledgers}
              activeLedgerId={activeLedgerId}
              onChange={setSelectedLedgerId}
            />
          </div>
        )}

        <TransactionCardList
          transactions={visibleTransactions}
          suggestions={suggestions}
          partners={partners}
        />
      </div>
    </div>
  );
}

