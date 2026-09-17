import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { InterestRateBadge } from "@/components/features/ledger/interest-rate-badge";
import type { LedgerById } from "@/actions/ledger";

type Props = {
  ledger: LedgerById;
};

export function LedgerSettingsLink({ ledger }: Props) {
  return (
    <Link
      href={`/ledgers/${ledger.id}/settings`}
      className={cn(
        "w-full flex items-center justify-between gap-2 rounded-xl border bg-card px-3.5 py-3",
        "hover:bg-muted/50 transition-colors text-left",
      )}
    >
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-sm font-medium truncate">{ledger.title}</span>
        <InterestRateBadge annualInterestRate={ledger.annualInterestRate} />
      </div>
      <span className="flex items-center gap-1 shrink-0 text-xs text-muted-foreground">
        設定
        <ChevronRight className="size-3.5" />
      </span>
    </Link>
  );
}
