import { OnboardingStep } from "@/components/features/onboarding/onboarding-step";
import { AppStepForm } from "./app-step-form";

export default function OnboardingAppPage() {
  return (
    <OnboardingStep
      title="まずはアプリとして追加しましょう"
      description="ホーム画面に追加すると、アプリのように1タップで開けます。手順はメニューの「アプリとして使う」からいつでも見直せます。"
    >
      <AppStepForm />
    </OnboardingStep>
  );
}
