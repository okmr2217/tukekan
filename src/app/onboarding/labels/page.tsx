import { redirect } from "next/navigation";
import { getCurrentUser } from "@/actions/auth";
import { OnboardingStep } from "@/components/features/onboarding/onboarding-step";
import { ONBOARDING_PATHS } from "@/components/features/onboarding/onboarding-steps";
import { LabelsStepForm } from "./labels-step-form";

export default async function OnboardingLabelsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <OnboardingStep
      title="あなたの使い方は？"
      description="取引を記録するときのボタンの言い方が変わります。記録される内容は同じで、あとから設定で変えられます。"
      backHref={ONBOARDING_PATHS.profile}
    >
      <LabelsStepForm defaultPreset={user.transactionLabelPreset} />
    </OnboardingStep>
  );
}
