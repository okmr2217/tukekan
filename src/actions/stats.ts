"use server";

import { and, asc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { partner as partnerTable, transaction } from "@/db/schema";
import { getSession } from "@/lib/auth";
import {
  getNextInterestPreview,
  toInterestSettings,
  type LedgerInterestSettings,
} from "@/lib/ledger-interest";
import {
  calcLedgerBreakdown,
  calcPartnerBreakdown,
  type LedgerBalanceBreakdown,
} from "@/lib/ledger-balance";
import {
  analyzeMovements,
  balanceTimeline,
  monthEndPositions,
  monthlyMovements,
  sumMovements,
  summarizeRepayment,
  topPurposes,
  type BalancePoint,
  type MonthEndPosition,
  type MonthlyMovement,
  type MovementTotals,
  type PurposeStat,
  type RepaymentSummary,
} from "@/lib/movement-stats";
import { resolveStatsPeriod, type StatsPeriod } from "@/lib/stats-period";
import { isInterestKind } from "@/lib/transaction-kind";

/*
 * 統計ページ（全体 /statistics・相手ごと /partners/[id]/statistics）の集計。
 *
 * 取引をまとめて読み、名目への分解や返済の傾向は `src/lib/movement-stats.ts` で計算する。
 * アーカイブ済みの相手も含める（相手のアーカイブはホームと取引フォームの候補から
 * 外すだけで、貸し借りそのものは残っているため）。アーカイブ済みの取引は含めない。
 */

const DAY_MS = 24 * 60 * 60 * 1000;

/** 残高があるのに、この日数より長く取引がない相手を「動きのない貸し借り」として出す */
const DORMANT_DAYS = 60;

export type LedgerStat = LedgerInterestSettings & {
  ledgerId: string;
  title: string;
  partnerId: string;
  partnerName: string;
  /** 合計残高（元本 + 未払利息） */
  balance: number;
  breakdown: LedgerBalanceBreakdown;
  unpaidInterest: number;
  /** 残高が変わらなければ次回発生する利息（見込み） */
  nextInterestAmount: number;
  transactionCount: number;
  /** 全期間の名目ごとの合計 */
  movements: MovementTotals;
};

/** 全体の統計の「相手ごと」1行 */
export type PartnerStatsRow = {
  partnerId: string;
  partnerName: string;
  isArchived: boolean;
  /** 全口座を合算した今の残高 */
  balance: number;
  /** 期間中の取引の回数（利息を含まない） */
  periodCount: number;
  /** 期間中に動いた金額（貸した・返済された・借りた・返済した の合計） */
  periodVolume: number;
  lastDate: Date | null;
  /** 相手の返済の傾向（自分の貸しがどう返ってきているか） */
  repayment: RepaymentSummary;
};

/** 残高があるのに、しばらく取引がない相手 */
export type DormantBalance = {
  partnerId: string;
  partnerName: string;
  balance: number;
  lastDate: Date;
  days: number;
};

export type OverallStatistics = {
  period: StatsPeriod;
  hasTransactions: boolean;
  /** 今の残高（ホームの合計と同じく、相手ごとに全口座を合算してから向きを決める） */
  position: {
    lending: number;
    lendingCount: number;
    borrowing: number;
    borrowingCount: number;
    unpaidInterest: number;
    nextInterest: number;
  };
  /** 期間中の名目ごとの合計 */
  flows: MovementTotals;
  /** 期間中の取引の回数（利息を含まない） */
  transactionCount: number;
  monthly: MonthlyMovement[];
  monthEnd: MonthEndPosition[];
  /** 相手全体の返済の傾向（全期間） */
  theirRepayment: RepaymentSummary;
  myRepayment: RepaymentSummary;
  partners: PartnerStatsRow[];
  dormant: DormantBalance[];
  dormantDays: number;
  /** 利子が設定されている、または未払利息が残っている口座 */
  interestLedgers: LedgerStat[];
};

export type PartnerStatistics = {
  partner: { id: string; name: string; isArchived: boolean };
  ledgers: LedgerStat[];
  /** 絞り込み中の口座。すべての口座なら null */
  selectedLedger: LedgerStat | null;
  /** 絞り込みの範囲の今の残高 */
  breakdown: LedgerBalanceBreakdown;
  firstDate: Date | null;
  /** 最初の取引から今までの日数 */
  daysSinceFirst: number | null;
  lastDate: Date | null;
  /** 取引の回数（利息を含まない） */
  transactionCount: number;
  interestCount: number;
  /** 全期間の名目ごとの合計 */
  flows: MovementTotals;
  theirRepayment: RepaymentSummary;
  myRepayment: RepaymentSummary;
  timeline: BalancePoint[];
  /** 直近12ヶ月 */
  monthly: MonthlyMovement[];
  purposes: PurposeStat[];
};

type SourceTransaction = {
  amount: number;
  kind: string;
  date: Date;
  createdAt: Date;
  partnerId: string;
  ledgerId: string | null;
  purpose: string | null;
};

type SourcePartner = {
  id: string;
  name: string;
  isArchived: boolean;
  ledgers: Array<{
    id: string;
    title: string;
    annualInterestRateBp: number;
    interestAccrualWeekday: number;
    interestCompounding: boolean;
  }>;
};

async function loadStatsSource(
  userId: string,
  partnerId?: string,
): Promise<{ partners: SourcePartner[]; transactions: SourceTransaction[] }> {
  const [partners, transactions] = await Promise.all([
    db.query.partner.findMany({
      where: and(
        eq(partnerTable.ownerId, userId),
        partnerId ? eq(partnerTable.id, partnerId) : undefined,
      ),
      columns: { id: true, name: true, isArchived: true },
      orderBy: asc(partnerTable.name),
      with: {
        ledgers: {
          orderBy: (l, { asc }) => asc(l.createdAt),
          columns: {
            id: true,
            title: true,
            annualInterestRateBp: true,
            interestAccrualWeekday: true,
            interestCompounding: true,
          },
        },
      },
    }),
    db
      .select({
        amount: transaction.amount,
        kind: transaction.kind,
        date: transaction.date,
        createdAt: transaction.createdAt,
        partnerId: transaction.partnerId,
        ledgerId: transaction.ledgerId,
        purpose: transaction.purpose,
      })
      .from(transaction)
      .where(
        and(
          eq(transaction.ownerId, userId),
          eq(transaction.isArchived, false),
          partnerId ? eq(transaction.partnerId, partnerId) : undefined,
        ),
      ),
  ]);

  return { partners, transactions };
}

function buildLedgerStats(
  partners: SourcePartner[],
  transactions: SourceTransaction[],
): LedgerStat[] {
  const byLedger = new Map<string, SourceTransaction[]>();
  for (const t of transactions) {
    if (!t.ledgerId) continue;
    const rows = byLedger.get(t.ledgerId);
    if (rows) rows.push(t);
    else byLedger.set(t.ledgerId, [t]);
  }

  return partners.flatMap((partner) =>
    partner.ledgers.map((ledger) => {
      const rows = byLedger.get(ledger.id) ?? [];
      const settings = toInterestSettings(ledger);
      const breakdown = calcLedgerBreakdown(rows);
      return {
        ledgerId: ledger.id,
        title: ledger.title,
        partnerId: partner.id,
        partnerName: partner.name,
        ...settings,
        balance: breakdown.total,
        breakdown,
        unpaidInterest: breakdown.unpaidInterest,
        nextInterestAmount: getNextInterestPreview(breakdown, settings).amount,
        transactionCount: rows.length,
        movements: sumMovements(analyzeMovements(rows).parts),
      };
    }),
  );
}

function isInterest(t: { kind: string }): boolean {
  return isInterestKind(t.kind);
}

function latestDate(rows: Array<{ date: Date }>): Date | null {
  return rows.reduce<Date | null>(
    (max, t) => (!max || t.date > max ? t.date : max),
    null,
  );
}

function earliestDate(rows: Array<{ date: Date }>): Date | null {
  return rows.reduce<Date | null>(
    (min, t) => (!min || t.date < min ? t.date : min),
    null,
  );
}

export async function getOverallStatistics(
  period: StatsPeriod,
): Promise<OverallStatistics | null> {
  const session = await getSession();
  if (!session) return null;

  const now = new Date();
  const { partners, transactions } = await loadStatsSource(session.userId);
  const analysis = analyzeMovements(transactions);
  const range = resolveStatsPeriod(period, earliestDate(transactions), now);
  const inPeriod = (date: Date) => !range.from || date >= range.from;
  const ledgerStats = buildLedgerStats(partners, transactions);

  const txByPartner = new Map<string, SourceTransaction[]>();
  for (const t of transactions) {
    const rows = txByPartner.get(t.partnerId);
    if (rows) rows.push(t);
    else txByPartner.set(t.partnerId, [t]);
  }

  const periodVolumeByPartner = new Map<string, number>();
  for (const p of analysis.parts) {
    if (!inPeriod(p.date) || p.movement.startsWith("interest")) continue;
    periodVolumeByPartner.set(
      p.partnerId,
      (periodVolumeByPartner.get(p.partnerId) ?? 0) + p.amount,
    );
  }

  const partnerRows: PartnerStatsRow[] = partners
    .filter((p) => txByPartner.has(p.id))
    .map((p) => {
      const rows = txByPartner.get(p.id)!;
      return {
        partnerId: p.id,
        partnerName: p.name,
        isArchived: p.isArchived,
        balance: rows.reduce((sum, t) => sum + t.amount, 0),
        periodCount: rows.filter((t) => !isInterest(t) && inPeriod(t.date))
          .length,
        periodVolume: periodVolumeByPartner.get(p.id) ?? 0,
        lastDate: latestDate(rows.filter((t) => !isInterest(t))),
        repayment: summarizeRepayment(analysis, "credit", p.id, now),
      };
    })
    .sort(
      (a, b) =>
        b.periodVolume - a.periodVolume ||
        (b.lastDate?.getTime() ?? 0) - (a.lastDate?.getTime() ?? 0),
    );

  const creditors = partnerRows.filter((p) => p.balance > 0);
  const debtors = partnerRows.filter((p) => p.balance < 0);

  const dormant: DormantBalance[] = partnerRows
    .filter((p) => p.balance !== 0 && p.lastDate)
    .map((p) => ({
      partnerId: p.partnerId,
      partnerName: p.partnerName,
      balance: p.balance,
      lastDate: p.lastDate!,
      days: Math.floor((now.getTime() - p.lastDate!.getTime()) / DAY_MS),
    }))
    .filter((p) => p.days >= DORMANT_DAYS)
    .sort((a, b) => b.days - a.days);

  const interestLedgers = ledgerStats
    .filter((l) => l.annualInterestRate > 0 || l.unpaidInterest > 0)
    .sort(
      (a, b) =>
        b.unpaidInterest - a.unpaidInterest ||
        b.nextInterestAmount - a.nextInterestAmount,
    );

  return {
    period,
    hasTransactions: transactions.length > 0,
    position: {
      lending: creditors.reduce((sum, p) => sum + p.balance, 0),
      lendingCount: creditors.length,
      borrowing: debtors.reduce((sum, p) => sum - p.balance, 0),
      borrowingCount: debtors.length,
      unpaidInterest: ledgerStats.reduce((sum, l) => sum + l.unpaidInterest, 0),
      nextInterest: ledgerStats.reduce((sum, l) => sum + l.nextInterestAmount, 0),
    },
    flows: sumMovements(analysis.parts, range.from),
    transactionCount: transactions.filter(
      (t) => !isInterest(t) && inPeriod(t.date),
    ).length,
    monthly: monthlyMovements(analysis.parts, range.months),
    monthEnd: monthEndPositions(transactions, range.months),
    theirRepayment: summarizeRepayment(analysis, "credit", undefined, now),
    myRepayment: summarizeRepayment(analysis, "debt", undefined, now),
    partners: partnerRows,
    dormant,
    dormantDays: DORMANT_DAYS,
    interestLedgers,
  };
}

export async function getPartnerStatistics(
  partnerId: string,
  ledgerId?: string,
): Promise<PartnerStatistics | null> {
  const session = await getSession();
  if (!session) return null;

  const now = new Date();
  const { partners, transactions } = await loadStatsSource(
    session.userId,
    partnerId,
  );
  const partner = partners[0];
  if (!partner) return null;

  const ledgers = buildLedgerStats(partners, transactions);
  const selectedLedger = ledgers.find((l) => l.ledgerId === ledgerId) ?? null;
  const scoped = selectedLedger
    ? transactions.filter((t) => t.ledgerId === selectedLedger.ledgerId)
    : transactions;
  const userTransactions = scoped.filter((t) => !isInterest(t));

  const analysis = analyzeMovements(scoped);
  const { months } = resolveStatsPeriod("12m", null, now);
  const firstDate = earliestDate(userTransactions);

  return {
    partner: { id: partner.id, name: partner.name, isArchived: partner.isArchived },
    ledgers,
    selectedLedger,
    breakdown: selectedLedger
      ? selectedLedger.breakdown
      : calcPartnerBreakdown(scoped),
    firstDate,
    daysSinceFirst: firstDate
      ? Math.floor((now.getTime() - firstDate.getTime()) / DAY_MS)
      : null,
    lastDate: latestDate(userTransactions),
    transactionCount: userTransactions.length,
    interestCount: scoped.length - userTransactions.length,
    flows: sumMovements(analysis.parts),
    theirRepayment: summarizeRepayment(analysis, "credit", undefined, now),
    myRepayment: summarizeRepayment(analysis, "debt", undefined, now),
    timeline: balanceTimeline(scoped, now),
    monthly: monthlyMovements(analysis.parts, months),
    purposes: topPurposes(scoped),
  };
}
