"use server";

import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { toJST } from "@/lib/date-utils";
import { getEffectiveWeeklyRate } from "@/lib/ledger-interest";

export type LedgerStat = {
  ledgerId: string;
  title: string;
  weeklyInterestRateUnder5000: number;
  weeklyInterestRateFrom5000: number;
  effectiveWeeklyInterestRate: number;
  balance: number;
  totalLent: number;
  totalBorrowed: number;
  transactionCount: number;
  elapsedDays: number;
  estimatedInterest: number;
};

export type PartnerLedgerStat = {
  partnerId: string;
  partnerName: string;
  balance: number;
  totalLent: number;
  totalBorrowed: number;
  estimatedInterestTotal: number;
  ledgers: LedgerStat[];
};

export type OverallLedgerStat = {
  balance: number;
  totalLent: number;
  totalBorrowed: number;
  transactionCount: number;
  estimatedInterestTotal: number;
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
  weeklyInterestRateUnder5000: unknown;
  weeklyInterestRateFrom5000: unknown;
  createdAt: Date;
  transactions: { amount: number; date: Date }[];
}): LedgerStat {
  const rateUnder5000 = ledger.weeklyInterestRateUnder5000
    ? Number(ledger.weeklyInterestRateUnder5000)
    : 0;
  const rateFrom5000 = ledger.weeklyInterestRateFrom5000
    ? Number(ledger.weeklyInterestRateFrom5000)
    : 0;
  const lent = ledger.transactions
    .filter((t) => t.amount > 0)
    .reduce((sum, t) => sum + t.amount, 0);
  const borrowed = ledger.transactions
    .filter((t) => t.amount < 0)
    .reduce((sum, t) => sum + t.amount, 0);
  const balance = lent + borrowed;

  const lastDate =
    ledger.transactions.length > 0
      ? ledger.transactions.reduce(
          (latest, t) => (t.date > latest ? t.date : latest),
          ledger.transactions[0].date,
        )
      : ledger.createdAt;
  const elapsedDays = elapsedDaysSince(lastDate);

  const effectiveRate = getEffectiveWeeklyRate(balance, rateUnder5000, rateFrom5000);
  const estimatedInterest =
    effectiveRate > 0 && balance > 0
      ? Math.round(balance * (effectiveRate / 100) * (elapsedDays / 7))
      : 0;

  return {
    ledgerId: ledger.id,
    title: ledger.title,
    weeklyInterestRateUnder5000: rateUnder5000,
    weeklyInterestRateFrom5000: rateFrom5000,
    effectiveWeeklyInterestRate: effectiveRate,
    balance,
    totalLent: lent,
    totalBorrowed: Math.abs(borrowed),
    transactionCount: ledger.transactions.length,
    elapsedDays,
    estimatedInterest,
  };
}

export async function getPartnerLedgerStats(): Promise<PartnerLedgerStat[]> {
  const session = await getSession();
  if (!session) return [];

  const partners = await prisma.partner.findMany({
    where: { ownerId: session.userId, isArchived: false },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      ledgers: {
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          title: true,
          weeklyInterestRateUnder5000: true,
          weeklyInterestRateFrom5000: true,
          createdAt: true,
          transactions: {
            where: { isArchived: false },
            select: { amount: true, date: true },
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
      estimatedInterestTotal: ledgers.reduce((sum, l) => sum + l.estimatedInterest, 0),
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
      estimatedInterestTotal: acc.estimatedInterestTotal + p.estimatedInterestTotal,
    }),
    { balance: 0, totalLent: 0, totalBorrowed: 0, transactionCount: 0, estimatedInterestTotal: 0 },
  );
}

export async function getInterestBearingLedgers(): Promise<InterestLedgerStat[]> {
  const partnerStats = await getPartnerLedgerStats();

  const rows = partnerStats.flatMap((p) =>
    p.ledgers
      .filter(
        (l) => l.weeklyInterestRateUnder5000 > 0 || l.weeklyInterestRateFrom5000 > 0,
      )
      .map((l) => ({ ...l, partnerId: p.partnerId, partnerName: p.partnerName })),
  );

  return rows.sort((a, b) => b.estimatedInterest - a.estimatedInterest);
}
