"use server";

import { and, asc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { partner as partnerTable } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { toJST } from "@/lib/date-utils";
import {
  getNextInterestPreview,
  toInterestSettings,
  type LedgerInterestSettings,
} from "@/lib/ledger-interest";
import {
  calcLedgerBreakdown,
  type LedgerBalanceBreakdown,
} from "@/lib/ledger-balance";
import { isInterestKind } from "@/lib/transaction-kind";

export type LedgerStat = LedgerInterestSettings & {
  ledgerId: string;
  title: string;
  /** 合計残高（元本 + 未払利息） */
  balance: number;
  breakdown: LedgerBalanceBreakdown;
  /** 貸した金額の合計（利息は含まない） */
  totalLent: number;
  totalBorrowed: number;
  transactionCount: number;
  /** 最後の取引からの経過日数 */
  elapsedDays: number;
  /** 未払いのまま残っている利息（実績） */
  unpaidInterest: number;
  /** 残高が変わらなければ次回発生する利息（見込み） */
  nextInterestAmount: number;
};

export type PartnerLedgerStat = {
  partnerId: string;
  partnerName: string;
  balance: number;
  totalLent: number;
  totalBorrowed: number;
  unpaidInterestTotal: number;
  nextInterestTotal: number;
  ledgers: LedgerStat[];
};

export type OverallLedgerStat = {
  balance: number;
  totalLent: number;
  totalBorrowed: number;
  transactionCount: number;
  unpaidInterestTotal: number;
  nextInterestTotal: number;
};

export type InterestLedgerStat = LedgerStat & {
  partnerId: string;
  partnerName: string;
};

function elapsedDaysSince(date: Date): number {
  const nowJST = toJST(new Date());
  const fromJST = toJST(date);
  const diffMs = nowJST.getTime() - fromJST.getTime();
  return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
}

function buildLedgerStat(ledger: {
  id: string;
  title: string;
  annualInterestRateBp: number;
  interestAccrualWeekday: number;
  interestCompounding: boolean;
  createdAt: Date;
  transactions: { amount: number; kind: string; date: Date; createdAt: Date }[];
}): LedgerStat {
  const settings = toInterestSettings(ledger);
  const breakdown = calcLedgerBreakdown(ledger.transactions);

  const lent = ledger.transactions
    .filter((t) => t.amount > 0 && !isInterestKind(t.kind))
    .reduce((sum, t) => sum + t.amount, 0);
  const borrowed = ledger.transactions
    .filter((t) => t.amount < 0)
    .reduce((sum, t) => sum + t.amount, 0);

  const lastDate =
    ledger.transactions.length > 0
      ? ledger.transactions.reduce(
          (latest, t) => (t.date > latest ? t.date : latest),
          ledger.transactions[0].date,
        )
      : ledger.createdAt;

  const nextInterest = getNextInterestPreview(breakdown, settings);

  return {
    ledgerId: ledger.id,
    title: ledger.title,
    ...settings,
    balance: breakdown.total,
    breakdown,
    totalLent: lent,
    totalBorrowed: Math.abs(borrowed),
    transactionCount: ledger.transactions.length,
    elapsedDays: elapsedDaysSince(lastDate),
    unpaidInterest: breakdown.unpaidInterest,
    nextInterestAmount: nextInterest.amount,
  };
}

export async function getPartnerLedgerStats(): Promise<PartnerLedgerStat[]> {
  const session = await getSession();
  if (!session) return [];

  const partners = await db.query.partner.findMany({
    where: and(
      eq(partnerTable.ownerId, session.userId),
      eq(partnerTable.isArchived, false),
    ),
    orderBy: asc(partnerTable.name),
    columns: { id: true, name: true },
    with: {
      ledgers: {
        orderBy: (l, { asc }) => asc(l.createdAt),
        columns: {
          id: true,
          title: true,
          annualInterestRateBp: true,
          interestAccrualWeekday: true,
          interestCompounding: true,
          createdAt: true,
        },
        with: {
          transactions: {
            where: (t, { eq }) => eq(t.isArchived, false),
            columns: { amount: true, kind: true, date: true, createdAt: true },
          },
        },
      },
    },
  });

  return partners.map((partner) => {
    const ledgers = partner.ledgers.map(buildLedgerStat);
    return {
      partnerId: partner.id,
      partnerName: partner.name,
      balance: ledgers.reduce((sum, l) => sum + l.balance, 0),
      totalLent: ledgers.reduce((sum, l) => sum + l.totalLent, 0),
      totalBorrowed: ledgers.reduce((sum, l) => sum + l.totalBorrowed, 0),
      unpaidInterestTotal: ledgers.reduce((sum, l) => sum + l.unpaidInterest, 0),
      nextInterestTotal: ledgers.reduce((sum, l) => sum + l.nextInterestAmount, 0),
      ledgers,
    };
  });
}

export async function getOverallLedgerStats(): Promise<OverallLedgerStat> {
  const partnerStats = await getPartnerLedgerStats();

  return partnerStats.reduce(
    (acc, p) => ({
      balance: acc.balance + p.balance,
      totalLent: acc.totalLent + p.totalLent,
      totalBorrowed: acc.totalBorrowed + p.totalBorrowed,
      transactionCount:
        acc.transactionCount +
        p.ledgers.reduce((sum, l) => sum + l.transactionCount, 0),
      unpaidInterestTotal: acc.unpaidInterestTotal + p.unpaidInterestTotal,
      nextInterestTotal: acc.nextInterestTotal + p.nextInterestTotal,
    }),
    {
      balance: 0,
      totalLent: 0,
      totalBorrowed: 0,
      transactionCount: 0,
      unpaidInterestTotal: 0,
      nextInterestTotal: 0,
    },
  );
}

export async function getInterestBearingLedgers(): Promise<InterestLedgerStat[]> {
  const partnerStats = await getPartnerLedgerStats();

  const rows = partnerStats.flatMap((p) =>
    p.ledgers
      .filter((l) => l.annualInterestRate > 0 || l.unpaidInterest > 0)
      .map((l) => ({ ...l, partnerId: p.partnerId, partnerName: p.partnerName })),
  );

  return rows.sort(
    (a, b) =>
      b.unpaidInterest - a.unpaidInterest ||
      b.nextInterestAmount - a.nextInterestAmount,
  );
}
