import { redirect } from "next/navigation";
import { getSession } from "@/actions/auth";
import {
  getPartnerStats,
  getOverallStats,
  getMonthlyStats,
} from "@/actions/stats";
import type { MonthlyStat } from "@/actions/stats";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Globe } from "lucide-react";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/layouts/page-header";

function MonthlyTableRow({ stat }: { stat: MonthlyStat }) {
  const hasActivity = stat.totalLent > 0 || stat.totalBorrowed > 0;

  return (
    <tr className="border-b last:border-b-0">
      <td className="py-2.5 pr-3 text-sm font-medium whitespace-nowrap">
        {stat.monthLabel}
      </td>
      <td className="py-2.5 pr-3 text-sm tabular-nums text-right">
        {hasActivity ? (
          `¥${stat.totalLent.toLocaleString()}`
        ) : (
          <span className="text-muted-foreground">—</span>
        )}
      </td>
      <td className="py-2.5 pr-3 text-sm tabular-nums text-right">
        {hasActivity ? (
          <span className="text-destructive">
            ¥{stat.totalBorrowed.toLocaleString()}
          </span>
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

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-card rounded-xl p-4 text-center border border-border">
      <div className="text-2xl font-bold text-foreground tabular-nums">
        {value}
      </div>
      <div className="text-xs text-muted-foreground mt-1">{label}</div>
    </div>
  );
}

export default async function StatsPage() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const [partnerStats, overallStats, monthlyStats] = await Promise.all([
    getPartnerStats(),
    getOverallStats(),
    getMonthlyStats(),
  ]);

  return (
    <div className="flex flex-col">
      <PageHeader title="統計" description="貸借の集計と推移" />

      {/* 残高合計 - タブの上に常時表示 */}
      <div className="px-4 pt-3 pb-4 text-left">
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
          <TabsList className="w-full h-10">
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

        {/* 相手タブ - テーブル形式 */}
        <TabsContent value="partners">
          {partnerStats.length === 0 ? (
            <div className="flex items-center justify-center p-8 text-muted-foreground">
              相手が登録されていません
            </div>
          ) : (
            <div className="px-4">
              <div className="rounded-lg border overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-muted/40">
                      <th className="py-2.5 px-3 text-xs font-medium text-muted-foreground text-left">
                        相手
                      </th>
                      <th className="py-2.5 px-3 text-xs font-medium text-muted-foreground text-right">
                        残高
                      </th>
                      <th className="py-2.5 px-3 text-xs font-medium text-muted-foreground text-right">
                        貸出
                      </th>
                      <th className="py-2.5 px-3 text-xs font-medium text-muted-foreground text-right">
                        借入
                      </th>
                      <th className="py-2.5 px-3 text-xs font-medium text-muted-foreground text-right">
                        回数
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {partnerStats.map((stat) => (
                      <tr
                        key={stat.partnerId}
                        className="border-b last:border-b-0"
                      >
                        <td className="py-2.5 px-3 text-sm font-medium whitespace-nowrap">
                          {stat.partnerName}
                        </td>
                        <td
                          className={cn(
                            "py-2.5 px-3 text-sm font-semibold tabular-nums text-right",
                            stat.balance < 0
                              ? "text-destructive"
                              : "text-foreground",
                          )}
                        >
                          {stat.balance < 0 ? "-" : ""}¥
                          {Math.abs(stat.balance).toLocaleString()}
                        </td>
                        <td className="py-2.5 px-3 text-sm tabular-nums text-right">
                          ¥{stat.totalLent.toLocaleString()}
                        </td>
                        <td className="py-2.5 px-3 text-sm tabular-nums text-right text-destructive">
                          ¥{stat.totalBorrowed.toLocaleString()}
                        </td>
                        <td className="py-2.5 px-3 text-sm tabular-nums text-right text-muted-foreground">
                          {stat.transactionCount}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </TabsContent>

        {/* 全体タブ - 3カードデザイン + 月別推移テーブル */}
        <TabsContent value="overall">
          <div className="px-4 space-y-3">
            <div className="grid grid-cols-3 gap-2">
              <SummaryCard
                label="累計貸出"
                value={`¥${overallStats.totalLent.toLocaleString()}`}
              />
              <SummaryCard
                label="累計借入"
                value={`¥${overallStats.totalBorrowed.toLocaleString()}`}
              />
              <SummaryCard
                label="取引回数"
                value={`${overallStats.transactionCount}回`}
              />
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
        </TabsContent>
      </Tabs>
    </div>
  );
}
