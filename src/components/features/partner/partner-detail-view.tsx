"use client";

import { useState } from "react";
import Link from "next/link";
import { parseAsString, useQueryState } from "nuqs";
import { Plus, Settings, ChevronRight, BarChart2 } from "lucide-react";
import { LedgerFormDialog } from "./ledger-form-dialog";
import { LedgerCard } from "@/components/features/ledger/ledger-card";
import { BalanceDisplay, buildLatestSummary } from "./balance-card";
import { PartnerShareLinkSection } from "./partner-share-link-section";
import { PartnerShareNoteSection } from "./partner-share-note-section";
import { TransactionCardList } from "@/components/features/transaction/transaction-card-list";
import { ownerBalanceStatement } from "@/lib/balance-wording";
import { shouldShowBreakdown } from "@/lib/ledger-balance";
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
  const [addLedgerOpen, setAddLedgerOpen] = useState(false);

  // 口座の絞り込みはURL（?ledger=）に持たせる。取引追加のFABもこの値を見て
  // 初期の口座を決めるため、コンポーネントの外からも読めるようにしている。
  const [selectedLedgerId, setSelectedLedgerId] = useQueryState(
    "ledger",
    parseAsString.withDefault(""),
  );

  const selectedLedger =
    ledgers.find((l) => l.id === selectedLedgerId) ?? null;
  // URLに知らない口座IDが入っていたときは「すべて」と同じ扱いにする
  const activeLedgerId = selectedLedger?.id ?? "";

  const visibleTransactions = activeLedgerId
    ? transactions.filter((t) => t.ledgerId === activeLedgerId)
    : transactions;

  // 絞り込み中はその口座の残高、そうでなければ全口座の合算を主役にする
  const shownBreakdown = selectedLedger ? selectedLedger.breakdown : breakdown;
  const shownRate = selectedLedger
    ? selectedLedger.annualInterestRate
    : Math.max(0, ...ledgers.map((l) => l.annualInterestRate));

  const toggleLedger = (ledgerId: string) => {
    setSelectedLedgerId(ledgerId === activeLedgerId ? null : ledgerId);
  };

  return (
    <div className="px-4 pt-3 pb-4 space-y-4 max-w-lg mx-auto w-full">
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

      {/* 残高 */}
      <div>
        <div className="flex items-center justify-between gap-2 mb-2">
          <p className="text-xs font-medium tracking-widest text-muted-foreground uppercase">
            {selectedLedger ? `残高・${selectedLedger.title}` : "現在の残高"}
          </p>
          <Link
            href={`/partners/${partner.id}/stats${
              selectedLedger ? `?ledger=${selectedLedger.id}` : ""
            }`}
            className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-md border border-border hover:bg-muted transition-colors"
          >
            <BarChart2 className="size-3.5" />
            統計
          </Link>
        </div>
        <BalanceDisplay
          balance={shownBreakdown.total}
          statement={ownerBalanceStatement(shownBreakdown.total, partner.name)}
          latestSummary={
            visibleTransactions[0]
              ? buildLatestSummary(visibleTransactions[0])
              : undefined
          }
          breakdown={
            shouldShowBreakdown(shownBreakdown, shownRate)
              ? shownBreakdown
              : undefined
          }
        />
      </div>

      {/* 口座一覧 */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-medium tracking-widest text-muted-foreground uppercase">
            口座
          </p>
          <button
            onClick={() => setAddLedgerOpen(true)}
            className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-md border border-border bg-transparent hover:bg-muted transition-colors"
          >
            <Plus className="size-3.5" />
            口座を追加
          </button>
        </div>

        <div className="space-y-2">
          {ledgers.map((ledger) => (
            <LedgerCard
              key={ledger.id}
              ledger={ledger}
              selected={ledger.id === activeLedgerId}
              onSelect={
                ledgers.length > 1 ? () => toggleLedger(ledger.id) : undefined
              }
              settingsHref={`/ledgers/${ledger.id}/settings`}
            />
          ))}
        </div>

        {ledgers.length > 1 && (
          <p className="mt-1.5 text-[11px] text-muted-foreground">
            口座をタップすると、その口座だけに絞り込めます
          </p>
        )}
      </div>

      {/* 共有リンク */}
      <div>
        <p className="text-xs font-medium tracking-widest text-muted-foreground uppercase mb-2">
          共有リンク
        </p>
        <PartnerShareLinkSection partner={partner} />
      </div>

      {/* 公開ページのメモ（相手ごとに1つ） */}
      <PartnerShareNoteSection partner={partner} />

      {/* 取引一覧 */}
      <div>
        <div className="flex items-center justify-between gap-2 mb-2">
          <p className="text-xs font-medium tracking-widest text-muted-foreground uppercase">
            取引一覧
            {selectedLedger && (
              <span className="ml-1.5 normal-case tracking-normal">
                ・{selectedLedger.title}
              </span>
            )}
          </p>
          {selectedLedger && (
            <button
              onClick={() => setSelectedLedgerId(null)}
              className="text-xs px-2.5 py-1 rounded-md border border-border hover:bg-muted transition-colors"
            >
              すべての口座
            </button>
          )}
        </div>
        <TransactionCardList
          transactions={visibleTransactions}
          suggestions={suggestions}
          partners={partners}
        />
      </div>

      {/* 相手の設定 */}
      <Link
        href={`/partners/${partner.id}/edit`}
        className="flex items-center gap-3 rounded-xl border bg-card px-4 py-3.5 shadow-sm hover:bg-muted transition-colors"
      >
        <div className="size-9 rounded-full bg-muted flex items-center justify-center shrink-0">
          <Settings className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium">相手の設定</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            名前の変更・アーカイブ・削除
          </p>
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
      </Link>

      <LedgerFormDialog
        partnerId={partner.id}
        open={addLedgerOpen}
        onOpenChange={setAddLedgerOpen}
      />
    </div>
  );
}
