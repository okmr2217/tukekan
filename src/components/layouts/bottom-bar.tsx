"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Wallet, BarChart2, Users, Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { MenuBottomSheet } from "./menu-bottom-sheet";

const NAV_ITEMS = [
  { href: "/", label: "取引", icon: Wallet },
  { href: "/stats", label: "統計", icon: BarChart2 },
  { href: "/partners", label: "相手", icon: Users },
] as const;

export function BottomBar() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  const isMenuActive =
    pathname.startsWith("/settings") || pathname.startsWith("/help");

  return (
    <>
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
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            className={cn(
              "flex flex-1 flex-col items-center justify-center gap-1 py-2 text-xs transition-colors",
              isMenuActive
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Menu className="h-5 w-5" />
            <span>メニュー</span>
          </button>
        </div>
      </nav>

      <MenuBottomSheet open={menuOpen} onClose={() => setMenuOpen(false)} />
    </>
  );
}
