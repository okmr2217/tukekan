import Link from "next/link";
import { cn } from "@/lib/utils";
import { describeBalanceRole, formatYen } from "@/lib/transaction-wording";
import { TONE_TEXT } from "@/components/features/transaction/transaction-tone";
import { InterestRateBadge } from "@/components/features/ledger/interest-rate-badge";
import type { LedgerStat } from "@/actions/stats";
import type { MovementKey } from "@/lib/movement-stats";
import { MovementChip } from "./movement-flow-cards";

const MOVEMENTS: MovementKey[] = [
  "lend",
  "repayReceived",
  "borrow",
  "repayMade",
  "interestCredit",
  "interestDebt",
];

/** 相手ごとの統計の口座の絞り込み。相手ページと同じく URL の ?ledger= に持たせる */
export function LedgerFilterChips({
  partnerId,
  ledgers,
  selectedLedgerId,
}: {
  partnerId: string;
  ledgers: LedgerStat[];
  selectedLedgerId: string | null;
}) {
  const base = `/partners/${partnerId}/stats`;
  const chips = [
    { id: null, label: "すべての口座", href: base },
    ...ledgers.map((l) => ({
      id: l.ledgerId,
      label: l.title,
      href: `${base}?ledger=${l.ledgerId}`,
    })),
  ];

  return (
    <nav aria-label="口座" className="flex gap-1.5 overflow-x-auto pb-1">
      {chips.map((chip) => {
        const active = chip.id === selectedLedgerId;
        return (
          <Link
            key={chip.id ?? "all"}
            href={chip.href}
            scroll={false}
            aria-current={active ? "page" : undefined}
            className={cn(
              "shrink-0 rounded-full border px-3 py-1 text-xs transition-colors",
              active
                ? "border-primary bg-primary text-primary-foreground"
                : "bg-card text-muted-foreground hover:bg-muted",
            )}
          >
            {chip.label}
          </Link>
        );
      })}
    </nav>
  );
}

/** 口座ごとの内訳。口座が2つ以上ある相手だけで出す */
export function LedgerBreakdown({
  partnerId,
  ledgers,
}: {
  partnerId: string;
  ledgers: LedgerStat[];
}) {
  return (
    <div className="space-y-2">
      {ledgers.map((ledger) => {
        const role = describeBalanceRole(ledger.balance);
        const movements = MOVEMENTS.filter((key) => ledger.movements[key] > 0);
        return (
          <Link
            key={ledger.ledgerId}
            href={`/partners/${partnerId}/stats?ledger=${ledger.ledgerId}`}
            scroll={false}
            className="block rounded-xl border bg-card px-4 py-3 shadow-sm transition-colors hover:bg-muted/50"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex min-w-0 items-center gap-2">
                <span className="truncate text-sm font-medium">{ledger.title}</span>
                <InterestRateBadge annualInterestRate={ledger.annualInterestRate} />
              </div>
              <div className="shrink-0 text-right">
                <span className={cn("text-[10px] font-medium", TONE_TEXT[role.tone])}>
                  {role.tone === "settled" ? "精算済み" : role.label}
                </span>
                <span
                  className={cn(
                    "ml-1.5 text-sm font-bold tabular-nums",
                    TONE_TEXT[role.tone],
                  )}
                >
                  {formatYen(role.absAmount)}
                </span>
              </div>
            </div>
            {movements.length > 0 ? (
              <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1.5">
                {movements.map((key) => (
                  <div key={key} className="flex items-center justify-between gap-2">
                    <dt>
                      <MovementChip movement={key} />
                    </dt>
                    <dd className="truncate text-xs tabular-nums">
                      {formatYen(ledger.movements[key])}
                    </dd>
                  </div>
                ))}
              </dl>
            ) : (
              <p className="mt-1.5 text-xs text-muted-foreground">取引なし</p>
            )}
          </Link>
        );
      })}
    </div>
  );
}
