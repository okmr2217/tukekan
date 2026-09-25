import { redirect, notFound } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getPartnerStatistics } from "@/actions/stats";
import { MobileHeader } from "@/components/layouts/mobile-header";
import { cn } from "@/lib/utils";
import { describeBalanceRole, formatYen } from "@/lib/transaction-wording";
import { TONE_TEXT } from "@/components/features/transaction/transaction-tone";
import { formatRelativeDay } from "@/lib/date-utils";
import { hasRepaymentData } from "@/lib/movement-stats";
import { formatMonthLabel, jstMonthKey } from "@/lib/stats-period";
import { StatsSection, formatDuration } from "@/components/features/stats/stats-section";
import { MovementFlowCards } from "@/components/features/stats/movement-flow-cards";
import {
  BalanceHistoryChart,
  MonthlyMovementChart,
} from "@/components/features/stats/movement-charts";
import { MonthlyMovementTable } from "@/components/features/stats/monthly-movement-table";
import { RepaymentCard } from "@/components/features/stats/repayment-card";
import {
  LedgerBreakdown,
  LedgerFilterChips,
} from "@/components/features/stats/ledger-breakdown";
import { PurposeList } from "@/components/features/stats/purpose-list";

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

function OverviewTile({
  label,
  value,
  sub,
  valueClassName,
}: {
  label: string;
  value: string;
  sub?: string;
  valueClassName?: string;
}) {
  return (
    <div className="min-w-0 rounded-xl border bg-card px-3 py-2.5 shadow-sm">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className={cn("mt-0.5 truncate text-base font-bold tabular-nums", valueClassName)}>
        {value}
      </p>
      {sub && <p className="truncate text-[10px] text-muted-foreground">{sub}</p>}
    </div>
  );
}

/**
 * 相手ごとの統計。その相手とのお金のやり取りの歴史と、返済の傾向（信用度の目安）を出す。
 * 口座が複数あるときは全口座の合算が基本で、?ledger= で1つの口座に絞り込める。
 */
export default async function PartnerStatisticsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: SearchParams;
}) {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const { id } = await params;
  const sp = await searchParams;
  const ledgerId = Array.isArray(sp.ledger) ? sp.ledger[0] : sp.ledger;
  const stats = await getPartnerStatistics(id, ledgerId);

  if (!stats) {
    notFound();
  }

  const { partner, selectedLedger } = stats;
  const role = describeBalanceRole(stats.breakdown.total);
  const hasActivity = stats.transactionCount + stats.interestCount > 0;
  const showTheirs = hasRepaymentData(stats.theirRepayment);
  const showMine = hasRepaymentData(stats.myRepayment);
  const hasMonthly = stats.monthly.some(
    (m) => m.lend || m.repayReceived || m.borrow || m.repayMade,
  );
  const detailHref = selectedLedger
    ? `/partners/${partner.id}?ledger=${selectedLedger.ledgerId}`
    : `/partners/${partner.id}`;

  return (
    <div className="flex flex-col">
      <MobileHeader title={`${partner.name}の統計`} backHref={detailHref} />

      <div className="mx-auto w-full max-w-lg space-y-6 px-4 pt-3 pb-6">
        {stats.ledgers.length > 1 && (
          <LedgerFilterChips
            partnerId={partner.id}
            ledgers={stats.ledgers}
            selectedLedgerId={selectedLedger?.ledgerId ?? null}
          />
        )}

        {!hasActivity ? (
          <div className="rounded-xl border border-dashed px-4 py-12 text-center text-sm text-muted-foreground">
            {selectedLedger
              ? "この口座にはまだ取引がありません"
              : `${partner.name}さんとの取引はまだありません`}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-2">
              <OverviewTile
                label={role.tone === "settled" ? "残高" : role.label}
                value={formatYen(role.absAmount)}
                valueClassName={TONE_TEXT[role.tone]}
                sub={
                  stats.breakdown.unpaidInterest > 0
                    ? `うち利息 ${formatYen(stats.breakdown.unpaidInterest)}`
                    : undefined
                }
              />
              <OverviewTile
                label="付き合い"
                value={
                  stats.daysSinceFirst !== null
                    ? formatDuration(stats.daysSinceFirst)
                    : "—"
                }
                sub={
                  stats.firstDate
                    ? `${formatMonthLabel(jstMonthKey(stats.firstDate))}から`
                    : undefined
                }
              />
              <OverviewTile
                label="取引"
                value={`${stats.transactionCount}回`}
                sub={
                  stats.lastDate
                    ? `最後は${formatRelativeDay(stats.lastDate)}`
                    : undefined
                }
              />
            </div>

            {stats.timeline.length > 1 && (
              <StatsSection
                title="残高の推移"
                description="0より上は貸している、下は借りている"
              >
                <div className="rounded-xl border bg-card px-2 pt-3 pb-2 shadow-sm">
                  <BalanceHistoryChart data={stats.timeline} />
                </div>
              </StatsSection>
            )}

            {(showTheirs || showMine) && (
              <StatsSection
                title="返済の傾向"
                description="貸し借りは古いものから順に返済で埋まるとみなしています"
              >
                <div className="space-y-2">
                  {showTheirs && (
                    <RepaymentCard
                      side="credit"
                      title={`${partner.name}さんの返済`}
                      summary={stats.theirRepayment}
                      showSettlements
                    />
                  )}
                  {showMine && (
                    <RepaymentCard
                      side="debt"
                      title="あなたの返済"
                      summary={stats.myRepayment}
                      showSettlements={!showTheirs}
                    />
                  )}
                </div>
              </StatsSection>
            )}

            <StatsSection title="貸し借りの流れ" description="これまでの合計">
              <MovementFlowCards flows={stats.flows} />
            </StatsSection>

            {hasMonthly && (
              <StatsSection
                title="月ごとの推移"
                description="直近12ヶ月。上が渡したお金、下が受け取ったお金"
              >
                <div className="space-y-2">
                  <div className="rounded-xl border bg-card px-2 pt-3 pb-2 shadow-sm">
                    <MonthlyMovementChart data={stats.monthly} />
                  </div>
                  <MonthlyMovementTable data={stats.monthly} />
                </div>
              </StatsSection>
            )}

            {stats.purposes.length > 0 && (
              <StatsSection title="よく使う用途">
                <PurposeList purposes={stats.purposes} />
              </StatsSection>
            )}

            {stats.ledgers.length > 1 && !selectedLedger && (
              <StatsSection
                title="口座ごと"
                description="タップでその口座に絞り込めます"
              >
                <LedgerBreakdown partnerId={partner.id} ledgers={stats.ledgers} />
              </StatsSection>
            )}
          </>
        )}
      </div>
    </div>
  );
}
