import { ArrowRight, CircleHelp } from "lucide-react";
import { cn } from "@/lib/utils";
import { describeBalanceRole, formatYen } from "@/lib/transaction-wording";
import { formatRelativeDay } from "@/lib/date-utils";
import { formatMonthLabel, jstMonthKey } from "@/lib/stats-period";
import { TONE_TEXT } from "@/components/features/transaction/transaction-tone";
import { StatsSection, formatDuration } from "@/components/features/stats/stats-section";
import { RepaymentCard } from "@/components/features/stats/repayment-card";
import { MovementFlowCards } from "@/components/features/stats/movement-flow-cards";
import {
  BalanceHistoryChart,
  MonthlyMovementChart,
} from "@/components/features/stats/movement-charts";
import { LpBody, LpHeading, LpSection } from "./lp-section";
import { MockAppHeader, MockHeaderIcon, PhoneFrame } from "./phone-frame";
import {
  LP_PARTNER_IDS,
  buildLpPartnerStats,
  lpPartner,
  type LpDemo,
  type LpPartnerStats,
} from "./demo-data";

/**
 * 統計。相手ごとの返済の傾向を主役にする（docs/14-lp-visual-assets.md 8章）。
 * 数字はすべて健太さんのダミーの取引34件を、相手ごとの統計と同じ集計に通して出している。
 */
export function LpStats({ demo }: { demo: LpDemo }) {
  const kenta = lpPartner(demo, LP_PARTNER_IDS.kenta);
  const stats = buildLpPartnerStats(kenta, demo.now);
  const title = `${kenta.name}さんの返済`;

  return (
    <LpSection>
      <div className="max-w-[640px]">
        <LpHeading lines={["貸したお金、", "平均何日で返ってくる？"]} />
        <LpBody className="mt-6">
          相手ごとの統計では、貸したお金が平均何日で返ってきているか、1ヶ月以内に返ってきた割合、まだ返ってきていない額がわかります。月ごとの貸し借りや残高の推移もグラフで。次に貸すかどうか、利子をつけるかどうか──感覚ではなく、記録をもとに考えられます。
        </LpBody>
      </div>

      <div className="mt-12 grid grid-cols-1 items-center gap-10 lg:grid-cols-[410px_minmax(0,1fr)] lg:gap-16">
        <PhoneFrame label={`${kenta.name}さんの統計`} screenClassName="h-[700px]">
          <StatsScreen name={kenta.name} stats={stats} title={title} />
        </PhoneFrame>

        <div>
          {/* 1列で並ぶ幅では枠の中のカードがそのまま読めるので、拡大表示は出さない */}
          <div className="hidden items-center gap-3 lg:flex">
            <ArrowRight className="size-6 shrink-0 text-muted-foreground" />
            {/* 返済の傾向のカードだけを拡大して見せる */}
            <div className="min-w-0 flex-1 rounded-3xl border bg-muted/40 p-4 [zoom:1.25]">
              <RepaymentCard
                side="credit"
                title={title}
                summary={stats.theirRepayment}
                showSettlements
              />
            </div>
          </div>
          <p className="text-sm leading-[1.8] text-muted-foreground lg:mt-6 lg:pl-9">
            点数やランクはつけません。判断の材料になる数字だけを出します。
          </p>
        </div>
      </div>

      <div className="mt-10 rounded-3xl border bg-card px-3 pt-5 pb-3 shadow-sm md:px-6">
        <p className="px-1 text-sm font-bold text-foreground">
          {kenta.name}さんとの月ごとの推移
        </p>
        <p className="mt-0.5 mb-3 px-1 text-xs text-muted-foreground">
          直近12ヶ月。上が渡したお金、下が受け取ったお金
        </p>
        <MonthlyMovementChart data={stats.monthly} />
      </div>
    </LpSection>
  );
}

/** 相手ごとの統計（/partners/[id]/statistics）の上半分。返済の傾向が見えるところで切る */
function StatsScreen({
  name,
  stats,
  title,
}: {
  name: string;
  stats: LpPartnerStats;
  title: string;
}) {
  const role = describeBalanceRole(stats.breakdown.total);

  return (
    <>
      <MockAppHeader
        title={`${name}さんの統計`}
        back
        actions={
          <MockHeaderIcon>
            <CircleHelp />
          </MockHeaderIcon>
        }
      />
      <div className="space-y-6 px-4 pt-3 pb-6">
        <div className="grid grid-cols-3 gap-2">
          <OverviewTile
            label={role.tone === "settled" ? "残高" : role.label}
            value={formatYen(role.absAmount)}
            valueClassName={TONE_TEXT[role.tone]}
          />
          <OverviewTile
            label="付き合い"
            value={stats.daysSinceFirst !== null ? formatDuration(stats.daysSinceFirst) : "—"}
            sub={stats.firstDate ? `${formatMonthLabel(jstMonthKey(stats.firstDate))}から` : undefined}
          />
          <OverviewTile
            label="取引"
            value={`${stats.transactionCount}回`}
            sub={stats.lastDate ? `最後は${formatRelativeDay(stats.lastDate)}` : undefined}
          />
        </div>

        <StatsSection title="残高の推移" description="0より上は貸している、下は借りている">
          <div className="rounded-xl border bg-card px-2 pt-3 pb-2 shadow-sm">
            <BalanceHistoryChart data={stats.timeline} />
          </div>
        </StatsSection>

        <StatsSection
          title="返済の傾向"
          description="貸し借りは古いものから順に返済で埋まるとみなしています"
        >
          <RepaymentCard
            side="credit"
            title={title}
            summary={stats.theirRepayment}
            showSettlements
          />
        </StatsSection>

        <StatsSection title="貸し借りの流れ" description="これまでの合計">
          <MovementFlowCards flows={stats.flows} />
        </StatsSection>
      </div>
    </>
  );
}

/** 統計ページの概要タイルと同じ見た目 */
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
