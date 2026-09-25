import Image from "next/image";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/actions/auth";
import { OnboardingProgress } from "@/components/features/onboarding/onboarding-progress";

/**
 * 新規登録直後のオンボーディング。(main) の外に置いて BottomBar / FAB を出さない。
 * 終えたアカウントがここに来たらホームへ戻す。
 */
export default async function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.onboardingCompletedAt) redirect("/");

  return (
    <div className="min-h-screen flex flex-col">
      <header className="max-w-sm mx-auto w-full px-4 pt-6 space-y-5">
        <div className="flex items-center justify-center gap-1">
          <Image src={"/icon-192.png"} alt="icon" width={28} height={28} />
          <span className="text-xl font-logo text-primary tracking-tight">
            <span className="text-[#e07326]">ツケ</span>カン
          </span>
        </div>
        <OnboardingProgress />
      </header>
      <main className="max-w-sm mx-auto w-full flex-1 px-4 pt-6 pb-10">
        {children}
      </main>
    </div>
  );
}
