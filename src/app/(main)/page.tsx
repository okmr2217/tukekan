import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getLedgersForHome } from "@/actions/ledger";
import { LedgerHomeCard } from "@/components/features/ledger/ledger-home-card";
import { MobileHeader } from "@/components/layouts/mobile-header";
import Link from "next/link";
import { UserPlus } from "lucide-react";

export default async function HomePage() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const ledgers = await getLedgersForHome();

  return (
    <div className="flex flex-col">
      <MobileHeader title="口座" />

      <div className="px-4 pt-3 pb-4 max-w-lg mx-auto w-full">
        <p className="text-xs text-muted-foreground mb-3">相手ごとの口座と残高</p>
        {ledgers.length === 0 ? (
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
            {ledgers.map((ledger) => (
              <LedgerHomeCard key={ledger.id} ledger={ledger} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
