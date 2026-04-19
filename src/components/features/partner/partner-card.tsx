import Link from "next/link";
import { cn } from "@/lib/utils";
import { ChevronRight } from "lucide-react";
import type { PartnerWithBalance } from "@/actions/partner";

type Props = {
  partner: PartnerWithBalance;
};

function formatDate(date: Date): string {
  const d = new Date(date);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}/${m}/${day}`;
}

export function PartnerCard({ partner }: Props) {
  return (
    <Link
      href={`/partners/${partner.id}/edit`}
      className={cn(
        "flex items-center gap-3 rounded-lg border bg-card px-4 py-3 shadow-sm hover:bg-muted/50 transition-colors active:scale-[0.99]",
        partner.isArchived && "opacity-60",
      )}
    >
      <div className="size-9 rounded-full bg-muted flex items-center justify-center text-sm font-semibold shrink-0">
        {partner.name[0]}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="font-semibold text-sm">{partner.name}</span>
          {partner.isArchived && (
            <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
              アーカイブ済み
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">
          {formatDate(partner.createdAt)} 追加
        </p>
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        <span
          className={cn(
            "font-bold text-base tabular-nums",
            partner.balance < 0 ? "text-destructive" : "text-foreground",
          )}
        >
          {partner.balance < 0 ? "-" : ""}¥
          {Math.abs(partner.balance).toLocaleString()}
        </span>
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
      </div>
    </Link>
  );
}
