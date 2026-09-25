import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { BarChart2, Settings } from "lucide-react";
import { getSession } from "@/lib/auth";
import {
  getPartnerById,
  getPartnerBalance,
  getPartners,
} from "@/actions/partner";
import { getLedgersByPartner } from "@/actions/ledger";
import { getPurposeSuggestions, getTransactions } from "@/actions/transaction";
import { PartnerDetailView } from "@/components/features/partner/partner-detail-view";
import { MobileHeader } from "@/components/layouts/mobile-header";
import { GuideHeaderLink } from "@/components/features/help/guide-header-link";

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

  const [partner, ledgers, transactions, breakdown, suggestions, partners] =
    await Promise.all([
      getPartnerById(id),
      getLedgersByPartner(id),
      getTransactions({
        partnerIds: [id],
        showArchived,
        showArchivedPartners: true,
      }),
      getPartnerBalance(id),
      getPurposeSuggestions(),
      getPartners(),
    ]);

  if (!partner) {
    notFound();
  }

  return (
    <div className="flex flex-col">
      <MobileHeader
        title={partner.name}
        backHref={partner.isArchived ? "/partners/archived" : "/"}
        action={
          <div className="flex items-center gap-0.5 -mr-1.5 shrink-0">
            <Link
              href={`/partners/${partner.id}/statistics`}
              aria-label="相手の統計"
              className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <BarChart2 className="h-5 w-5" />
            </Link>
            <Link
              href={`/partners/${partner.id}/edit`}
              aria-label="相手の設定"
              className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <Settings className="h-5 w-5" />
            </Link>
            <GuideHeaderLink slug="partners" />
          </div>
        }
      />

      <PartnerDetailView
        partner={partner}
        ledgers={ledgers}
        transactions={transactions}
        breakdown={breakdown}
        suggestions={suggestions}
        partners={partners}
      />
    </div>
  );
}
