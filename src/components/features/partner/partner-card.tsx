import Link from "next/link";
import { cn } from "@/lib/utils";
import { ChevronRight } from "lucide-react";
import type { PartnerWithBalance } from "@/actions/partner";
import { formatRelativeDay } from "@/lib/date-utils";

type Props = {
  partner: PartnerWithBalance;
};

/** 相手一覧（ホーム）のカード。その相手の全口座を合算した残高を出す */
export function PartnerCard({ partner }: Props) {
  const { lastTransaction, breakdown } = partner;

  return (
    <Link
      href={`/partners/${partner.id}`}
      className={cn(
        "flex items-center gap-3 rounded-xl border bg-card px-4 py-3 shadow-sm hover:bg-muted/50 transition-colors active:scale-[0.99]",
        partner.isArchived && "opacity-60",
      )}
    >
      <div className="size-10 rounded-full bg-muted flex items-center justify-center text-sm font-semibold shrink-0">
        {partner.name[0]}
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm flex items-center gap-1.5 truncate">
          <span className="truncate">{partner.name}</span>
          {partner.ledgerCount > 1 && (
            <span className="shrink-0 text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">
              {partner.ledgerCount}口座
            </span>
          )}
          {partner.isArchived && (
            <span className="shrink-0 text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
              アーカイブ済み
            </span>
          )}
        </p>
        {lastTransaction ? (
          <p className="text-xs text-muted-foreground mt-0.5 truncate">
            {formatRelativeDay(new Date(lastTransaction.date))}
            {lastTransaction.purpose ? ` · ${lastTransaction.purpose}` : ""}{" "}
            <span
              className={cn(
                lastTransaction.amount > 0
                  ? "text-foreground"
                  : "text-destructive",
              )}
            >
              {lastTransaction.amount > 0 ? "+" : "-"}¥
              {Math.abs(lastTransaction.amount).toLocaleString()}
            </span>
          </p>
        ) : (
          <p className="text-xs text-muted-foreground mt-0.5">取引なし</p>
        )}
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        <span
          className={cn(
            "font-bold text-base tabular-nums text-right",
            partner.balance < 0 ? "text-destructive" : "text-foreground",
          )}
        >
          {partner.balance < 0 ? "-" : ""}¥
          {Math.abs(partner.balance).toLocaleString()}
          {breakdown.unpaidInterest > 0 && (
            <span className="block text-[10px] font-medium text-amber-600 dark:text-amber-400">
              利息 ¥{breakdown.unpaidInterest.toLocaleString()}
            </span>
          )}
        </span>
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
      </div>
    </Link>
  );
}
