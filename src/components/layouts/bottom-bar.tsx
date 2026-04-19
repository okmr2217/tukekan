"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Users, Receipt, BarChart2, Menu } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/", label: "相手", icon: Users },
  { href: "/transactions", label: "すべての取引", icon: Receipt },
  { href: "/statistics", label: "統計", icon: BarChart2 },
  { href: "/menu", label: "メニュー", icon: Menu },
] as const;

const MENU_TAB_PATHS = ["/menu", "/partners", "/settings", "/help"];

export function BottomBar() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    if (href === "/menu") return MENU_TAB_PATHS.includes(pathname);
    return pathname === href;
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t bg-background">
      <div className="mx-auto flex h-16 max-w-lg items-center justify-around">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex flex-1 flex-col items-center justify-center gap-1 py-2 text-xs transition-colors",
              isActive(href)
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Icon className="h-5 w-5" />
            <span>{label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
