"use server";

import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export type PartnerStat = {
  partnerId: string;
  partnerName: string;
  balance: number;
  totalLent: number;
  totalBorrowed: number;
  transactionCount: number;
};

export type OverallStat = {
  balance: number;
  totalLent: number;
  totalBorrowed: number;
  transactionCount: number;
};

export type MonthlyStat = {
  month: string; // "YYYY-MM"
  monthLabel: string; // "YYYY年M月"
  totalLent: number;
  totalBorrowed: number;
  net: number;
};

export async function getPartnerStats(): Promise<PartnerStat[]> {
  const session = await getSession();
  if (!session) {
    return [];
  }

  const partners = await prisma.partner.findMany({
    where: { ownerId: session.userId, isArchived: false },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  const stats = await Promise.all(
    partners.map(async (partner) => {
      const baseWhere = {
        ownerId: session.userId,
        partnerId: partner.id,
        isArchived: false,
      };

      const [aggregate, lentAggregate, borrowedAggregate, count] =
        await Promise.all([
          prisma.transaction.aggregate({
            where: baseWhere,
            _sum: { amount: true },
          }),
          prisma.transaction.aggregate({
            where: { ...baseWhere, amount: { gt: 0 } },
            _sum: { amount: true },
          }),
          prisma.transaction.aggregate({
            where: { ...baseWhere, amount: { lt: 0 } },
            _sum: { amount: true },
          }),
          prisma.transaction.count({ where: baseWhere }),
        ]);

      return {
        partnerId: partner.id,
        partnerName: partner.name,
        balance: aggregate._sum.amount ?? 0,
        totalLent: lentAggregate._sum.amount ?? 0,
        totalBorrowed: Math.abs(borrowedAggregate._sum.amount ?? 0),
        transactionCount: count,
      };
    }),
  );

  return stats;
}

export async function getOverallStats(): Promise<OverallStat> {
  const session = await getSession();
  if (!session) {
    return { balance: 0, totalLent: 0, totalBorrowed: 0, transactionCount: 0 };
  }

  const activePartnerIds = await prisma.partner
    .findMany({
      where: { ownerId: session.userId, isArchived: false },
      select: { id: true },
    })
    .then((partners) => partners.map((p) => p.id));

  const baseWhere = {
    ownerId: session.userId,
    isArchived: false,
    partnerId: { in: activePartnerIds },
  };

  const [aggregate, lentAggregate, borrowedAggregate, transactionCount] =
    await Promise.all([
      prisma.transaction.aggregate({
        where: baseWhere,
        _sum: { amount: true },
      }),
      prisma.transaction.aggregate({
        where: { ...baseWhere, amount: { gt: 0 } },
        _sum: { amount: true },
      }),
      prisma.transaction.aggregate({
        where: { ...baseWhere, amount: { lt: 0 } },
        _sum: { amount: true },
      }),
      prisma.transaction.count({ where: baseWhere }),
    ]);

  return {
    balance: aggregate._sum.amount ?? 0,
    totalLent: lentAggregate._sum.amount ?? 0,
    totalBorrowed: Math.abs(borrowedAggregate._sum.amount ?? 0),
    transactionCount,
  };
}

export async function getMonthlyStats(): Promise<MonthlyStat[]> {
  const session = await getSession();
  if (!session) return [];

  const activePartnerIds = await prisma.partner
    .findMany({
      where: { ownerId: session.userId, isArchived: false },
      select: { id: true },
    })
    .then((partners) => partners.map((p) => p.id));

  // JST での現在月を基準に直近12ヶ月を計算
  const nowJST = new Date(
    new Date().toLocaleString("en-US", { timeZone: "Asia/Tokyo" }),
  );
  const startOfEarliestMonthJST = new Date(
    nowJST.getFullYear(),
    nowJST.getMonth() - 11,
    1,
  );
  // JST 0:00 → UTC (-9h)
  const startUTC = new Date(
    startOfEarliestMonthJST.getTime() - 9 * 60 * 60 * 1000,
  );

  const transactions = await prisma.transaction.findMany({
    where: {
      ownerId: session.userId,
      isArchived: false,
      partnerId: { in: activePartnerIds },
      date: { gte: startUTC },
    },
    select: { amount: true, date: true },
  });

  // 直近12ヶ月分のキーを初期化
  const monthMap = new Map<string, { totalLent: number; totalBorrowed: number }>();
  for (let i = 11; i >= 0; i--) {
    const d = new Date(nowJST.getFullYear(), nowJST.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    monthMap.set(key, { totalLent: 0, totalBorrowed: 0 });
  }

  // 取引を JST 月ごとに集計
  for (const tx of transactions) {
    const jst = new Date(
      tx.date.toLocaleString("en-US", { timeZone: "Asia/Tokyo" }),
    );
    const key = `${jst.getFullYear()}-${String(jst.getMonth() + 1).padStart(2, "0")}`;
    const entry = monthMap.get(key);
    if (!entry) continue;
    if (tx.amount > 0) {
      entry.totalLent += tx.amount;
    } else {
      entry.totalBorrowed += Math.abs(tx.amount);
    }
  }

  return Array.from(monthMap.entries()).map(([month, data]) => {
    const [year, monthNum] = month.split("-").map(Number);
    return {
      month,
      monthLabel: `${year}年${monthNum}月`,
      totalLent: data.totalLent,
      totalBorrowed: data.totalBorrowed,
      net: data.totalLent - data.totalBorrowed,
    };
  });
}
