import { redirect } from "next/navigation";
import { getSession } from "@/actions/auth";
import prisma from "@/lib/prisma";
import { getPartners } from "@/actions/partner";
import { getAllPartners } from "@/actions/partner";
import { getDescriptionSuggestions, getTransactions } from "@/actions/transaction";
import { TotalBalanceCard } from "@/components/features/balance/total-balance-card";
import {
  PartnerBalanceList,
  type PartnerBalance,
} from "@/components/features/partner/partner-balance-list";
import { TransactionModal } from "@/components/features/transaction/transaction-modal";
import { TransactionFilters } from "@/components/features/transaction/transaction-filters";
import { TransactionCardList } from "@/components/features/transaction/transaction-card-list";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Wallet, History } from "lucide-react";

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

async function getPartnerBalances(userId: string): Promise<PartnerBalance[]> {
  const balances = await prisma.transaction.groupBy({
    by: ["partnerId"],
    where: { ownerId: userId },
    _sum: { amount: true },
  });

  const partnersWithBalance = await Promise.all(
    balances.map(async (b) => {
      const partner = await prisma.partner.findUnique({
        where: { id: b.partnerId },
      });
      return {
        partnerId: b.partnerId,
        partnerName: partner?.name ?? "不明",
        balance: b._sum.amount ?? 0,
      };
    }),
  );

  return partnersWithBalance.sort(
    (a, b) => Math.abs(b.balance) - Math.abs(a.balance),
  );
}

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

  const [partnerBalances, partners, allPartners, suggestions, transactions] =
    await Promise.all([
      getPartnerBalances(session.userId),
      getPartners(),
      getAllPartners(),
      getDescriptionSuggestions(),
      getTransactions({ partnerIds, showArchived, showArchivedPartners }),
    ]);

  const totalBalance = partnerBalances.reduce(
    (sum, item) => sum + item.balance,
    0,
  );

  return (
    <div className="flex flex-col">
      <TransactionModal partners={partners} suggestions={suggestions} />
      <Tabs defaultValue="balance" className="w-full">
        <div className="p-4">
          <TabsList className="w-full h-10">
            <TabsTrigger value="balance">
              <Wallet />
              残高
            </TabsTrigger>
            <TabsTrigger value="history">
              <History />
              履歴
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="balance">
          <TotalBalanceCard balance={totalBalance} />

          <div className="p-4">
            <h4 className="font-semibold">相手ごとの残高</h4>
            <div className="mt-4">
              <PartnerBalanceList balances={partnerBalances} />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="history">
          <div className="px-4">
            <h4 className="font-semibold">全取引履歴</h4>
            <div className="mt-3">
              <TransactionFilters partners={allPartners} />
            </div>
            <div className="mt-4">
              <TransactionCardList
                transactions={transactions}
                suggestions={suggestions}
              />
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
