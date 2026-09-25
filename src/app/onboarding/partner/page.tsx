import { getPartners } from "@/actions/partner";
import { OnboardingStep } from "@/components/features/onboarding/onboarding-step";
import { ONBOARDING_PATHS } from "@/components/features/onboarding/onboarding-steps";
import { PartnerStepForm } from "./partner-step-form";

export default async function OnboardingPartnerPage() {
  // 戻ってきたとき・中断して再開したときは、登録済みの相手でそのまま進めるようにする
  const partners = await getPartners();

  return (
    <OnboardingStep
      title="貸し借りする相手を登録しましょう"
      description="友だちや家族など、お金の貸し借りを記録したい相手です。相手がツケカンを使っていなくても登録できます。"
      backHref={ONBOARDING_PATHS.labels}
    >
      <PartnerStepForm existingPartner={partners[0] ?? null} />
    </OnboardingStep>
  );
}
