import { redirect } from "next/navigation";
import { getSession } from "@/actions/auth";
import Link from "next/link";
import { Users, Settings, HelpCircle, ChevronRight } from "lucide-react";
import { PageHeader } from "@/components/layouts/page-header";

const MENU_ITEMS = [
  {
    href: "/partners",
    label: "相手の管理",
    description: "取引相手の追加・編集・削除",
    icon: Users,
  },
  {
    href: "/settings",
    label: "設定",
    description: "アカウントとアプリの設定",
    icon: Settings,
  },
  {
    href: "/help",
    label: "ヘルプ",
    description: "使い方の説明",
    icon: HelpCircle,
  },
] as const;

export default async function MenuPage() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  return (
    <div className="flex flex-col">
      <PageHeader title="メニュー" />

      <nav className="px-4 pt-3 space-y-2">
        {MENU_ITEMS.map(({ href, label, description, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-3 rounded-xl border bg-card px-4 py-3.5 shadow-sm hover:bg-muted transition-colors"
          >
            <div className="size-9 rounded-full bg-muted flex items-center justify-center shrink-0">
              <Icon className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">{label}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
          </Link>
        ))}
      </nav>
    </div>
  );
}
