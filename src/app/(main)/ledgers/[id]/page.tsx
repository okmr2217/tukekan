import { redirect, notFound } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getCurrentUser } from "@/actions/auth";
import { getLedgerById } from "@/actions/ledger";
import { getPartners } from "@/actions/partner";
import {
  getDescriptionSuggestions,
  getTransactions,
} from "@/actions/transaction";
import { TransactionCardList } from "@/components/features/transaction/transaction-card-list";
import { LedgerBalanceCard } from "@/components/features/ledger/ledger-balance-card";
import { LedgerShareLinkSection } from "@/components/features/ledger/ledger-share-link-section";
import { LedgerNoteSection } from "@/components/features/ledger/ledger-note-section";
import { LedgerSettingsLink } from "@/components/features/ledger/ledger-settings-link";
import { NextInterestNotice } from "@/components/features/ledger/next-interest-notice";
import { MobileHeader } from "@/components/layouts/mobile-header";

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

function parseBool(raw: string | string[] | undefined): boolean {
  const str = Array.isArray(raw) ? raw[0] : raw;
  return str === "true";
}

export default async function LedgerDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: SearchParams;
}) {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const { id } = await params;
  const sp = await searchParams;
  const showArchived = parseBool(sp.showArchived);

  const [ledger, suggestions, transactions, partners, currentUser] =
    await Promise.all([
      getLedgerById(id),
      getDescriptionSuggestions(),
      getTransactions({ ledgerIds: [id], showArchived }),
      getPartners(),
      getCurrentUser(),
    ]);

  if (!ledger) {
    notFound();
  }

  const isDefaultLedger = ledger.title === "通常";

  return (
    <div className="flex flex-col">
      <MobileHeader
        title={
          isDefaultLedger ? ledger.partnerName : `${ledger.partnerName}・${ledger.title}`
        }
        backHref={`/partners/${ledger.partnerId}`}
      />

      <div className="px-4 pt-3 pb-4 space-y-4 max-w-lg mx-auto w-full">
        <p className="text-xs text-muted-foreground mb-1">取引履歴と残高</p>

        {/* 残高カード */}
        <div>
          <p className="text-xs font-medium tracking-widest text-emerald-600 dark:text-emerald-400 uppercase mb-2">
            現在の残高
          </p>
          <LedgerBalanceCard
            ledger={ledger}
            userName={currentUser?.name ?? "あなた"}
            latestTransaction={transactions[0]}
          />
        </div>

        {/* 口座設定（利率・名前） */}
        <LedgerSettingsLink ledger={ledger} />

        {/* 次回の利子予定 */}
        <NextInterestNotice nextInterest={ledger.nextInterest} />

        {/* 共有リンクセクション */}
        <div>
          <p className="text-xs font-medium tracking-widest text-emerald-600 dark:text-emerald-400 uppercase mb-2">
            共有リンク
          </p>
          <LedgerShareLinkSection ledger={ledger} />
        </div>

        {/* メモセクション */}
        <LedgerNoteSection ledgerId={ledger.id} notes={ledger.notes} />

        {/* 取引一覧 */}
        <div>
          <p className="text-xs font-medium tracking-widest text-muted-foreground uppercase mb-2">
            取引一覧
          </p>
          <TransactionCardList
            transactions={transactions}
            suggestions={suggestions}
            partners={partners}
          />
        </div>
      </div>
    </div>
  );
}
