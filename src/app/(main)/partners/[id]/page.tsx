import { redirect, notFound } from "next/navigation";
import { getSession } from "@/actions/auth";
import { getPartnerById, getPartners } from "@/actions/partner";
import { getDescriptionSuggestions, getTransactions } from "@/actions/transaction";
import { TransactionCardList } from "@/components/features/transaction/transaction-card-list";
import { ShareLinkSection } from "@/components/features/partner/share-link-section";
import { PartnerDetailClient } from "@/components/features/partner/partner-detail-client";
import { PageHeader } from "@/components/layouts/page-header";
import { cn } from "@/lib/utils";

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

  const absBalance = Math.abs(partner.balance);

  return (
    <div className="flex flex-col">
      <PageHeader
        title={partner.name}
        description="取引履歴と残高"
        backHref="/partners"
      />

      <div className="px-4 pt-3 pb-4 space-y-3">
        {/* 残高カード */}
        <div className="rounded-xl border bg-card px-4 py-3 shadow-sm">
          <p className="text-xs text-muted-foreground">現在の残高</p>
          <p
            className={cn(
              "mt-1 text-2xl font-bold tabular-nums",
              partner.balance < 0 ? "text-destructive" : "text-foreground",
            )}
          >
            {partner.balance < 0 ? "-" : ""}¥{absBalance.toLocaleString()}
          </p>
          {partner.balance !== 0 && (
            <p className="mt-0.5 text-xs text-muted-foreground">
              {partner.balance > 0
                ? `${partner.name}から¥${absBalance.toLocaleString()}受け取る予定`
                : `${partner.name}に¥${absBalance.toLocaleString()}返す予定`}
            </p>
          )}
        </div>

        {/* 共有リンクセクション */}
        <ShareLinkSection partner={partner} />

        {/* 取引一覧 */}
        <TransactionCardList
          transactions={transactions}
          suggestions={suggestions}
          partners={partners}
        />

        {/* 相手の管理（名前変更・アーカイブ・削除） */}
        <PartnerDetailClient partner={partner} />
      </div>
    </div>
  );
}
