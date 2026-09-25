import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getOverallStatistics } from "@/actions/stats";
import { MobileHeader } from "@/components/layouts/mobile-header";
import { STATS_PERIOD_LABELS, toStatsPeriod } from "@/lib/stats-period";
import { formatYen } from "@/lib/transaction-wording";
import { hasRepaymentData } from "@/lib/movement-stats";
import { StatsSection } from "@/components/features/stats/stats-section";
import { PeriodTabs } from "@/components/features/stats/period-tabs";
import { MovementFlowCards } from "@/components/features/stats/movement-flow-cards";
import {
  MonthEndPositionChart,
  MonthlyMovementChart,
} from "@/components/features/stats/movement-charts";
import { MonthlyMovementTable } from "@/components/features/stats/monthly-movement-table";
import { RepaymentCard } from "@/components/features/stats/repayment-card";
import {
  DormantBalanceList,
  PartnerStatsList,
} from "@/components/features/stats/partner-stats-list";
import { InterestLedgerTable } from "@/components/features/stats/interest-ledger-table";

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

function InterestTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border bg-card px-3 py-2.5 shadow-sm">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className="mt-0.5 truncate text-base font-bold tabular-nums text-amber-600 dark:text-amber-400">
        {value}
      </p>
    </div>
  );
}

/**
 * 全体の統計。今の残高はホームで見られるので、ここでは
 * 「どう動いてきたか」（名目ごとの流れ・推移・返済の傾向）を主役にする。
 */
export default async function StatisticsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const params = await searchParams;
  const period = toStatsPeriod(
    Array.isArray(params.period) ? params.period[0] : params.period,
  );
  const stats = await getOverallStatistics(period);
  if (!stats) {
    redirect("/login");
  }

  const hasMonthEnd = stats.monthEnd.some((m) => m.lending || m.borrowing);
  const hasMonthly = stats.monthly.some(
    (m) => m.lend || m.repayReceived || m.borrow || m.repayMade,
  );
  const showTheirs = hasRepaymentData(stats.theirRepayment);
  const showMine = hasRepaymentData(stats.myRepayment);
  const periodInterest = stats.flows.interestCredit + stats.flows.interestDebt;

  return (
    <div className="flex flex-col">
      <MobileHeader title="統計" />

      <div className="mx-auto w-full max-w-lg space-y-6 px-4 pt-3 pb-6">
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">
            貸し借りの流れと、返済の傾向
          </p>
          <PeriodTabs current={period} />
        </div>

        {!stats.hasTransactions ? (
          <div className="rounded-xl border border-dashed px-4 py-12 text-center text-sm text-muted-foreground">
            取引を記録すると、ここに集計が出ます
          </div>
        ) : (
          <>
            <StatsSection
              title="貸し借りの流れ"
              description={`${STATS_PERIOD_LABELS[period]}に動いたお金 · 取引${stats.transactionCount}回`}
            >
              <MovementFlowCards flows={stats.flows} />
            </StatsSection>

            {hasMonthly && (
              <StatsSection
                title="月ごとの推移"
                description="上が渡したお金（貸した・返済した）、下が受け取ったお金（借りた・返済された）"
              >
                <div className="space-y-2">
                  <div className="rounded-xl border bg-card px-2 pt-3 pb-2 shadow-sm">
                    <MonthlyMovementChart data={stats.monthly} />
                  </div>
                  <MonthlyMovementTable data={stats.monthly} />
                </div>
              </StatsSection>
            )}

            {hasMonthEnd && (
              <StatsSection
                title="残高の推移"
                description="月末時点で貸している・借りている金額の合計"
              >
                <div className="rounded-xl border bg-card px-2 pt-3 pb-2 shadow-sm">
                  <MonthEndPositionChart data={stats.monthEnd} />
                </div>
              </StatsSection>
            )}

            {(showTheirs || showMine) && (
              <StatsSection
                title="返済の傾向"
                description="全期間。貸し借りは古いものから順に返済で埋まるとみなしています"
              >
                <div className="space-y-2">
                  {showTheirs && (
                    <RepaymentCard
                      side="credit"
                      title="相手からの返済"
                      summary={stats.theirRepayment}
                    />
                  )}
                  {showMine && (
                    <RepaymentCard
                      side="debt"
                      title="あなたの返済"
                      summary={stats.myRepayment}
                    />
                  )}
                </div>
              </StatsSection>
            )}

            {stats.dormant.length > 0 && (
              <StatsSection
                title="動きのない貸し借り"
                description={`残高があるのに${stats.dormantDays}日以上取引がない相手`}
              >
                <DormantBalanceList rows={stats.dormant} />
              </StatsSection>
            )}

            <StatsSection
              title="相手ごと"
              description={`${STATS_PERIOD_LABELS[period]}に動いた金額の多い順。タップで相手ごとの統計へ`}
            >
              <PartnerStatsList rows={stats.partners} />
            </StatsSection>

            {stats.interestLedgers.length > 0 && (
              <StatsSection title="利息">
                <div className="space-y-2">
                  <div className="grid grid-cols-3 gap-2">
                    <InterestTile
                      label="未払利息"
                      value={formatYen(stats.position.unpaidInterest)}
                    />
                    <InterestTile
                      label="次回の見込み"
                      value={formatYen(stats.position.nextInterest)}
                    />
                    <InterestTile
                      label={`${STATS_PERIOD_LABELS[period]}に付いた`}
                      value={formatYen(periodInterest)}
                    />
                  </div>
                  <InterestLedgerTable ledgers={stats.interestLedgers} />
                </div>
              </StatsSection>
            )}
          </>
        )}
      </div>
    </div>
  );
}
