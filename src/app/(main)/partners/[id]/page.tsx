import { redirect, notFound } from "next/navigation";
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
