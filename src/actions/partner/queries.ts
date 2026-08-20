"use server";

import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import type { Partner, PartnerWithBalance, PartnerById } from "./types";

export async function getPartners(): Promise<Partner[]> {
  const session = await getSession();
  if (!session) return [];

  return prisma.partner.findMany({
    where: { ownerId: session.userId, isArchived: false },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
}

export async function getPartnerById(
  partnerId: string,
): Promise<PartnerById | null> {
  const session = await getSession();
  if (!session) return null;

  const partner = await prisma.partner.findUnique({
    where: { id: partnerId },
    select: { id: true, name: true, isArchived: true, ownerId: true },
  });

  if (!partner || partner.ownerId !== session.userId) return null;

  return {
    id: partner.id,
    name: partner.name,
    isArchived: partner.isArchived,
  };
}

export async function getPartnersWithBalance(): Promise<PartnerWithBalance[]> {
  const session = await getSession();
  if (!session) return [];

  const partners = await prisma.partner.findMany({
    where: { ownerId: session.userId },
    select: {
      id: true,
      name: true,
      isArchived: true,
      createdAt: true,
      transactions: {
        where: { isArchived: false },
        select: { amount: true },
      },
    },
    orderBy: { name: "asc" },
  });

  return partners.map((p) => ({
    id: p.id,
    name: p.name,
    isArchived: p.isArchived,
    createdAt: p.createdAt,
    transactionCount: p.transactions.length,
    balance: p.transactions.reduce((sum, t) => sum + t.amount, 0),
  }));
}
