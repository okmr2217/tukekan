"use client";

import { useTransition } from "react";
import Link from "next/link";
import { LogOut, HelpCircle, ChevronRight } from "lucide-react";
import { logout } from "@/actions/auth";

export function OtherSection() {
  const [isLoggingOut, startLogoutTransition] = useTransition();

  const handleLogout = () => {
    startLogoutTransition(async () => {
      await logout();
    });
  };

  return (
    <section>
      <h2 className="text-xs font-medium text-muted-foreground mb-2">その他</h2>
      <div className="bg-card rounded-lg border border-border overflow-hidden">
        <Link
          href="/help"
          className="w-full flex items-center justify-between gap-3 p-4 hover:bg-accent transition-colors"
        >
          <div className="flex items-center gap-3">
            <HelpCircle className="h-5 w-5 text-muted-foreground" />
            <span className="text-sm font-medium">ヘルプ</span>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </Link>
        <button
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="w-full flex items-center gap-3 p-4 text-left hover:bg-accent transition-colors disabled:opacity-50 border-t border-border"
        >
          <LogOut className="h-5 w-5 text-muted-foreground" />
          <span className="text-sm font-medium">
            {isLoggingOut ? "ログアウト中..." : "ログアウト"}
          </span>
        </button>
      </div>
    </section>
  );
}
