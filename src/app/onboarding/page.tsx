import { redirect } from "next/navigation";
import { ONBOARDING_PATHS } from "@/components/features/onboarding/onboarding-steps";

export default function OnboardingPage() {
  redirect(ONBOARDING_PATHS.profile);
}
