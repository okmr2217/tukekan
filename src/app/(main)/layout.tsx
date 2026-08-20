import { getPartners } from "@/actions/partner";
import { getDescriptionSuggestions } from "@/actions/transaction";
import { getLedgerPartnerMap } from "@/actions/ledger";
import { FABController } from "@/components/layouts/fab-controller";
import { BottomBar } from "@/components/layouts/bottom-bar";

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [partners, suggestions, ledgerPartnerMap] = await Promise.all([
    getPartners(),
    getDescriptionSuggestions(),
    getLedgerPartnerMap(),
  ]);

  return (
    <div className="flex min-h-screen flex-col">
      <FABController
        partners={partners}
        suggestions={suggestions}
        ledgerPartnerMap={ledgerPartnerMap}
      />
      <main className="w-full flex-1 pb-16">
        {children}
      </main>
      <BottomBar />
    </div>
  );
}
