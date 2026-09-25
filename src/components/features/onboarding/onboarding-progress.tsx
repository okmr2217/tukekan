"use client";

import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { ONBOARDING_STEPS } from "./onboarding-steps";

/** 「ステップ 2 / 4」と区切りのあるバー。今のステップは URL から決める */
export function OnboardingProgress() {
  const pathname = usePathname();
  const current = ONBOARDING_STEPS.findIndex((s) => pathname.startsWith(s.path));
  if (current === -1) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between text-xs text-muted-foreground">
        <span>
          ステップ {current + 1} / {ONBOARDING_STEPS.length}
        </span>
        <span>{ONBOARDING_STEPS[current].label}</span>
      </div>
      <div
        className="flex gap-1.5"
        role="progressbar"
        aria-valuemin={1}
        aria-valuemax={ONBOARDING_STEPS.length}
        aria-valuenow={current + 1}
      >
        {ONBOARDING_STEPS.map((step, i) => (
          <div
            key={step.path}
            className={cn(
              "h-1.5 flex-1 rounded-full transition-colors",
              i <= current ? "bg-primary" : "bg-muted",
            )}
          />
        ))}
      </div>
    </div>
  );
}
