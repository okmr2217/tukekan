import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  DEFAULT_STATS_PERIOD,
  STATS_PERIOD_LABELS,
  STATS_PERIODS,
  type StatsPeriod,
} from "@/lib/stats-period";

/** 統計の期間の切り替え。URL（?period=）に持たせる */
export function PeriodTabs({ current }: { current: StatsPeriod }) {
  return (
    <nav
      aria-label="期間"
      className="grid h-9 grid-cols-3 rounded-lg bg-muted p-[3px] text-sm"
    >
      {STATS_PERIODS.map((period) => {
        const active = period === current;
        return (
          <Link
            key={period}
            href={
              period === DEFAULT_STATS_PERIOD
                ? "/statistics"
                : `/statistics?period=${period}`
            }
            scroll={false}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center justify-center rounded-md font-medium transition-colors",
              active
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {STATS_PERIOD_LABELS[period]}
          </Link>
        );
      })}
    </nav>
  );
}
