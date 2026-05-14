import { cn } from "@/lib/utils";
import { formatDateTimeForDisplay } from "@/lib/date-utils";

type SharedTransaction = {
  id: string;
  amount: number;
  description: string | null;
  date: Date;
  runningBalance: number;
};

type Props = {
  transaction: SharedTransaction;
};

export function SharedTransactionCard({ transaction }: Props) {
  const isLending = transaction.amount > 0;
  const absAmount = Math.abs(transaction.amount);
  const absBalance = Math.abs(transaction.runningBalance);

  return (
    <div className="rounded-xl border bg-card px-3 py-2 shadow-sm">
      <div className="flex items-center gap-1.5">
        <span
          className={cn(
            "shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold leading-none",
            isLending
              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400"
              : "bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400",
          )}
        >
          {isLending ? "貸し" : "借り"}
        </span>
        <span className="text-xs font-medium text-muted-foreground">
          {formatDateTimeForDisplay(transaction.date)}
        </span>
      </div>
      <div className="flex items-baseline justify-between gap-3 mt-0.5">
        <span className="font-medium text-sm text-foreground truncate min-w-0">
          {transaction.description ?? (
            <span className="text-muted-foreground/60 text-xs">メモなし</span>
          )}
        </span>
        <span
          className={cn(
            "font-bold text-base tabular-nums shrink-0",
            isLending
              ? "text-emerald-600 dark:text-emerald-400"
              : "text-destructive",
          )}
        >
          {isLending ? "+" : "-"}¥{absAmount.toLocaleString()}
        </span>
      </div>
      <div className="flex justify-end mt-0.75">
        <span className="text-xs text-muted-foreground mr-1">残高</span>
        <span
          className={cn(
            "text-xs tabular-nums",
            transaction.runningBalance > 0
              ? "text-emerald-600 dark:text-emerald-400"
              : transaction.runningBalance < 0
                ? "text-destructive"
                : "text-muted-foreground",
          )}
        >
          {transaction.runningBalance < 0 ? "-" : ""}¥{absBalance.toLocaleString()}
        </span>
      </div>
    </div>
  );
}
