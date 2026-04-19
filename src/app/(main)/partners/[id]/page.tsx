import { redirect, notFound } from "next/navigation";
import { getSession } from "@/actions/auth";
import { getPartnerById, getPartners } from "@/actions/partner";
import {
  getDescriptionSuggestions,
  getTransactions,
} from "@/actions/transaction";
import { TransactionCardList } from "@/components/features/transaction/transaction-card-list";
import { ShareLinkSection } from "@/components/features/partner/share-link-section";
import { BalanceCard } from "@/components/features/partner/balance-card";
import { PartnerDetailClient } from "@/components/features/partner/partner-detail-client";
import { PageHeader } from "@/components/layouts/page-header";

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

function parseBool(raw: string | string[] | undefined): boolean {
  const str = Array.isArray(raw) ? raw[0] : raw;
  return str === "true";
}

export default async function PartnerDetailPage({
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

  const [partner, suggestions, transactions, partners] = await Promise.all([
    getPartnerById(id),
    getDescriptionSuggestions(),
    getTransactions({ partnerIds: [id], showArchived }),
    getPartners(),
  ]);

  if (!partner) {
    notFound();
  }

  return (
    <div className="flex flex-col">
      <PageHeader
        title={partner.name}
        description="取引履歴と残高"
        backHref="/"
      />

      <div className="px-4 pt-3 pb-4 space-y-4">
        {/* 残高カード */}
        <div>
          <p className="text-xs font-medium tracking-widest text-emerald-600 dark:text-emerald-400 uppercase mb-2">
            現在の残高
          </p>
          <BalanceCard partner={partner} latestTransaction={transactions[0]} />
        </div>

        {/* 共有リンクセクション */}
        <div>
          <p className="text-xs font-medium tracking-widest text-emerald-600 dark:text-emerald-400 uppercase mb-2">
            共有リンク
          </p>
          <ShareLinkSection partner={partner} />
        </div>

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

        {/* 相手の管理（名前変更・アーカイブ・削除） */}
        <PartnerDetailClient partner={partner} />
      </div>
    </div>
  );
}
