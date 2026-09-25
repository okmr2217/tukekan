import { cn } from "@/lib/utils";
import type { PartnerWithBalance } from "@/actions/partner";
import { formatYen } from "@/lib/transaction-wording";
import { TONE_TEXT } from "@/components/features/transaction/transaction-tone";

type Props = {
  /** アーカイブ済みも含めたすべての相手。アーカイブしても貸し借りは残るので合計に入れる */
  partners: PartnerWithBalance[];
};

/**
 * 相手一覧（ホーム）の上に出す合計。
 * 貸している相手と借りている相手を別々に足し、相殺はしない
 * （「誰かに返すお金」と「誰かから受け取るお金」はそれぞれ知りたいため）。
 */
export function PartnerBalanceSummary({ partners }: Props) {
  const creditors = partners.filter((p) => p.balance > 0);
  const debtors = partners.filter((p) => p.balance < 0);

  const items = [
    {
      label: "貸している",
      tone: "credit" as const,
      total: creditors.reduce((sum, p) => sum + p.balance, 0),
      count: creditors.length,
    },
    {
      label: "借りている",
      tone: "debt" as const,
      total: debtors.reduce((sum, p) => sum - p.balance, 0),
      count: debtors.length,
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-2">
      {items.map((item) => {
        const tone = item.count > 0 ? item.tone : "settled";
        return (
          <div
            key={item.label}
            className="rounded-xl border bg-card px-3 py-2.5 shadow-sm"
          >
            <p className="text-[11px] font-medium text-muted-foreground">
              {item.label}
              <span className="ml-1 tabular-nums">{item.count}人</span>
            </p>
            <p
              className={cn(
                "mt-0.5 truncate text-xl font-bold tabular-nums",
                TONE_TEXT[tone],
              )}
            >
              {formatYen(item.total)}
            </p>
          </div>
        );
      })}
    </div>
  );
}
