import { redirect, notFound } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getPartnerById } from "@/actions/partner";
import { getLedgersByPartner } from "@/actions/ledger";
import { LedgerSection } from "@/components/features/partner/ledger-section";
import { MobileHeader } from "@/components/layouts/mobile-header";
import { Settings, ChevronRight } from "lucide-react";
import Link from "next/link";

export default async function PartnerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const { id } = await params;

  const [partner, ledgers] = await Promise.all([
    getPartnerById(id),
    getLedgersByPartner(id),
  ]);

  if (!partner) {
    notFound();
  }

  return (
    <div className="flex flex-col">
      <MobileHeader title={partner.name} backHref="/" />

      <div className="px-4 pt-3 pb-4 space-y-4 max-w-lg mx-auto w-full">
        <p className="text-xs text-muted-foreground mb-1">口座一覧</p>

        <LedgerSection partnerId={partner.id} ledgers={ledgers} />

        <Link
          href={`/partners/${partner.id}/edit`}
          className="flex items-center gap-3 rounded-xl border bg-card px-4 py-3.5 shadow-sm hover:bg-muted transition-colors"
        >
          <div className="size-9 rounded-full bg-muted flex items-center justify-center shrink-0">
            <Settings className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">相手の設定</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              名前の変更・アーカイブ・削除
            </p>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
        </Link>
      </div>
    </div>
  );
}
