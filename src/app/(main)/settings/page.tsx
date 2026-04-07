import { redirect } from "next/navigation";
import { getCurrentUser } from "@/actions/auth";
import { ProfileForm } from "@/components/features/settings/profile-form";
import { LogoutButton } from "@/components/features/settings/logout-button";
import { ThemeToggle } from "@/components/layouts/theme-toggle";

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 space-y-8">
      <section className="space-y-4">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
          アカウント
        </h2>
        <div className="space-y-4">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">メールアドレス</p>
            <p className="text-sm">{user.email}</p>
          </div>
          <ProfileForm currentName={user.name} />
        </div>
      </section>

      <hr className="border-border" />

      <section className="space-y-4">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
          表示設定
        </h2>
        <div className="flex items-center justify-between">
          <span className="text-sm">ダーク / ライトモード</span>
          <ThemeToggle />
        </div>
      </section>

      <hr className="border-border" />

      <section className="space-y-4">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
          その他
        </h2>
        <LogoutButton />
      </section>
    </div>
  );
}
