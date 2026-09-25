import { redirect, notFound } from "next/navigation";
import { BarChart2 } from "lucide-react";
import { getSession } from "@/lib/auth";
import { getPartnerById } from "@/actions/partner";
import { MobileHeader } from "@/components/layouts/mobile-header";

/**
 * 相手ごとの統計。いまは画面の骨組みだけ。
 * 累計の貸し借り・取引回数・未払利息・月別推移・口座ごとの内訳を載せる予定。
 */
export default async function PartnerStatisticsPage({
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
      <MobileHeader
        title={`${partner.name}さんの統計`}
        backHref={`/partners/${partner.id}`}
      />

      <div className="px-4 pt-3 pb-4 max-w-lg mx-auto w-full">
        <p className="text-xs text-muted-foreground mb-3">
          {partner.name}さんとの貸借の集計と推移
        </p>
        <div className="border border-dashed border-border rounded-xl px-4 py-10 flex flex-col items-center gap-2 text-center">
          <BarChart2 className="size-6 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">統計は準備中です</p>
        </div>
      </div>
    </div>
  );
}
