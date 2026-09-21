/**
 * 管理画面のダッシュボード。
 * 「全体の規模」「お金の総量」「異常が起きていないか」を1画面で把握する。
 */

import Link from "next/link";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { getAdminOverview } from "@/actions/admin/queries";
import {
  EmptyRow,
  PageHeader,
  Panel,
  StatTile,
  TableWrap,
  Td,
  Th,
  formatYen,
} from "@/components/features/admin/admin-ui";
import { AdminTransactionTable } from "@/components/features/admin/transaction-table";
import { formatDateTimeForDisplay, formatYMD, toJST } from "@/lib/date-utils";

export default async function AdminDashboardPage() {
  const overview = await getAdminOverview();

  const alerts = [
    overview.stalledInterestLedgerCount > 0 && {
      href: "/admin/ledgers",
      text: `${overview.stalledInterestLedgerCount}件の口座で、1週間以上利息が発生していません`,
    },
    overview.expiringShareLinkCount > 0 && {
      href: "/admin/share-links",
      text: `${overview.expiringShareLinkCount}件の共有リンクが2週間以内に期限切れになります`,
    },
  ].filter((a): a is { href: string; text: string } => Boolean(a));

  return (
    <>
      <PageHeader
        title="ダッシュボード"
        description="ツケカン全体の状況と、気にかけるべき異常"
      />

      <Panel className="p-4">
        {alerts.length === 0 ? (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400" />
            気にかけるべき異常はありません
          </p>
        ) : (
          <ul className="space-y-2">
            {alerts.map((alert) => (
              <li key={alert.href}>
                <Link
                  href={alert.href}
                  className="flex items-center gap-2 text-sm text-amber-700 hover:underline dark:text-amber-400"
                >
                  <AlertTriangle className="size-4 shrink-0" />
                  {alert.text}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile
          label="アカウント"
          value={overview.accountCount.toLocaleString()}
          sub={`直近30日で +${overview.newAccountsLast30Days}`}
          href="/admin/accounts"
        />
        <StatTile
          label="相手"
          value={overview.partnerCount.toLocaleString()}
          sub={`うちアーカイブ ${overview.archivedPartnerCount}`}
        />
        <StatTile
          label="口座"
          value={overview.ledgerCount.toLocaleString()}
          sub={`うち利子つき ${overview.interestLedgerCount}`}
          href="/admin/ledgers"
        />
        <StatTile
          label="取引"
          value={overview.transactionCount.toLocaleString()}
          sub={`直近30日で +${overview.transactionsLast30Days}`}
          href="/admin/transactions"
        />
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile
          label="貸借残高の合計"
          value={formatYen(overview.breakdown.total)}
          sub="全アカウントの合計（元本 + 未払利息）"
          tone={overview.breakdown.total < 0 ? "negative" : "default"}
        />
        <StatTile
          label="未払利息の合計"
          value={formatYen(overview.breakdown.unpaidInterest)}
          sub={`元本 ${formatYen(overview.breakdown.principal)}`}
          tone={overview.breakdown.unpaidInterest > 0 ? "warning" : "default"}
        />
        <StatTile
          label="累計の貸出"
          value={formatYen(overview.totalLent)}
          sub={`累計の返済・借入 ${formatYen(overview.totalBorrowed)}`}
        />
        <StatTile
          label="有効な共有リンク"
          value={overview.activeShareLinkCount.toLocaleString()}
          sub={
            overview.expiringShareLinkCount > 0
              ? `まもなく期限切れ ${overview.expiringShareLinkCount}`
              : "期限切れが近いものはありません"
          }
          tone={overview.expiringShareLinkCount > 0 ? "warning" : "default"}
          href="/admin/share-links"
        />
      </div>

      <Panel
        title="利子ジョブ"
        description="週次の自動利子ジョブが動いているかの目安"
        action={
          <Link href="/admin/jobs" className="text-xs text-primary hover:underline">
            ジョブの詳細 →
          </Link>
        }
      >
        <div className="px-4 py-3 text-sm">
          {overview.lastInterestAccruedAt ? (
            <p>
              最後に利息が発生したのは{" "}
              <span className="font-medium">
                {formatDateTimeForDisplay(overview.lastInterestAccruedAt)}
              </span>
              です。
            </p>
          ) : (
            <p className="text-muted-foreground">
              まだ一度も利息が発生していません。
            </p>
          )}
        </div>
      </Panel>

      <div className="grid gap-4 xl:grid-cols-[1.6fr_1fr]">
        <Panel
          title="直近の取引"
          action={
            <Link
              href="/admin/transactions"
              className="text-xs text-primary hover:underline"
            >
              すべて見る →
            </Link>
          }
        >
          <AdminTransactionTable rows={overview.recentTransactions} />
        </Panel>

        <Panel
          title="最近のアカウント"
          action={
            <Link
              href="/admin/accounts"
              className="text-xs text-primary hover:underline"
            >
              すべて見る →
            </Link>
          }
        >
          <TableWrap>
            <thead>
              <tr>
                <Th>アカウント</Th>
                <Th align="right">相手</Th>
                <Th align="right">登録日</Th>
              </tr>
            </thead>
            <tbody>
              {overview.recentAccounts.length === 0 ? (
                <EmptyRow colSpan={3}>アカウントがまだありません</EmptyRow>
              ) : (
                overview.recentAccounts.map((a) => (
                  <tr key={a.id} className="border-t">
                    <Td>
                      <Link
                        href={`/admin/accounts/${a.id}`}
                        className="font-medium hover:underline"
                      >
                        {a.name}
                      </Link>
                      <div className="truncate text-xs text-muted-foreground">
                        {a.email}
                      </div>
                    </Td>
                    <Td align="right">{a.partnerCount}</Td>
                    <Td align="right" className="text-muted-foreground">
                      {formatYMD(toJST(a.createdAt))}
                    </Td>
                  </tr>
                ))
              )}
            </tbody>
          </TableWrap>
        </Panel>
      </div>

      <p className="text-xs text-muted-foreground">
        残高はいずれも記録者（オーナー）視点。プラスは「貸している」、マイナスは「借りている」を表す。
      </p>
    </>
  );
}
