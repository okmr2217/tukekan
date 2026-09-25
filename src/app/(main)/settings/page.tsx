import { redirect } from "next/navigation";
import { getCurrentUser } from "@/actions/auth";
import { MobileHeader } from "@/components/layouts/mobile-header";
import { GuideHeaderLink } from "@/components/features/help/guide-header-link";
import { SettingsClient } from "@/components/features/settings/settings-client";
import { version } from "../../../../package.json";

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <div className="flex flex-col">
      <MobileHeader title="設定" backHref="/menu" action={<div className="-mr-1.5"><GuideHeaderLink slug="getting-started" /></div>} />
      <div className="max-w-lg mx-auto w-full">
        <SettingsClient
          user={{ name: user.name, email: user.email }}
          transactionLabelPreset={user.transactionLabelPreset}
          version={version}
        />
      </div>
    </div>
  );
}
