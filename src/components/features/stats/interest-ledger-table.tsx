import Link from "next/link";
import type { InterestLedgerStat } from "@/actions/ledger-stats";

export function InterestLedgerTable({ ledgers }: { ledgers: InterestLedgerStat[] }) {
  if (ledgers.length === 0) {
    return (
      <div className="rounded-lg border border-dashed px-4 py-6 text-center text-sm text-muted-foreground">
        利子が設定されている口座はありません
      </div>
    );
  }

  return (
    <div className="rounded-lg border overflow-hidden overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b bg-muted/40">
            <th className="py-2.5 px-3 text-xs font-medium text-muted-foreground text-left whitespace-nowrap">
              相手
            </th>
            <th className="py-2.5 px-3 text-xs font-medium text-muted-foreground text-left whitespace-nowrap">
              口座
            </th>
            <th className="py-2.5 px-3 text-xs font-medium text-muted-foreground text-right whitespace-nowrap">
              利率
            </th>
            <th className="py-2.5 px-3 text-xs font-medium text-muted-foreground text-right whitespace-nowrap">
              残高
            </th>
            <th className="py-2.5 px-3 text-xs font-medium text-muted-foreground text-right whitespace-nowrap">
              経過日数
            </th>
            <th className="py-2.5 px-3 text-xs font-medium text-muted-foreground text-right whitespace-nowrap">
              見込み利子
            </th>
          </tr>
        </thead>
        <tbody>
          {ledgers.map((l) => (
            <tr key={l.ledgerId} className="border-b last:border-b-0">
              <td className="py-2.5 px-3 text-sm whitespace-nowrap">
                <Link href={`/partners/${l.partnerId}`} className="hover:underline">
                  {l.partnerName}
                </Link>
              </td>
              <td className="py-2.5 px-3 text-sm text-muted-foreground whitespace-nowrap">
                {l.title}
              </td>
              <td className="py-2.5 px-3 text-sm tabular-nums text-right whitespace-nowrap">
                週{l.effectiveWeeklyInterestRate}%
              </td>
              <td className="py-2.5 px-3 text-sm tabular-nums text-right whitespace-nowrap">
                ¥{l.balance.toLocaleString()}
              </td>
              <td className="py-2.5 px-3 text-sm tabular-nums text-right whitespace-nowrap text-muted-foreground">
                {l.elapsedDays}日
              </td>
              <td className="py-2.5 px-3 text-sm tabular-nums text-right whitespace-nowrap font-semibold text-amber-600 dark:text-amber-400">
                {l.estimatedInterest > 0 ? `+¥${l.estimatedInterest.toLocaleString()}` : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
