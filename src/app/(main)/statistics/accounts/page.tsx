import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import {
  getPartnerLedgerStats,
  getOverallLedgerStats,
  getInterestBearingLedgers,
} from "@/actions/ledger-stats";
import { getMonthlyStats } from "@/actions/stats";
import type { MonthlyStat } from "@/actions/stats";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Globe } from "lucide-react";
import { cn } from "@/lib/utils";
import { MobileHeader } from "@/components/layouts/mobile-header";
import { LedgerStatsPartnerRow } from "@/components/features/stats/ledger-stats-partner-row";
import { InterestLedgerTable } from "@/components/features/stats/interest-ledger-table";

function MonthlyTableRow({ stat }: { stat: MonthlyStat }) {
  const hasActivity = stat.totalLent > 0 || stat.totalBorrowed > 0;

  return (
    <tr className="border-b last:border-b-0">
      <td className="py-2.5 pr-3 text-sm font-medium whitespace-nowrap">
        {stat.monthLabel}
      </td>
      <td className="py-2.5 pr-3 text-sm tabular-nums text-right">
        {hasActivity ? `¥${stat.totalLent.toLocaleString()}` : (
          <span className="text-muted-foreground">—</span>
        )}
      </td>
      <td className="py-2.5 pr-3 text-sm tabular-nums text-right">
        {hasActivity ? (
          <span className="text-destructive">¥{stat.totalBorrowed.toLocaleString()}</span>
        ) : (
          <span className="text-muted-foreground">—</span>
        )}
      </td>
      <td
        className={cn(
          "py-2.5 text-sm font-semibold tabular-nums text-right",
          hasActivity
            ? stat.net < 0
              ? "text-destructive"
              : "text-foreground"
            : "text-muted-foreground",
        )}
      >
        {hasActivity
          ? `${stat.net < 0 ? "-" : "+"}¥${Math.abs(stat.net).toLocaleString()}`
          : "—"}
      </td>
    </tr>
  );
}

function SummaryTile({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "gold" | "destructive";
}) {
  return (
    <div className="bg-card rounded-xl p-4 text-center border border-border">
      <div
        className={cn(
          "text-2xl font-bold tabular-nums",
          tone === "gold" && "text-amber-600 dark:text-amber-400",
          tone === "destructive" && "text-destructive",
          !tone && "text-foreground",
        )}
      >
        {value}
      </div>
      <div className="text-xs text-muted-foreground mt-1">{label}</div>
    </div>
  );
}

export default async function AccountStatisticsPage() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const [partnerStats, overallStats, monthlyStats, interestLedgers] = await Promise.all([
    getPartnerLedgerStats(),
    getOverallLedgerStats(),
    getMonthlyStats(),
    getInterestBearingLedgers(),
  ]);

  return (
    <div className="flex flex-col">
      <MobileHeader title="統計（口座別）" />

      <div className="max-w-lg md:max-w-3xl lg:max-w-5xl mx-auto w-full">
        <div className="px-4 pt-3 pb-4 text-left">
          <p className="text-xs text-muted-foreground mb-3">
            口座（週利率）を踏まえた貸借の集計と推移
          </p>
          <p className="text-sm text-muted-foreground">現在の貸借残高合計</p>
          <p
            className={cn(
              "mt-1 text-3xl font-bold tabular-nums",
              overallStats.balance < 0 ? "text-destructive" : "text-foreground",
            )}
          >
            {overallStats.balance < 0 ? "-" : ""}¥
            {Math.abs(overallStats.balance).toLocaleString()}
          </p>
        </div>

        <Tabs defaultValue="partners" className="w-full">
          <div className="px-4 pb-3">
            <TabsList className="w-full h-10 md:w-auto">
              <TabsTrigger value="partners">
                <Users />
                相手
              </TabsTrigger>
              <TabsTrigger value="overall">
                <Globe />
                全体
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="partners">
            {partnerStats.length === 0 ? (
              <div className="flex items-center justify-center p-8 text-muted-foreground">
                相手が登録されていません
              </div>
            ) : (
              <div className="px-4 space-y-2">
                {partnerStats.map((stat) => (
                  <LedgerStatsPartnerRow key={stat.partnerId} stat={stat} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="overall">
            <div className="px-4 space-y-5">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                <SummaryTile
                  label="累計貸出"
                  value={`¥${overallStats.totalLent.toLocaleString()}`}
                />
                <SummaryTile
                  label="累計借入"
                  value={`¥${overallStats.totalBorrowed.toLocaleString()}`}
                />
                <SummaryTile
                  label="取引回数"
                  value={`${overallStats.transactionCount}回`}
                />
                <SummaryTile
                  label="見込み利子合計"
                  value={`+¥${overallStats.estimatedInterestTotal.toLocaleString()}`}
                  tone="gold"
                />
              </div>

              <div className="grid lg:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium mb-2">利子が発生している口座</p>
                  <InterestLedgerTable ledgers={interestLedgers} />
                </div>

                <div className="rounded-lg border p-4">
                  <p className="text-sm font-medium mb-3">月別推移（直近12ヶ月）</p>
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="pb-2 pr-3 text-xs font-medium text-muted-foreground text-left">
                          月
                        </th>
                        <th className="pb-2 pr-3 text-xs font-medium text-muted-foreground text-right">
                          貸出
                        </th>
                        <th className="pb-2 pr-3 text-xs font-medium text-muted-foreground text-right">
                          借入
                        </th>
                        <th className="pb-2 text-xs font-medium text-muted-foreground text-right">
                          残高
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...monthlyStats].reverse().map((stat) => (
                        <MonthlyTableRow key={stat.month} stat={stat} />
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
