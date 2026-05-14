"use client";

import { AccountSection } from "./account-section";
import { AppearanceSection } from "./appearance-section";
import { OtherSection } from "./other-section";

interface SettingsClientProps {
  user: { name: string; email: string };
  version: string;
}

export function SettingsClient({ user, version }: SettingsClientProps) {
  return (
    <div className="flex-1 bg-background">
      <main className="px-4 pt-4 pb-20 md:pb-4 space-y-4">
        <AccountSection user={user} />
        <AppearanceSection />
        <OtherSection />
        <p className="text-center text-xs text-muted-foreground pb-2">
          バージョン {version}
        </p>
      </main>
    </div>
  );
}
