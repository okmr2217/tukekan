import { redirect } from "next/navigation";
import { getPartners } from "@/actions/partner";
import { getPurposeSuggestions } from "@/actions/transaction";
import { getCurrentUser } from "@/actions/auth";
import { FABController } from "@/components/layouts/fab-controller";
import { BottomBar } from "@/components/layouts/bottom-bar";
import { TransactionLabelPresetProvider } from "@/components/features/transaction/transaction-label-preset-context";
import { DEFAULT_TRANSACTION_LABEL_PRESET } from "@/lib/transaction-labels";

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [partners, suggestions, user] = await Promise.all([
    getPartners(),
    getPurposeSuggestions(),
    getCurrentUser(),
  ]);

  // オンボーディングを終えていなければそちらへ（未ログインは各ページが /login へ送る）
  if (user && !user.onboardingCompletedAt) {
    redirect("/onboarding");
  }

  return (
    <TransactionLabelPresetProvider
      preset={user?.transactionLabelPreset ?? DEFAULT_TRANSACTION_LABEL_PRESET}
    >
      <div className="flex min-h-screen flex-col">
        <FABController partners={partners} suggestions={suggestions} />
        <main className="w-full flex-1 pb-16">
          {children}
        </main>
        <BottomBar />
      </div>
    </TransactionLabelPresetProvider>
  );
}
