"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PartnerForHome } from "@/actions/partner";

function formatRelativeDay(date: Date): string {
  const now = new Date();
  const jst = new Date(date.toLocaleString("en-US", { timeZone: "Asia/Tokyo" }));
  const jstNow = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Tokyo" }));

  const sameDate = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  if (sameDate(jst, jstNow)) return "今日";

  const yesterday = new Date(jstNow);
  yesterday.setDate(yesterday.getDate() - 1);
  if (sameDate(jst, yesterday)) return "昨日";

  const diffDays = Math.floor(
    (jstNow.getTime() - jst.getTime()) / (1000 * 60 * 60 * 24),
  );
  if (diffDays < 30) return `${diffDays}日前`;

  return `${jst.getMonth() + 1}/${jst.getDate()}`;
}

type Props = {
  partner: PartnerForHome;
};

export function PartnerHomeCard({ partner }: Props) {
  const { lastTransaction } = partner;
  const absBalance = Math.abs(partner.balance);

  return (
    <Link
      href={`/partners/${partner.id}`}
      className="flex items-center gap-3 rounded-xl border bg-card px-4 py-3 shadow-sm hover:bg-muted/50 transition-colors active:scale-[0.99]"
    >
      {/* Avatar */}
      <div className="size-10 rounded-full bg-muted flex items-center justify-center text-sm font-semibold shrink-0">
        {partner.name[0]}
      </div>

      {/* Name + last transaction */}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm">{partner.name}</p>
        {lastTransaction ? (
          <p className="text-xs text-muted-foreground mt-0.5 truncate">
            {formatRelativeDay(new Date(lastTransaction.date))}
            {lastTransaction.description
              ? ` · ${lastTransaction.description}`
              : ""}
            {" "}
            <span
              className={cn(
                lastTransaction.amount > 0 ? "text-foreground" : "text-destructive",
              )}
            >
              {lastTransaction.amount > 0 ? "+" : "-"}
              ¥{Math.abs(lastTransaction.amount).toLocaleString()}
            </span>
          </p>
        ) : (
          <p className="text-xs text-muted-foreground mt-0.5">取引なし</p>
        )}
      </div>

      {/* Balance */}
      <div className="flex items-center gap-1.5 shrink-0">
        <span
          className={cn(
            "font-bold text-base tabular-nums",
            partner.balance < 0 ? "text-destructive" : "text-foreground",
          )}
        >
          {partner.balance < 0 ? "-" : ""}¥{absBalance.toLocaleString()}
        </span>
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
      </div>
    </Link>
  );
}
