"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  InstallButton,
  InstalledNotice,
  PwaPlatformSteps,
  usePwaInstall,
} from "@/components/features/app-install/pwa-install-guide";
import { ONBOARDING_PATHS } from "@/components/features/onboarding/onboarding-steps";

/**
 * ホーム画面に追加する案内。追加は任意なので、そのまま次へ進める。
 * iPhone ではここで追加してホーム画面のアプリでログインし直すと、オンボーディングの続きから始まる
 * （完了を記録するまでは、ログインのたびにオンボーディングへ送られるため）。
 */
export function AppStepForm() {
  const { ready, platform, installed, canInstall, install } = usePwaInstall();

  return (
    <div className="space-y-6">
      {installed ? (
        <InstalledNotice />
      ) : (
        <div className="space-y-4">
          {canInstall && <InstallButton onClick={() => void install()} />}
          {ready && !platform && (
            <p className="text-sm text-muted-foreground">
              スマートフォンでツケカンを開き、次の手順で追加できます。
            </p>
          )}
          <PwaPlatformSteps platform={platform} compact />
        </div>
      )}
      <Button asChild className="w-full" variant={canInstall && !installed ? "outline" : "default"}>
        <Link href={ONBOARDING_PATHS.profile}>{canInstall && !installed ? "あとで" : "次へ"}</Link>
      </Button>
    </div>
  );
}
