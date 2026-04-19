import { redirect } from "next/navigation";
import { getSession } from "@/actions/auth";
import { getPartnersWithBalance } from "@/actions/partner";
import { getDescriptionSuggestions, getTransactions, type SortOrder } from "@/actions/transaction";
import { TransactionCardList } from "@/components/features/transaction/transaction-card-list";
import { PageHeader } from "@/components/layouts/page-header";

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

function parseStr(raw: string | string[] | undefined): string {
  const str = Array.isArray(raw) ? raw[0] : raw;
  return str ?? "";
}

function parsePartnerIds(raw: string | string[] | undefined): string[] {
  if (!raw) return [];
  const str = Array.isArray(raw) ? raw[0] : raw;
  return str.split(",").filter(Boolean);
}

function parseSortOrder(raw: string | string[] | undefined): SortOrder {
  const str = Array.isArray(raw) ? raw[0] : raw;
  const valid: SortOrder[] = ["date_desc", "date_asc", "amount_desc", "amount_asc"];
  return valid.includes(str as SortOrder) ? (str as SortOrder) : "date_desc";
}

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const params = await searchParams;
  const q = parseStr(params.q);
  const partnerIds = parsePartnerIds(params.partnerIds);
  const sortOrder = parseSortOrder(params.sortOrder);

  const [partnersWithBalance, suggestions, transactions] = await Promise.all([
    getPartnersWithBalance(),
    getDescriptionSuggestions(),
    getTransactions({ partnerIds, q, sortOrder }),
  ]);

  return (
    <div className="flex flex-col">
      <PageHeader title="すべての取引" description="全相手の取引一覧" />

      <div className="px-4 pt-3 pb-4 space-y-3">
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
