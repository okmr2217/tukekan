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

function AmountRow({
  label,
  amount,
  variant = "default",
}: {
  label: string;
  amount: number;
  variant?: "default" | "lent" | "borrowed";
}) {
  const colorClass =
    variant === "lent"
      ? "text-foreground"
      : variant === "borrowed"
        ? "text-destructive"
        : amount < 0
          ? "text-destructive"
          : "text-foreground";

  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className={cn("text-sm font-semibold tabular-nums", colorClass)}>
        {variant === "borrowed"
          ? `¥${amount.toLocaleString()}`
          : amount < 0 && variant === "default"
            ? `-¥${Math.abs(amount).toLocaleString()}`
            : `¥${Math.abs(amount).toLocaleString()}`}
      </span>
    </div>
  );
}

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
      <td className={cn(
        "py-2.5 text-sm font-semibold tabular-nums text-right",
        hasActivity
          ? stat.net < 0 ? "text-destructive" : "text-foreground"
          : "text-muted-foreground",
      )}>
        {hasActivity
          ? `${stat.net < 0 ? "-" : "+"}¥${Math.abs(stat.net).toLocaleString()}`
          : "—"}
      </td>
    </tr>
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
      <Tabs defaultValue="partners" className="w-full">
        <div className="p-4">
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

        <TabsContent value="partners">
          {partnerStats.length === 0 ? (
            <div className="flex items-center justify-center p-8 text-muted-foreground">
              相手が登録されていません
            </div>
          ) : (
            <div className="px-4 space-y-3">
              {partnerStats.map((stat) => (
                <div
                  key={stat.partnerId}
                  className="rounded-lg border p-4 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">{stat.partnerName}</span>
                    <span
                      className={cn(
                        "text-lg font-bold tabular-nums",
                        stat.balance < 0
                          ? "text-destructive"
                          : "text-foreground",
                      )}
                    >
                      {stat.balance < 0 ? "-" : ""}¥
                      {Math.abs(stat.balance).toLocaleString()}
                    </span>
                  </div>
                  <div className="border-t pt-2 space-y-1">
                    <AmountRow
                      label="累計の貸した金額"
                      amount={stat.totalLent}
                      variant="lent"
                    />
                    <AmountRow
                      label="累計の借りた金額"
                      amount={stat.totalBorrowed}
                      variant="borrowed"
                    />
                    <div className="flex items-center justify-between py-1">
                      <span className="text-sm text-muted-foreground">
                        取引回数
                      </span>
                      <span className="text-sm font-semibold tabular-nums">
                        {stat.transactionCount}回
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="overall">
          <div className="p-4 text-left">
            <p className="text-sm text-muted-foreground">現在の貸借残高合計</p>
            <p
              className={cn(
                "mt-2 text-3xl font-bold tabular-nums",
                overallStats.balance < 0
                  ? "text-destructive"
                  : "text-foreground",
              )}
            >
              {overallStats.balance < 0 ? "-" : ""}¥
              {Math.abs(overallStats.balance).toLocaleString()}
            </p>
          </div>

          <div className="px-4 mt-2 space-y-3">
            <div className="rounded-lg border p-4 space-y-2">
              <AmountRow
                label="累計の貸した金額"
                amount={overallStats.totalLent}
                variant="lent"
              />
              <AmountRow
                label="累計の借りた金額"
                amount={overallStats.totalBorrowed}
                variant="borrowed"
              />
              <div className="flex items-center justify-between py-1">
                <span className="text-sm text-muted-foreground">
                  取引回数合計
                </span>
                <span className="text-sm font-semibold tabular-nums">
                  {overallStats.transactionCount}回
                </span>
              </div>
            </div>

            <div className="rounded-lg border p-4">
              <p className="text-sm font-medium mb-3">月別推移（直近12ヶ月）</p>
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="pb-2 pr-3 text-xs font-medium text-muted-foreground text-left">月</th>
                    <th className="pb-2 pr-3 text-xs font-medium text-muted-foreground text-right">貸出</th>
                    <th className="pb-2 pr-3 text-xs font-medium text-muted-foreground text-right">借入</th>
                    <th className="pb-2 text-xs font-medium text-muted-foreground text-right">残高</th>
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
