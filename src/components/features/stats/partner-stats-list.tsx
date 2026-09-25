import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { describeBalanceRole, formatYen } from "@/lib/transaction-wording";
import { TONE_TEXT } from "@/components/features/transaction/transaction-tone";
import { formatRelativeDay } from "@/lib/date-utils";
import type { DormantBalance, PartnerStatsRow } from "@/actions/stats";
import { formatDuration } from "./stats-section";

function ArchivedBadge() {
  return (
    <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
      アーカイブ済み
    </span>
  );
}

function BalanceLabel({ balance }: { balance: number }) {
  const role = describeBalanceRole(balance);
  return (
    <div className="shrink-0 text-right">
      <p className={cn("text-[10px] font-medium leading-none", TONE_TEXT[role.tone])}>
        {role.tone === "settled" ? "精算済み" : role.label}
      </p>
      <p
        className={cn(
          "mt-1 text-base font-bold leading-none tabular-nums",
          TONE_TEXT[role.tone],
        )}
      >
        {formatYen(role.absAmount)}
      </p>
    </div>
  );
}

/** 全体の統計の「相手ごと」。タップで相手ごとの統計へ */
export function PartnerStatsList({ rows }: { rows: PartnerStatsRow[] }) {
  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-dashed px-4 py-6 text-center text-sm text-muted-foreground">
        取引のある相手はまだいません
      </div>
    );
  }

  return (
    <div className="divide-y rounded-xl border bg-card shadow-sm">
      {rows.map((row) => {
        const { averageDays } = row.repayment;
        return (
          <Link
            key={row.partnerId}
            href={`/partners/${row.partnerId}/stats`}
            className="flex items-center gap-2 px-4 py-3 transition-colors first:rounded-t-xl last:rounded-b-xl hover:bg-muted/50"
          >
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-1.5 text-sm font-semibold">
                <span className="truncate">{row.partnerName}</span>
                {row.isArchived && <ArchivedBadge />}
              </p>
              <p className="mt-0.5 truncate text-xs text-muted-foreground">
                {row.periodCount > 0
                  ? `${row.periodCount}回 · ${formatYen(row.periodVolume)}`
                  : "期間中の取引なし"}
                {averageDays !== null &&
                  ` · 平均${averageDays < 1 ? "当日" : formatDuration(averageDays)}で返済`}
              </p>
            </div>
            <BalanceLabel balance={row.balance} />
            <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
          </Link>
        );
      })}
    </div>
  );
}

/** 残高があるのに、しばらく取引がない相手 */
export function DormantBalanceList({ rows }: { rows: DormantBalance[] }) {
  return (
    <div className="divide-y rounded-xl border bg-card shadow-sm">
      {rows.map((row) => (
        <Link
          key={row.partnerId}
          href={`/partners/${row.partnerId}`}
          className="flex items-center gap-2 px-4 py-3 transition-colors first:rounded-t-xl last:rounded-b-xl hover:bg-muted/50"
        >
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{row.partnerName}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              最後の取引は{formatDuration(row.days)}前（{formatRelativeDay(row.lastDate)}）
            </p>
          </div>
          <BalanceLabel balance={row.balance} />
          <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
        </Link>
      ))}
    </div>
  );
}
