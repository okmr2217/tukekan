import { formatYen } from "@/lib/transaction-wording";
import type { PurposeStat } from "@/lib/movement-stats";

/** よく使う用途。回数の多い順に、回数に比例した棒を添える */
export function PurposeList({ purposes }: { purposes: PurposeStat[] }) {
  const maxCount = Math.max(1, ...purposes.map((p) => p.count));

  return (
    <ul className="space-y-2.5 rounded-xl border bg-card px-4 py-3 shadow-sm">
      {purposes.map((p) => (
        <li key={p.purpose}>
          <div className="flex items-baseline justify-between gap-2 text-sm">
            <span className="truncate font-medium">{p.purpose}</span>
            <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
              {p.count}回 · {formatYen(p.total)}
            </span>
          </div>
          <div className="mt-1 h-1 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary/60"
              style={{ width: `${(p.count / maxCount) * 100}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
