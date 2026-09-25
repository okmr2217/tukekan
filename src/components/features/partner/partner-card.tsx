import Link from "next/link";
import { cn } from "@/lib/utils";
import { ChevronRight } from "lucide-react";
import type { PartnerWithBalance } from "@/actions/partner";
import { formatRelativeDay } from "@/lib/date-utils";
import { describeBalanceRole, formatYen } from "@/lib/transaction-wording";
import { TONE_TEXT } from "@/components/features/transaction/transaction-tone";

type Props = {
  partner: PartnerWithBalance;
};

/**
 * 相手一覧（ホーム）のカード。その相手の全口座を合算した残高を出す。
 *
 * 左 = 名前と、最後に取引した日・その用途。
 * 右 = 残高。取引カードと同じく絶対値を出し、債権なら緑・債務なら赤で示す。
 * 色だけに頼らないよう、残高の上に「貸している／借りている」を添える。
 * 直近の取引の金額は残高と紛らわしいので出さない。
 */
export function PartnerCard({ partner }: Props) {
  const { lastTransaction, breakdown } = partner;
  const balanceRole = describeBalanceRole(partner.balance);

  return (
    <Link
      href={`/partners/${partner.id}`}
      className="flex items-center gap-2 rounded-xl border bg-card px-4 py-3 shadow-sm hover:bg-muted/50 transition-colors active:scale-[0.99]"
    >
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-base flex items-center gap-1.5">
          <span className="truncate">{partner.name}</span>
          {partner.ledgerCount > 1 && (
            <span className="shrink-0 text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">
              {partner.ledgerCount}口座
            </span>
          )}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5 truncate">
          {lastTransaction
            ? `${formatRelativeDay(new Date(lastTransaction.date))}${
                lastTransaction.purpose ? ` · ${lastTransaction.purpose}` : ""
              }`
            : "取引なし"}
        </p>
      </div>

      <div className="shrink-0 text-right">
        <p
          className={cn(
            "text-[10px] font-medium leading-none",
            TONE_TEXT[balanceRole.tone],
          )}
        >
          {balanceRole.tone === "settled" ? "精算済み" : balanceRole.label}
        </p>
        <p
          className={cn(
            "mt-1 font-bold text-lg leading-none tabular-nums",
            TONE_TEXT[balanceRole.tone],
          )}
        >
          {formatYen(balanceRole.absAmount)}
        </p>
        {breakdown.unpaidInterest > 0 && (
          <p className="mt-1 text-[10px] font-medium leading-none tabular-nums text-amber-600 dark:text-amber-400">
            うち利息 {formatYen(breakdown.unpaidInterest)}
          </p>
        )}
      </div>
      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
    </Link>
  );
}
