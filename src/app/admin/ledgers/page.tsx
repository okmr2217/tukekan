/**
 * 口座の一覧。利子つきの口座の監視が主な用途。
 *
 * 週次ジョブは「その曜日の口座だけ」を毎日処理するので、うまく動かなくても
 * 誰も気づけない。ここで「1週間以上利息が発生していない口座」を洗い出す。
 */

import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { getAdminLedgers } from "@/actions/admin/queries";
import { INTEREST_STALLED_DAYS } from "@/actions/admin/types";
import {
  PageHeader,
  Panel,
  StatTile,
  formatYen,
} from "@/components/features/admin/admin-ui";
import { AdminLedgerTable } from "@/components/features/admin/ledger-table";

export default async function AdminLedgersPage({
  searchParams,
}: {
  searchParams: Promise<{ interest?: string }>;
}) {
  const { interest } = await searchParams;
  const onlyInterest = interest === "1";
  const ledgers = await getAdminLedgers(onlyInterest);

  const stalled = ledgers.filter((l) => l.isInterestStalled);
  const unpaidInterestTotal = ledgers.reduce(
    (sum, l) => sum + l.breakdown.unpaidInterest,
    0,
  );
  const nextWeekAmount = ledgers.reduce(
    (sum, l) => sum + (l.nextInterest.isEligible ? l.nextInterest.amount : 0),
    0,
  );

  return (
    <>
      <PageHeader
        title="口座"
        description="口座ごとの残高と利子の設定。ジョブが止まっていないかもここで確認する"
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label="口座" value={ledgers.length.toLocaleString()} />
        <StatTile
          label="未払利息の合計"
          value={formatYen(unpaidInterestTotal)}
          tone={unpaidInterestTotal > 0 ? "warning" : "default"}
        />
        <StatTile
          label="次の1週間で発生する利息"
          value={formatYen(nextWeekAmount)}
          sub="いまの残高のまま推移した場合"
        />
        <StatTile
          label="停止の疑い"
          value={stalled.length.toLocaleString()}
          sub={`${INTEREST_STALLED_DAYS}日以上、利息が発生していない口座`}
          tone={stalled.length > 0 ? "negative" : "default"}
        />
      </div>

      {stalled.length > 0 && (
        <Panel className="border-destructive/40 p-4">
          <p className="flex items-start gap-2 text-sm">
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-destructive" />
            <span>
              利子つきなのに{INTEREST_STALLED_DAYS}
              日以上利息が発生していない口座が {stalled.length} 件あります。
              週次ジョブ（Cron Triggers）が失敗していないか、
              <Link
                href="/admin/jobs"
                className="mx-1 text-primary hover:underline"
              >
                ジョブのページ
              </Link>
              で確認してください。
            </span>
          </p>
        </Panel>
      )}

      <div className="flex gap-2 text-xs">
        <Link
          href="/admin/ledgers"
          className={
            onlyInterest
              ? "text-muted-foreground hover:underline"
              : "font-medium text-primary"
          }
        >
          すべての口座
        </Link>
        <span className="text-muted-foreground">/</span>
        <Link
          href="/admin/ledgers?interest=1"
          className={
            onlyInterest
              ? "font-medium text-primary"
              : "text-muted-foreground hover:underline"
          }
        >
          利子つきのみ
        </Link>
      </div>

      <Panel
        title={`${ledgers.length}件`}
        description="停止の疑いがある口座 → 年利の高い順 → 残高の大きい順"
      >
        <AdminLedgerTable
          rows={ledgers}
          emptyText={
            onlyInterest ? "利子つきの口座はありません" : "口座がありません"
          }
        />
      </Panel>
    </>
  );
}
