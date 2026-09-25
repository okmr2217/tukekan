import { redirect } from "next/navigation";
import { getCurrentUser } from "@/actions/auth";
import { OnboardingStep } from "@/components/features/onboarding/onboarding-step";
import { ProfileStepForm } from "./profile-step-form";

export default async function OnboardingProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <OnboardingStep
      title="表示名を決めましょう"
      description="共有リンクを送った相手に表示される名前です。あとから設定で変えられます。"
    >
      <ProfileStepForm defaultName={user.name} />
    </OnboardingStep>
  );
}
