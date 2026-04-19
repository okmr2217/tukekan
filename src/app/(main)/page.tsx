import { redirect } from "next/navigation";
import { getSession } from "@/actions/auth";
import { getPartnersForHome } from "@/actions/partner";
import { PartnerHomeCard } from "@/components/features/partner/partner-home-card";
import { PageHeader } from "@/components/layouts/page-header";
import Link from "next/link";
import { UserPlus } from "lucide-react";

export default async function HomePage() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const partners = await getPartnersForHome();

  return (
    <div className="flex flex-col">
      <PageHeader title="相手" description="取引相手の残高と履歴" />

      <div className="px-4 pt-3 pb-4">
        {partners.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <p className="text-muted-foreground text-sm">
              相手がまだ登録されていません
            </p>
            <Link
              href="/partners"
              className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
            >
              <UserPlus className="h-4 w-4" />
              相手を追加する
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {partners.map((partner) => (
              <PartnerHomeCard key={partner.id} partner={partner} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
