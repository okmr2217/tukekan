import { getPartners } from "@/actions/partner";
import { getPurposeSuggestions } from "@/actions/transaction";
import { getLedgerPartnerMap } from "@/actions/ledger";
import { getTransactionLabelPreset } from "@/actions/auth";
import { FABController } from "@/components/layouts/fab-controller";
import { BottomBar } from "@/components/layouts/bottom-bar";
import { TransactionLabelPresetProvider } from "@/components/features/transaction/transaction-label-preset-context";

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [partners, suggestions, ledgerPartnerMap, labelPreset] =
    await Promise.all([
      getPartners(),
      getPurposeSuggestions(),
      getLedgerPartnerMap(),
      getTransactionLabelPreset(),
    ]);

  return (
    <TransactionLabelPresetProvider preset={labelPreset}>
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
    </TransactionLabelPresetProvider>
  );
}
