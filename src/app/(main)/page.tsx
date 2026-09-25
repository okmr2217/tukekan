import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getPartners, getPartnersWithBalance } from "@/actions/partner";
import { getPurposeSuggestions, getTransactions } from "@/actions/transaction";
import { MobileHeader } from "@/components/layouts/mobile-header";
import { RecentTransactionsSection } from "@/components/features/home/recent-transactions-section";
import { BalanceSummaryCard } from "@/components/features/home/balance-summary-card";
import { PartnerListSection } from "@/components/features/partner/partner-list-section";

/** ホーム。全体の残高・相手ごとの残高・最近の取引をまとめて出す */
export default async function HomePage() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const [partnersWithBalance, transactions, suggestions, partners] =
    await Promise.all([
      getPartnersWithBalance(),
      // アーカイブ済みの相手の取引も出す（相手のアーカイブは一覧と候補から外すだけ）
      getTransactions({ showArchivedPartners: true }),
      getPurposeSuggestions(),
      getPartners(),
    ]);

  return (
    <div className="flex flex-col">
      <MobileHeader title="ホーム" />

      {/* 下端の余白は、最後のカードが FAB に隠れないようにするため */}
      <div className="max-w-lg mx-auto w-full px-4 pt-3 pb-20 space-y-6">
        {partnersWithBalance.length > 0 && (
          <BalanceSummaryCard partners={partnersWithBalance} />
        )}
        <PartnerListSection partners={partnersWithBalance} />
        <RecentTransactionsSection
          transactions={transactions}
          suggestions={suggestions}
          partners={partners}
        />
      </div>
    </div>
  );
}
