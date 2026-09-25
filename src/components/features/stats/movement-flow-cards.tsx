import { cn } from "@/lib/utils";
import { formatYen, type MoneyTone } from "@/lib/transaction-wording";
import { movementChipClass } from "@/components/features/transaction/transaction-tone";
import {
  MOVEMENT_LABELS,
  type MovementKey,
  type MovementTotals,
} from "@/lib/movement-stats";

/**
 * 取引カードの名目チップと同じ色にする。
 * 金額がプラスの名目（貸した・返済した）は緑、マイナスの名目（借りた・返済された）は赤。
 */
const MOVEMENT_TONE: Record<MovementKey, MoneyTone> = {
  lend: "credit",
  repayMade: "credit",
  borrow: "debt",
  repayReceived: "debt",
  interestCredit: "credit",
  interestDebt: "debt",
};

export function MovementChip({ movement }: { movement: MovementKey }) {
  const isInterest = movement === "interestCredit" || movement === "interestDebt";
  return (
    <span
      className={cn(
        "inline-block shrink-0 rounded px-1.5 py-0.5 text-[11px] font-medium leading-none",
        movementChipClass(MOVEMENT_TONE[movement], isInterest),
      )}
    >
      {isInterest ? "利息" : MOVEMENT_LABELS[movement]}
    </span>
  );
}

type Side = {
  title: string;
  hint: string;
  rows: MovementKey[];
};

const SIDES: Side[] = [
  {
    title: "貸し",
    hint: "貸したお金と、返してもらったお金",
    rows: ["lend", "repayReceived", "interestCredit"],
  },
  {
    title: "借り",
    hint: "借りたお金と、返したお金",
    rows: ["borrow", "repayMade", "interestDebt"],
  },
];

/**
 * 名目ごとの合計を「貸し」「借り」の2枚に分けて出す。
 * 一度も動きのない側は出さない（借りたことがなければ「借り」は隠す）。
 */
export function MovementFlowCards({ flows }: { flows: MovementTotals }) {
  const sides = SIDES.filter((side) => side.rows.some((key) => flows[key] > 0));

  if (sides.length === 0) {
    return (
      <div className="rounded-xl border border-dashed px-4 py-6 text-center text-sm text-muted-foreground">
        この期間の貸し借りはありません
      </div>
    );
  }

  return (
    <div className={cn("grid gap-2", sides.length > 1 && "grid-cols-2")}>
      {sides.map((side) => (
        <div key={side.title} className="rounded-xl border bg-card px-3 py-3 shadow-sm">
          <p className="text-sm font-semibold">{side.title}</p>
          <p className="text-[10px] text-muted-foreground">{side.hint}</p>
          <dl className="mt-2.5 space-y-2">
            {side.rows
              .filter((key) => !key.startsWith("interest") || flows[key] > 0)
              .map((key) => (
                <div key={key} className="flex items-center justify-between gap-2">
                  <dt>
                    <MovementChip movement={key} />
                  </dt>
                  <dd className="truncate text-sm font-semibold tabular-nums">
                    {formatYen(flows[key])}
                  </dd>
                </div>
              ))}
          </dl>
        </div>
      ))}
    </div>
  );
}
