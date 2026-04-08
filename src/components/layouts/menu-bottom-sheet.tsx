"use client";

import Link from "next/link";
import { Settings, HelpCircle } from "lucide-react";

const MENU_ITEMS = [
  { href: "/settings", label: "設定", description: "アカウントとアプリの設定", icon: Settings },
  { href: "/help", label: "ヘルプ", description: "使い方の説明", icon: HelpCircle },
] as const;

interface MenuBottomSheetProps {
  open: boolean;
  onClose: () => void;
}

export function MenuBottomSheet({ open, onClose }: MenuBottomSheetProps) {
  if (!open) return null;

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 z-50 bg-black/40" onClick={onClose} />

      {/* Sheet */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-background rounded-t-2xl animate-in slide-in-from-bottom duration-300">
        {/* Drag handle */}
        <div className="flex justify-center py-3">
          <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
        </div>

        <div className="px-4 pb-6">
          <p className="text-[11px] font-semibold text-muted-foreground/60 tracking-wider mb-2">
            メニュー
          </p>
          <nav className="space-y-1">
            {MENU_ITEMS.map(({ href, label, description, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                onClick={onClose}
                className="flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-muted transition-colors"
              >
                <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="flex flex-col">
                  <span className="text-sm font-medium text-foreground">{label}</span>
                  <span className="text-xs text-muted-foreground mt-0.5">{description}</span>
                </span>
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </>
  );
}
