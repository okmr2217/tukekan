import { redirect } from "next/navigation";
import { getCurrentUser } from "@/actions/auth";
import { getPartnerById, getPartners } from "@/actions/partner";
import { getPurposeSuggestions } from "@/actions/transaction";
import { OnboardingStep } from "@/components/features/onboarding/onboarding-step";
import { ONBOARDING_PATHS } from "@/components/features/onboarding/onboarding-steps";
import { TransactionLabelPresetProvider } from "@/components/features/transaction/transaction-label-preset-context";
import { TransactionStepForm } from "./transaction-step-form";

export default async function OnboardingTransactionPage({
  searchParams,
}: {
  searchParams: Promise<{ partner?: string }>;
}) {
  const [user, { partner: partnerId }] = await Promise.all([
    getCurrentUser(),
    searchParams,
  ]);
  if (!user) redirect("/login");

  // ?partner= が無い・自分の相手でないときは、登録済みの相手で代わりに進める
  const requested = partnerId ? await getPartnerById(partnerId) : null;
  const partner =
    requested && !requested.isArchived
      ? requested
      : ((await getPartners())[0] ?? null);
  if (!partner) redirect(ONBOARDING_PATHS.partner);

  const suggestions = await getPurposeSuggestions();

  return (
    <OnboardingStep
      title="最初の取引を記録しましょう"
      description={`${partner.name}との直近の貸し借りを1件入れてみましょう。金額と、貸したのか借りたのかだけで記録できます。`}
      backHref={ONBOARDING_PATHS.partner}
    >
      {/* ボタンの言い方は前のステップで選んだものにする */}
      <TransactionLabelPresetProvider preset={user.transactionLabelPreset}>
        <TransactionStepForm
          partner={{ id: partner.id, name: partner.name }}
          suggestions={suggestions}
        />
      </TransactionLabelPresetProvider>
    </OnboardingStep>
  );
}
