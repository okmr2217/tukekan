import { redirect, notFound } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getLedgerById } from "@/actions/ledger";
import { LedgerSettingsForm } from "@/components/features/ledger/ledger-settings-form";
import { MobileHeader } from "@/components/layouts/mobile-header";
import { GuideHeaderLink } from "@/components/features/help/guide-header-link";

export default async function LedgerSettingsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const { id } = await params;
  const ledger = await getLedgerById(id);

  if (!ledger) {
    notFound();
  }

  return (
    <div className="flex flex-col">
      <MobileHeader
        title="口座の設定"
        backHref={`/partners/${ledger.partnerId}?ledger=${ledger.id}`}
        action={<div className="-mr-1.5"><GuideHeaderLink slug="interest" /></div>}
      />

      <div className="px-4 pt-3 pb-4 max-w-lg mx-auto w-full">
        <p className="text-xs text-muted-foreground mb-3">
          {ledger.partnerName}さん・{ledger.title}
        </p>
        <LedgerSettingsForm ledger={ledger} />
      </div>
    </div>
  );
}
