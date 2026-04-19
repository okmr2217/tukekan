import { redirect, notFound } from "next/navigation";
import { getSession } from "@/actions/auth";
import { getPartnerById } from "@/actions/partner";
import { PartnerDetailClient } from "@/components/features/partner/partner-detail-client";
import { PageHeader } from "@/components/layouts/page-header";

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
      <PageHeader
        title={partner.name}
        description="相手の管理"
        backHref="/partners"
      />

      <div className="px-4 pt-3 pb-4">
        <PartnerDetailClient partner={partner} />
      </div>
    </div>
  );
}
