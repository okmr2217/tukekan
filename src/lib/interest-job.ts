/**
 * 週次自動利子ジョブの本体。
 *
 * Cron Triggers からの自動実行（`src/app/api/cron/weekly-interest/route.ts`）、管理画面の
 * 「ジョブ」ページからの手動実行、手元用の `scripts/weekly-interest.ts` がすべてこの関数を使う。
 * どちらから動かしても同じ結果になるように、ロジックはここ1箇所に置く。
 *
 * ルール（docs/11-cloudflare-workers.md と同じ）:
 *   - 対象: 年利 > 0 かつ、発生曜日が当日（JST）の口座。相手がアーカイブ済みの口座は除く
 *   - 利息額: 対象額 × 年利 ÷ 52（四捨五入）。単利なら元本、複利なら元本＋未払利息が対象額
 *   - 対象額が0以下なら発生させない
 *   - lastInterestAccruedAt が当日（JST）ならスキップする（再実行しても二重に発生しない）
 *
 * dryRun: true なら「何が起きるか」だけを計算し、DBは一切変更しない。
 */

import { and, eq, gt } from "drizzle-orm";
import type { Database } from "@/lib/db";
import { ledger as ledgerTable, transaction } from "@/db/schema";
import { calcLedgerBreakdown } from "@/lib/ledger-balance";
import { formatDateToJST, toJST } from "@/lib/date-utils";
import {
  calcWeeklyInterestAmount,
  formatRate,
  getInterestBase,
  getWeekdayLabel,
  toInterestSettings,
} from "@/lib/ledger-interest";

/** 1口座ぶんの処理結果 */
export type InterestJobLedgerResult = {
  ledgerId: string;
  ledgerTitle: string;
  partnerId: string;
  partnerName: string;
  ownerId: string;
  ownerName: string;
  /**
   * created              : 利息の取引を作成した（dryRunなら「作成する予定」）
   * skipped_already_done : 同じ日にすでに発生済み
   * skipped_no_base      : 対象額が0以下で利息が発生しない
   */
  status: "created" | "skipped_already_done" | "skipped_no_base";
  /** 利息が課金される対象額（単利なら元本、複利なら元本＋未払利息） */
  base: number;
  /** 発生する利息額（円） */
  amount: number;
  annualRate: number;
  compounding: boolean;
};

export type InterestJobResult = {
  /** ジョブを走らせた時刻 */
  runAt: Date;
  /** JSTでの実行日（YYYY-MM-DD） */
  dateJST: string;
  /** JSTでの曜日（0=日 〜 6=土） */
  weekday: number;
  dryRun: boolean;
  /** 当日が発生曜日だった口座の数 */
  targetCount: number;
  created: number;
  skipped: number;
  /** 発生した（する）利息の合計額 */
  totalAmount: number;
  ledgers: InterestJobLedgerResult[];
};

export type RunInterestJobOptions = {
  /** 実行時刻。テストや「特定の曜日として動かす」ときに差し替える */
  now?: Date;
  /** true ならDBを変更せず、結果の見積もりだけを返す */
  dryRun?: boolean;
};

export async function runInterestJob(
  db: Database,
  options: RunInterestJobOptions = {},
): Promise<InterestJobResult> {
  const now = options.now ?? new Date();
  const dryRun = options.dryRun ?? false;
  const weekday = toJST(now).getDay();
  const dateJST = formatDateToJST(now);

  const ledgers = await db.query.ledger.findMany({
    where: and(
      gt(ledgerTable.annualInterestRateBp, 0),
      eq(ledgerTable.interestAccrualWeekday, weekday),
    ),
    with: {
      partner: {
        columns: { id: true, name: true, ownerId: true, isArchived: true },
        with: { owner: { columns: { name: true } } },
      },
      transactions: {
        where: (t, { eq }) => eq(t.isArchived, false),
        columns: { amount: true, kind: true, date: true, createdAt: true },
      },
    },
  });

  // アーカイブ済みの相手の口座には利息を発生させない
  const targets = ledgers.filter((ledger) => !ledger.partner.isArchived);

  const results: InterestJobLedgerResult[] = [];

  for (const ledger of targets) {
    const settings = toInterestSettings(ledger);
    const breakdown = calcLedgerBreakdown(ledger.transactions);
    const base = getInterestBase(breakdown, settings.interestCompounding);
    const amount = calcWeeklyInterestAmount(base, settings.annualInterestRate);

    const common = {
      ledgerId: ledger.id,
      ledgerTitle: ledger.title,
      partnerId: ledger.partner.id,
      partnerName: ledger.partner.name,
      ownerId: ledger.partner.ownerId,
      ownerName: ledger.partner.owner.name,
      base,
      amount,
      annualRate: settings.annualInterestRate,
      compounding: settings.interestCompounding,
    };

    // 同じ日に二重で発生させない（ジョブの再実行・手動実行対策）
    if (
      ledger.lastInterestAccruedAt &&
      formatDateToJST(ledger.lastInterestAccruedAt) === dateJST
    ) {
      results.push({ ...common, status: "skipped_already_done" });
      continue;
    }

    if (amount <= 0) {
      results.push({ ...common, status: "skipped_no_base" });
      continue;
    }

    if (!dryRun) {
      // 利息の記録と lastInterestAccruedAt の更新は必ずセットで反映させる（片方だけだと
      // 再実行時に二重発生する）。D1 の batch は1つのトランザクションとして実行され、
      // どれか1つでも失敗すれば全体がロールバックされる
      await db.batch([
        db.insert(transaction).values({
          amount,
          kind: "INTEREST",
          purpose: `利子（年利${formatRate(settings.annualInterestRate)}%）`,
          date: now,
          ownerId: ledger.partner.ownerId,
          partnerId: ledger.partner.id,
          ledgerId: ledger.id,
        }),
        db
          .update(ledgerTable)
          .set({ lastInterestAccruedAt: now })
          .where(eq(ledgerTable.id, ledger.id)),
      ]);
    }

    results.push({ ...common, status: "created" });
  }

  const created = results.filter((r) => r.status === "created");

  return {
    runAt: now,
    dateJST,
    weekday,
    dryRun,
    targetCount: targets.length,
    created: created.length,
    skipped: results.length - created.length,
    totalAmount: created.reduce((sum, r) => sum + r.amount, 0),
    ledgers: results,
  };
}

/** 1口座ぶんの結果をログ1行にする（スクリプト・管理画面で共用） */
export function describeLedgerResult(result: InterestJobLedgerResult): string {
  const label = `${result.partnerName} / ${result.ledgerTitle}`;

  switch (result.status) {
    case "skipped_already_done":
      return `Skip "${label}": already accrued today`;
    case "skipped_no_base":
      return `Skip "${label}": base is ¥${result.base}`;
    case "created":
      return (
        `${label} → +¥${result.amount} (` +
        `${result.compounding ? "複利" : "単利"} base ¥${result.base} × ` +
        `年利${formatRate(result.annualRate)}% ÷ 52)`
      );
  }
}

/** 実行結果の1行サマリー */
export function describeJobResult(result: InterestJobResult): string {
  const prefix = result.dryRun ? "[dry-run] " : "";
  return (
    `${prefix}${result.dateJST}（${getWeekdayLabel(result.weekday)}曜日）: ` +
    `対象 ${result.targetCount}件 / 発生 ${result.created}件 ` +
    `¥${result.totalAmount.toLocaleString()} / スキップ ${result.skipped}件`
  );
}
