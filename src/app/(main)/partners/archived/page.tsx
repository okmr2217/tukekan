import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getPartnersWithBalance } from "@/actions/partner";
import { PartnerCard } from "@/components/features/partner/partner-card";
import { MobileHeader } from "@/components/layouts/mobile-header";

/**
 * アーカイブ済みの相手の一覧。ホームの相手一覧には出さないので、ホーム末尾のリンクからここで見る。
 * アーカイブの解除は各相手の設定ページから行う。
 */
export default async function ArchivedPartnersPage() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const partners = (await getPartnersWithBalance()).filter((p) => p.isArchived);

  return (
    <div className="flex flex-col">
      <MobileHeader title="アーカイブ済みの相手" backHref="/" />

      <div className="max-w-lg mx-auto w-full px-4 pt-3 pb-4">
        <p className="text-xs text-muted-foreground mb-3">
          ホームと取引フォームの候補に出さない相手。貸し借りの記録はそのまま残り、合計や統計にも含まれます
        </p>

        {partners.length === 0 ? (
          <div className="py-16 text-center text-sm text-muted-foreground">
            アーカイブ済みの相手はいません
          </div>
        ) : (
          <div className="space-y-2">
            {partners.map((partner) => (
              <PartnerCard key={partner.id} partner={partner} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
