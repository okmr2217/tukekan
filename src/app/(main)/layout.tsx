import { getPartners } from "@/actions/partner";
import { getDescriptionSuggestions } from "@/actions/transaction";
import { TransactionModal } from "@/components/features/transaction/transaction-modal";
import { BottomBar } from "@/components/layouts/bottom-bar";

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [partners, suggestions] = await Promise.all([
    getPartners(),
    getDescriptionSuggestions(),
  ]);

  return (
    <div className="flex min-h-screen flex-col">
      <TransactionModal partners={partners} suggestions={suggestions} />
      <main className="mx-auto w-full max-w-lg flex-1 pb-16">{children}</main>
      <BottomBar />
    </div>
  );
}
