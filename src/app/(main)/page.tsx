import { redirect } from "next/navigation";
import { getSession } from "@/actions/auth";
import { getPartnersWithBalance } from "@/actions/partner";
import { getDescriptionSuggestions, getTransactions } from "@/actions/transaction";
import { TransactionFilters } from "@/components/features/transaction/transaction-filters";
import { TransactionCardList } from "@/components/features/transaction/transaction-card-list";
import { PageHeader } from "@/components/layouts/page-header";

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

function parsePartnerIds(raw: string | string[] | undefined): string[] {
  if (!raw) return [];
  const str = Array.isArray(raw) ? raw[0] : raw;
  return str.split(",").filter(Boolean);
}

function parseBool(raw: string | string[] | undefined): boolean {
  const str = Array.isArray(raw) ? raw[0] : raw;
  return str === "true";
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const params = await searchParams;
  const partnerIds = parsePartnerIds(params.partnerIds);
  const showArchived = parseBool(params.showArchived);
  const showArchivedPartners = parseBool(params.showArchivedPartners);

  const [partnersWithBalance, suggestions, transactions] =
    await Promise.all([
      getPartnersWithBalance(),
      getDescriptionSuggestions(),
      getTransactions({ partnerIds, showArchived, showArchivedPartners }),
    ]);

  return (
    <div className="flex flex-col">
      <PageHeader title="取引" description="お金の貸し借りの記録" />

      <div className="px-4 pt-3 pb-4 space-y-3">
        <TransactionFilters partners={partnersWithBalance} />
        <TransactionCardList
          transactions={transactions}
          suggestions={suggestions}
          partners={partnersWithBalance
            .filter((p) => !p.isArchived)
            .map((p) => ({ id: p.id, name: p.name }))}
        />
      </div>
    </div>
  );
}
