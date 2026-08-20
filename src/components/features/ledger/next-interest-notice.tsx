import { CalendarClock } from "lucide-react";
import { formatDateForDisplay } from "@/lib/date-utils";
import type { NextInterestPreview } from "@/lib/ledger-interest";

type Props = {
  nextInterest: NextInterestPreview;
};

export function NextInterestNotice({ nextInterest }: Props) {
  const { nextDate, rate, amount, isEligible } = nextInterest;
  const dateLabel = formatDateForDisplay(nextDate);

  return (
    <div className="flex items-center gap-2.5 rounded-xl border border-dashed border-border px-3.5 py-3">
      <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
        <CalendarClock className="w-4 h-4 text-muted-foreground" />
      </div>
      <div className="min-w-0">
        {isEligible ? (
          <>
            <p className="text-sm">
              次回の利子：<span className="font-medium">{dateLabel}</span>
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              このまま残高が変わらなければ 週{rate}% で
              <span className="font-semibold text-amber-600 dark:text-amber-400">
                {" "}
                +¥{amount.toLocaleString()}
              </span>
              {" "}見込み
            </p>
          </>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">利子は発生しません</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              無利子、または残高がプラスでないため対象外です
            </p>
          </>
        )}
      </div>
    </div>
  );
}
