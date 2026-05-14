import { redirect } from "next/navigation";
import { getCurrentUser } from "@/actions/auth";
import { MobileHeader } from "@/components/layouts/mobile-header";
import { SettingsClient } from "@/components/features/settings/settings-client";
import { version } from "../../../../package.json";

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <div className="flex flex-col">
      <MobileHeader title="設定" backHref="/menu" />
      <SettingsClient user={{ name: user.name, email: user.email }} version={version} />
    </div>
  );
}
