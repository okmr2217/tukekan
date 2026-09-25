import { cn } from "@/lib/utils";
import { formatYen } from "@/lib/transaction-wording";
import {
  PROMPT_REPAYMENT_DAYS,
  type RepaymentSide,
  type RepaymentSummary,
} from "@/lib/movement-stats";
import { formatDuration } from "./stats-section";

type Props = {
  summary: RepaymentSummary;
  /** credit = 相手の返済（自分の貸しが返ってくる）、debt = 自分の返済 */
  side: RepaymentSide;
  title: string;
  /** 精算した回数を出すか（相手ごとの統計だけで出す） */
  showSettlements?: boolean;
};

const WORDING: Record<
  RepaymentSide,
  {
    subject: string;
    returned: string;
    prompt: string;
    repaid: string;
    outstanding: string;
    none: string;
  }
> = {
  credit: {
    subject: "貸したお金は",
    returned: "返ってきています",
    prompt: "1ヶ月以内に返ってきた割合",
    repaid: "返してもらった",
    outstanding: "まだ返ってきていない",
    none: "まだ返してもらった記録がありません",
  },
  debt: {
    subject: "借りたお金は",
    returned: "返しています",
    prompt: "1ヶ月以内に返した割合",
    repaid: "返した",
    outstanding: "まだ返していない",
    none: "まだ返した記録がありません",
  },
};

/**
 * 返済の傾向（信用度の目安）。
 *
 * 貸し（借り）は古いものから順に返済で埋まるとみなして、
 * 埋まるまでの日数・1ヶ月以内に埋まった割合・まだ埋まっていない分を出す。
 * 点数やランクにはせず、判断の材料になる数字だけを見せる。
 */
export function RepaymentCard({ summary, side, title, showSettlements = false }: Props) {
  const w = WORDING[side];
  const rate = summary.promptRate;

  const headline =
    summary.averageDays === null
      ? w.none
      : summary.averageDays < 1
        ? `${w.subject}、その日のうちに${w.returned}`
        : `${w.subject}、平均${formatDuration(summary.averageDays)}で${w.returned}`;

  return (
    <div className="rounded-xl border bg-card px-4 py-3.5 shadow-sm">
      <p className="text-sm font-semibold">{title}</p>
      <p className="mt-0.5 text-xs text-muted-foreground">{headline}</p>

      <div className="mt-3">
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-xs text-muted-foreground">{w.prompt}</span>
          <span className="text-lg font-bold tabular-nums">
            {rate === null ? "—" : `${Math.round(rate * 100)}%`}
          </span>
        </div>
        <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
          {rate !== null && (
            <div
              className={cn(
                "h-full rounded-full",
                rate >= 0.8
                  ? "bg-emerald-500"
                  : rate >= 0.5
                    ? "bg-amber-500"
                    : "bg-red-500",
              )}
              style={{ width: `${Math.round(rate * 100)}%` }}
            />
          )}
        </div>
        {rate === null && (
          <p className="mt-1 text-[10px] text-muted-foreground">
            {PROMPT_REPAYMENT_DAYS}日たっていない分しかないため、まだ判断できません
          </p>
        )}
      </div>

      <dl
        className={cn(
          "mt-3 grid gap-2 border-t pt-3",
          showSettlements ? "grid-cols-3" : "grid-cols-2",
        )}
      >
        <div className="min-w-0">
          <dt className="text-[10px] text-muted-foreground">{w.repaid}</dt>
          <dd className="truncate text-sm font-semibold tabular-nums">
            {formatYen(summary.repaidAmount)}
          </dd>
        </div>
        <div className="min-w-0">
          <dt className="text-[10px] text-muted-foreground">{w.outstanding}</dt>
          <dd className="truncate text-sm font-semibold tabular-nums">
            {formatYen(summary.outstandingAmount)}
          </dd>
          {summary.oldestOutstandingDays !== null && (
            <dd className="text-[10px] text-muted-foreground">
              古いものは
              {summary.oldestOutstandingDays < 1
                ? "今日"
                : `${formatDuration(summary.oldestOutstandingDays)}前`}
              から
            </dd>
          )}
        </div>
        {showSettlements && (
          <div className="min-w-0">
            <dt className="text-[10px] text-muted-foreground">精算した回数</dt>
            <dd className="text-sm font-semibold tabular-nums">
              {summary.settlementCount}回
            </dd>
          </div>
        )}
      </dl>
    </div>
  );
}
