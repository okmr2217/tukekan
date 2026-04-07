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
    return { balance: 0, totalLent: 0, totalBorrowed: 0 };
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

  const [aggregate, lentAggregate, borrowedAggregate] = await Promise.all([
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
  ]);

  return {
    balance: aggregate._sum.amount ?? 0,
    totalLent: lentAggregate._sum.amount ?? 0,
    totalBorrowed: Math.abs(borrowedAggregate._sum.amount ?? 0),
  };
}
