import { redirect } from "next/navigation";
import { getSession } from "@/actions/auth";
import { getPartners, getPartnersWithBalance } from "@/actions/partner";
import { getDescriptionSuggestions, getTransactions } from "@/actions/transaction";
import { TotalBalanceCard } from "@/components/features/balance/total-balance-card";
import { TransactionModal } from "@/components/features/transaction/transaction-modal";
import { TransactionFilters } from "@/components/features/transaction/transaction-filters";
import { TransactionCardList } from "@/components/features/transaction/transaction-card-list";

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

  const [partners, partnersWithBalance, suggestions, transactions] =
    await Promise.all([
      getPartners(),
      getPartnersWithBalance(),
      getDescriptionSuggestions(),
      getTransactions({ partnerIds, showArchived, showArchivedPartners }),
    ]);

  const totalBalance = partnersWithBalance
    .filter((p) => !p.isArchived)
    .reduce((sum, p) => sum + p.balance, 0);

  return (
    <div className="flex flex-col">
      <TransactionModal partners={partners} suggestions={suggestions} />

      <TotalBalanceCard balance={totalBalance} />

      <div className="px-4 pt-3 pb-4 space-y-3">
        <TransactionFilters partners={partnersWithBalance} />
        <TransactionCardList
          transactions={transactions}
          suggestions={suggestions}
        />
      </div>
    </div>
  );
}
