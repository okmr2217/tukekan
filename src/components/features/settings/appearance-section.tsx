"use client";

import { Sun, Moon, Monitor } from "lucide-react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

const THEMES = [
  { value: "light", label: "ライト", icon: Sun },
  { value: "dark", label: "ダーク", icon: Moon },
  { value: "system", label: "システム", icon: Monitor },
] as const;

export function AppearanceSection() {
  const { theme, setTheme } = useTheme();

  return (
    <section>
      <h2 className="text-xs font-medium text-muted-foreground mb-2">外観</h2>
      <div className="bg-card rounded-lg border border-border overflow-hidden">
        <div className="p-4">
          <div className="text-sm font-medium mb-3">テーマ</div>
          <div className="grid grid-cols-3 gap-2">
            {THEMES.map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                onClick={() => setTheme(value)}
                className={cn(
                  "flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-colors",
                  theme === value
                    ? "border-primary bg-primary/5"
                    : "border-border hover:bg-accent",
                )}
              >
                <Icon className="h-5 w-5" />
                <span className="text-xs font-medium">{label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
