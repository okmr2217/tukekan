import { cn } from "@/lib/utils";
import type { PartnerWithBalance } from "@/actions/partner";
import { formatYen } from "@/lib/transaction-wording";
import { TONE_TEXT } from "@/components/features/transaction/transaction-tone";

type Props = {
  /** アーカイブしていない相手。アーカイブ済みの相手は統計と同じく数に入れない */
  partners: PartnerWithBalance[];
};

/**
 * ホームの先頭に出す、全相手をまとめた残高。
 *
 * 「貸している」「借りている」は相手ごとの**いまの残高**を向きで分けて足したもの。
 * 統計ページの累計（これまでに貸した額の合計）とは別の数字なので混ぜない。
 */
export function BalanceSummaryCard({ partners }: Props) {
  const lending = partners
    .filter((p) => p.balance > 0)
    .reduce((sum, p) => sum + p.balance, 0);
  const borrowing = partners
    .filter((p) => p.balance < 0)
    .reduce((sum, p) => sum - p.balance, 0);
  const net = lending - borrowing;

  const tone = net > 0 ? "credit" : net < 0 ? "debt" : "settled";
  const message =
    net > 0
      ? "差し引きで受け取ります"
      : net < 0
        ? "差し引きで返します"
        : "差し引きで貸し借りなし";

  return (
    <section className="rounded-2xl border bg-card p-4 shadow-sm">
      <p className="text-xs text-muted-foreground">{message}</p>
      <p
        className={cn(
          "mt-0.5 text-3xl font-bold leading-tight tabular-nums",
          TONE_TEXT[tone],
        )}
      >
        {formatYen(net)}
      </p>

      <div className="mt-3 pt-3 border-t grid grid-cols-2 gap-3">
        <SummaryFigure
          label="貸している"
          amount={lending}
          dotClass="bg-emerald-500"
        />
        <SummaryFigure
          label="借りている"
          amount={borrowing}
          dotClass="bg-red-500"
        />
      </div>
    </section>
  );
}

function SummaryFigure({
  label,
  amount,
  dotClass,
}: {
  label: string;
  amount: number;
  dotClass: string;
}) {
  return (
    <div>
      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <span className={cn("size-1.5 rounded-full", dotClass)} />
        {label}
      </p>
      <p className="mt-0.5 text-base font-semibold tabular-nums">
        {formatYen(amount)}
      </p>
    </div>
  );
}
