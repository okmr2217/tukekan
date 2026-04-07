"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Wallet, BarChart2, Users, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  {
    href: "/",
    label: "取引",
    icon: Wallet,
  },
  {
    href: "/stats",
    label: "統計",
    icon: BarChart2,
  },
  {
    href: "/partners",
    label: "相手",
    icon: Users,
  },
  {
    href: "/settings",
    label: "設定",
    icon: Settings,
  },
];

export function BottomBar() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background">
      <div className="mx-auto flex h-16 max-w-lg items-center justify-around">
        {navItems.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-1 flex-col items-center justify-center gap-1 py-2 text-xs transition-colors",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <item.icon className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
