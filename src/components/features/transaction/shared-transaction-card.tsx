import { cn } from "@/lib/utils";
import { formatDateTimeForDisplay } from "@/lib/date-utils";
import { isInterestKind } from "@/lib/transaction-kind";

type SharedTransaction = {
  id: string;
  amount: number;
  purpose: string | null;
  description: string | null;
  date: Date;
  kind?: string;
  runningBalance: number;
};

type Props = {
  transaction: SharedTransaction;
  /** 複数の口座をまとめて出しているときに、どの口座の取引かを示す */
  ledgerTitle?: string;
};

/**
 * 公開URL用の取引カード。
 *
 * amount / runningBalance は記録者（オーナー）視点で保存されているが、
 * このページを見ているのは相手なので符号を反転して「相手視点」で表示する。
 * これにより残高カードと色の意味（緑 = 見ている人の債権 / 赤 = 債務）が揃う。
 */
export function SharedTransactionCard({ transaction, ledgerTitle }: Props) {
  const viewerAmount = -transaction.amount;
  const viewerBalance = -transaction.runningBalance;
  const isLending = viewerAmount > 0;
  const absAmount = Math.abs(viewerAmount);
  const absBalance = Math.abs(viewerBalance);

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
        {isInterestKind(transaction.kind) && (
          <span className="shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold leading-none bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400">
            利息
          </span>
        )}
        <span className="text-xs font-medium text-muted-foreground">
          {formatDateTimeForDisplay(transaction.date)}
        </span>
        {ledgerTitle && (
          <span className="shrink-0 rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium leading-none text-muted-foreground">
            {ledgerTitle}
          </span>
        )}
      </div>
      <div className="flex items-baseline justify-between gap-3 mt-0.5">
        <span className="font-medium text-sm text-foreground truncate min-w-0">
          {transaction.purpose ?? (
            <span className="text-muted-foreground/60 text-xs">用途なし</span>
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
      {transaction.description && (
        <p className="text-xs text-muted-foreground mt-1 whitespace-pre-wrap break-words">
          {transaction.description}
        </p>
      )}
      <div className="flex justify-end mt-0.75">
        <span className="text-xs text-muted-foreground mr-1">残高</span>
        <span
          className={cn(
            "text-xs tabular-nums",
            viewerBalance > 0
              ? "text-emerald-600 dark:text-emerald-400"
              : viewerBalance < 0
                ? "text-destructive"
                : "text-muted-foreground",
          )}
        >
          {viewerBalance < 0 ? "-" : ""}¥{absBalance.toLocaleString()}
        </span>
      </div>
    </div>
  );
}
