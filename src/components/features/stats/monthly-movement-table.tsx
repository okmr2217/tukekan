import { formatYen } from "@/lib/transaction-wording";
import type { MonthlyMovement, MovementKey } from "@/lib/movement-stats";
import { MovementChip } from "./movement-flow-cards";

const COLUMNS: MovementKey[] = ["lend", "repayReceived", "borrow", "repayMade"];

/**
 * 月ごとの名目の合計を表で出す（新しい月が上）。グラフの下に畳んでおく。
 * 動きのない名目の列は出さない。
 */
export function MonthlyMovementTable({ data }: { data: MonthlyMovement[] }) {
  const columns = COLUMNS.filter((key) => data.some((m) => m[key] > 0));
  const rows = [...data].reverse();

  return (
    <details className="group rounded-xl border bg-card shadow-sm">
      <summary className="cursor-pointer list-none px-4 py-3 text-xs text-muted-foreground select-none [&::-webkit-details-marker]:hidden">
        <span className="group-open:hidden">月ごとの金額を表で見る</span>
        <span className="hidden group-open:inline">表を閉じる</span>
      </summary>
      <div className="overflow-x-auto border-t">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b bg-muted/40">
              <th className="px-3 py-2 text-left font-medium text-muted-foreground">
                月
              </th>
              {columns.map((key) => (
                <th key={key} className="px-2 py-2 text-right font-medium">
                  <MovementChip movement={key} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((m) => (
              <tr key={m.month} className="border-b last:border-b-0">
                <td className="whitespace-nowrap px-3 py-2 font-medium">
                  {m.label}
                </td>
                {columns.map((key) => (
                  <td
                    key={key}
                    className="whitespace-nowrap px-2 py-2 text-right tabular-nums"
                  >
                    {m[key] > 0 ? (
                      formatYen(m[key])
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}
