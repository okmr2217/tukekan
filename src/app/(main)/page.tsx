import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getPartnersWithBalance } from "@/actions/partner";
import { PartnerListClient } from "@/components/features/partner/partner-list-client";

export default async function HomePage() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const partners = await getPartnersWithBalance();

  return <PartnerListClient partners={partners} />;
}
