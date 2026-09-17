import { cn } from "@/lib/utils";
import { formatRate } from "@/lib/ledger-interest";

type Props = {
  /** 年利(%) */
  annualInterestRate: number;
  className?: string;
};

/** 口座の利率バッジ。利率は常に年利で表示する */
export function InterestRateBadge({ annualInterestRate, className }: Props) {
  const hasInterest = annualInterestRate > 0;

  return (
    <span
      className={cn(
        "shrink-0 text-[11px] font-semibold px-2 py-0.5 rounded-full",
        hasInterest
          ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400"
          : "bg-muted text-muted-foreground",
        className,
      )}
    >
      {hasInterest ? `年${formatRate(annualInterestRate)}%` : "無利子"}
    </span>
  );
}
