"use client";

import { parseAsString, useQueryState } from "nuqs";
import { cn } from "@/lib/utils";
import { PartnerBalanceSection } from "./partner-balance-section";
import { PartnerShareCard } from "./partner-share-card";
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
          <div className="-mx-4 px-4 mb-3 flex gap-1.5 overflow-x-auto [scrollbar-width:none]">
            <LedgerChip
              label="すべて"
              active={activeLedgerId === ""}
              onClick={() => setSelectedLedgerId(null)}
            />
            {ledgers.map((ledger) => (
              <LedgerChip
                key={ledger.id}
                label={ledger.title}
                active={ledger.id === activeLedgerId}
                onClick={() => setSelectedLedgerId(ledger.id)}
              />
            ))}
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

function LedgerChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "shrink-0 max-w-40 truncate text-xs px-3 py-1.5 rounded-full border transition-colors",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-transparent text-muted-foreground hover:bg-muted hover:text-foreground",
      )}
    >
      {label}
    </button>
  );
}
