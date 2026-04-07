import { redirect } from "next/navigation";
import { getSession } from "@/actions/auth";
import { getPartnersWithBalance } from "@/actions/partner";
import { PartnersPageClient } from "@/components/features/partner/partners-page-client";

export default async function PartnersPage() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const partners = await getPartnersWithBalance();

  return <PartnersPageClient partners={partners} />;
}
