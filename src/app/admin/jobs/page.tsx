/**
 * ジョブのページ。いまのところ対象は週次の自動利子ジョブだけ。
 *
 * 平常時は Cloudflare Workers の Cron Triggers（worker.ts → /api/cron/weekly-interest）が
 * 毎日 0:00 JST に走らせる。ここではその結果を確認し、自動実行が失敗したときに手動で流し直せる。
 * 実行内容は自動実行とまったく同じ（src/lib/interest-job.ts を共用）。
 */

import { getInterestJobStatus } from "@/actions/admin/queries";
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
import { AdminLedgerTable } from "@/components/features/admin/ledger-table";
import { RunInterestJobButtons } from "@/components/features/admin/run-interest-job-buttons";
import { Badge } from "@/components/ui/badge";
import { formatDateTimeForDisplay } from "@/lib/date-utils";
import { formatRate, getWeekdayLabel } from "@/lib/ledger-interest";

const STATUS_LABELS = {
  created: "発生する",
  skipped_already_done: "発生済み",
  skipped_no_base: "対象額なし",
} as const;

export default async function AdminJobsPage() {
  const { preview, ledgers, lastAccruedAt, lastRunLog, lastScheduledRunLog } =
    await getInterestJobStatus();

  const eligible = preview.ledgers.filter((l) => l.status === "created");
  const stalledCount = ledgers.filter((l) => l.isInterestStalled).length;

  return (
    <>
      <PageHeader
        title="ジョブ"
        description="週次の自動利子ジョブの状況と手動実行"
      />

      <Panel
        title="週次自動利子ジョブ"
        description="毎日 0:00 JST に Cron Triggers で起動し、その日が発生曜日の口座だけを処理する"
        action={
          <RunInterestJobButtons
            eligibleCount={eligible.length}
            eligibleAmount={preview.totalAmount}
          />
        }
      >
        <div className="grid grid-cols-2 gap-3 p-4 lg:grid-cols-4">
          <StatTile
            label="今日の対象口座"
            value={preview.targetCount.toLocaleString()}
            sub={`${preview.dateJST}（${getWeekdayLabel(preview.weekday)}曜日）`}
          />
          <StatTile
            label="いま実行したら発生する"
            value={`${eligible.length}件`}
            sub={`合計 ${formatYen(preview.totalAmount)}`}
            tone={eligible.length > 0 ? "positive" : "default"}
          />
          <StatTile
            label="最後に利息が発生した日時"
            value={lastAccruedAt ? formatDateTimeForDisplay(lastAccruedAt) : "—"}
          />
          <StatTile
            label="停止の疑いがある口座"
            value={stalledCount.toLocaleString()}
            tone={stalledCount > 0 ? "negative" : "default"}
            href="/admin/ledgers?interest=1"
          />
        </div>

        <div className="border-t px-4 py-3 text-xs text-muted-foreground">
          <p>
            「試し打ち」はDBを変更せず、いま実行したら何が起きるかだけを計算する。
            「いま実行する」は本当に利息の取引を作るが、同じ日に二重で発生しない仕組み
            （<code className="font-mono">lastInterestAccruedAt</code>）が効いているので、
            すでに発生済みの口座には何も起きない。
          </p>
          <p className="mt-2">
            最後の自動実行:{" "}
            {lastScheduledRunLog
              ? `${formatDateTimeForDisplay(lastScheduledRunLog.createdAt)} ・ ${lastScheduledRunLog.summary}`
              : "記録なし"}
          </p>
          {lastRunLog && (
            <p className="mt-2">
              最後の手動実行: {formatDateTimeForDisplay(lastRunLog.createdAt)} ・{" "}
              {lastRunLog.actorEmail} ・ {lastRunLog.summary}
            </p>
          )}
        </div>
      </Panel>

      <Panel
        title={`今日の処理対象（${preview.targetCount}件）`}
        description="発生曜日が今日にあたる口座。試し打ちと同じ内容"
      >
        <TableWrap>
          <thead>
            <tr>
              <Th>口座</Th>
              <Th>オーナー</Th>
              <Th align="right">対象額</Th>
              <Th align="right">年利</Th>
              <Th align="right">利息</Th>
              <Th align="center">結果</Th>
            </tr>
          </thead>
          <tbody>
            {preview.ledgers.length === 0 ? (
              <EmptyRow colSpan={6}>
                今日（{getWeekdayLabel(preview.weekday)}
                曜日）が発生曜日の口座はありません
              </EmptyRow>
            ) : (
              preview.ledgers.map((l) => (
                <tr key={l.ledgerId} className="border-t">
                  <Td>
                    <div className="font-medium">{l.ledgerTitle}</div>
                    <div className="text-xs text-muted-foreground">
                      {l.partnerName}
                    </div>
                  </Td>
                  <Td className="text-muted-foreground">{l.ownerName}</Td>
                  <Td align="right">
                    {formatYen(l.base)}
                    <div className="text-xs text-muted-foreground">
                      {l.compounding ? "複利" : "単利"}
                    </div>
                  </Td>
                  <Td align="right">{formatRate(l.annualRate)}%</Td>
                  <Td align="right">{formatYen(l.amount)}</Td>
                  <Td align="center">
                    <Badge
                      variant={
                        l.status === "created" ? "default" : "secondary"
                      }
                    >
                      {STATUS_LABELS[l.status]}
                    </Badge>
                  </Td>
                </tr>
              ))
            )}
          </tbody>
        </TableWrap>
      </Panel>

      <Panel
        title={`利子つきの口座（${ledgers.length}）`}
        description="曜日を問わず、利子が設定されているすべての口座"
      >
        <AdminLedgerTable
          rows={ledgers}
          emptyText="利子つきの口座はありません"
        />
      </Panel>
    </>
  );
}
