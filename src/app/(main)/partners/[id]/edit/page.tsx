import { redirect, notFound } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getPartnerById } from "@/actions/partner";
import { PartnerDetailClient } from "@/components/features/partner/partner-detail-client";
import { MobileHeader } from "@/components/layouts/mobile-header";

export default async function PartnerEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const { id } = await params;
  const partner = await getPartnerById(id);

  if (!partner) {
    notFound();
  }

  return (
    <div className="flex flex-col">
      <MobileHeader title={partner.name} backHref="/partners" />

      <div className="px-4 pt-3 pb-4">
        <p className="text-xs text-muted-foreground mb-3">相手の管理</p>
        <PartnerDetailClient partner={partner} />
      </div>
    </div>
  );
}
