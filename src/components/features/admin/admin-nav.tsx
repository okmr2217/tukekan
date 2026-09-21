"use client";

/**
 * 管理画面のサイドバーのナビゲーション。
 * 現在地の判定に usePathname を使うのでクライアントコンポーネント。
 */

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowLeftRight,
  LayoutDashboard,
  Link2,
  ScrollText,
  Timer,
  Users,
  Wallet,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  {
    href: "/admin",
    label: "ダッシュボード",
    icon: LayoutDashboard,
  },
  { href: "/admin/accounts", label: "アカウント", icon: Users },
  { href: "/admin/ledgers", label: "口座", icon: Wallet },
  { href: "/admin/transactions", label: "取引", icon: ArrowLeftRight },
  { href: "/admin/share-links", label: "共有リンク", icon: Link2 },
  { href: "/admin/jobs", label: "ジョブ", icon: Timer },
  { href: "/admin/audit", label: "監査ログ", icon: ScrollText },
] as const;

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="flex gap-1 overflow-x-auto md:flex-col md:overflow-visible">
      {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
        // "/admin" は完全一致、それ以外は配下のページも現在地とみなす
        const isActive =
          href === "/admin"
            ? pathname === "/admin"
            : pathname === href || pathname.startsWith(`${href}/`);

        return (
          <Link
            key={href}
            href={href}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "flex items-center gap-2 rounded-lg px-3 py-2 text-sm whitespace-nowrap transition-colors",
              isActive
                ? "bg-primary/10 font-medium text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <Icon className="size-4 shrink-0" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
