"use client";

import { AccountSection } from "./account-section";
import { AppearanceSection } from "./appearance-section";
import { OtherSection } from "./other-section";
import { TransactionLabelSection } from "./transaction-label-section";
import type { TransactionLabelPreset } from "@/lib/transaction-labels";

interface SettingsClientProps {
  user: { name: string; email: string };
  transactionLabelPreset: TransactionLabelPreset;
  version: string;
}

export function SettingsClient({
  user,
  transactionLabelPreset,
  version,
}: SettingsClientProps) {
  return (
    <div className="flex-1 bg-background">
      <main className="px-4 pt-4 pb-20 md:pb-4 space-y-4">
        <AccountSection user={user} />
        <TransactionLabelSection preset={transactionLabelPreset} />
        <AppearanceSection />
        <OtherSection />
        <p className="text-center text-xs text-muted-foreground pb-2">
          バージョン {version}
        </p>
      </main>
    </div>
  );
}
