import Link from "next/link";
import type { LedgerStat } from "@/actions/stats";
import { formatRate, getWeekdayLabel } from "@/lib/ledger-interest";

export function InterestLedgerTable({ ledgers }: { ledgers: LedgerStat[] }) {
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
              年利
            </th>
            <th className="py-2.5 px-3 text-xs font-medium text-muted-foreground text-right whitespace-nowrap">
              残高
            </th>
            <th className="py-2.5 px-3 text-xs font-medium text-muted-foreground text-right whitespace-nowrap">
              発生日
            </th>
            <th className="py-2.5 px-3 text-xs font-medium text-muted-foreground text-right whitespace-nowrap">
              未払利息
            </th>
            <th className="py-2.5 px-3 text-xs font-medium text-muted-foreground text-right whitespace-nowrap">
              次回見込み
            </th>
          </tr>
        </thead>
        <tbody>
          {ledgers.map((l) => (
            <tr key={l.ledgerId} className="border-b last:border-b-0">
              <td className="py-2.5 px-3 text-sm whitespace-nowrap">
                <Link
                  href={`/partners/${l.partnerId}?ledger=${l.ledgerId}`}
                  className="hover:underline"
                >
                  {l.partnerName}
                </Link>
              </td>
              <td className="py-2.5 px-3 text-sm text-muted-foreground whitespace-nowrap">
                {l.title}
              </td>
              <td className="py-2.5 px-3 text-sm tabular-nums text-right whitespace-nowrap">
                {formatRate(l.annualInterestRate)}%
              </td>
              <td className="py-2.5 px-3 text-sm tabular-nums text-right whitespace-nowrap">
                ¥{l.balance.toLocaleString()}
              </td>
              <td className="py-2.5 px-3 text-sm text-right whitespace-nowrap text-muted-foreground">
                毎週{getWeekdayLabel(l.interestAccrualWeekday)}
                {l.interestCompounding ? "・複利" : ""}
              </td>
              <td className="py-2.5 px-3 text-sm tabular-nums text-right whitespace-nowrap font-semibold text-amber-600 dark:text-amber-400">
                {l.unpaidInterest > 0 ? `¥${l.unpaidInterest.toLocaleString()}` : "—"}
              </td>
              <td className="py-2.5 px-3 text-sm tabular-nums text-right whitespace-nowrap text-muted-foreground">
                {l.nextInterestAmount > 0
                  ? `+¥${l.nextInterestAmount.toLocaleString()}`
                  : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
