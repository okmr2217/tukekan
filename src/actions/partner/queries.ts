"use server";

import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import type {
  Partner,
  PartnerWithBalance,
  PartnerForHome,
  PartnerById,
} from "./types";

export async function getPartners(): Promise<Partner[]> {
  const session = await getSession();
  if (!session) return [];

  return prisma.partner.findMany({
    where: { ownerId: session.userId, isArchived: false },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
}

export async function getPartnersForHome(): Promise<PartnerForHome[]> {
  const session = await getSession();
  if (!session) return [];

  const partners = await prisma.partner.findMany({
    where: { ownerId: session.userId, isArchived: false },
    select: {
      id: true,
      name: true,
      transactions: {
        where: { isArchived: false },
        select: { amount: true, description: true, date: true },
        orderBy: { date: "desc" },
      },
    },
  });

  return partners
    .map((p) => ({
      id: p.id,
      name: p.name,
      balance: p.transactions.reduce((sum, t) => sum + t.amount, 0),
      lastTransaction: p.transactions[0] ?? null,
    }))
    .sort((a, b) => {
      if (!a.lastTransaction && !b.lastTransaction) return 0;
      if (!a.lastTransaction) return 1;
      if (!b.lastTransaction) return -1;
      return (
        new Date(b.lastTransaction.date).getTime() -
        new Date(a.lastTransaction.date).getTime()
      );
    });
}

export async function getPartnerById(
  partnerId: string,
): Promise<PartnerById | null> {
  const session = await getSession();
  if (!session) return null;

  const partner = await prisma.partner.findUnique({
    where: { id: partnerId },
    select: {
      id: true,
      name: true,
      isArchived: true,
      ownerId: true,
      shareToken: true,
      shareTokenExpiresAt: true,
      transactions: {
        where: { isArchived: false },
        select: { amount: true },
      },
      notes: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!partner || partner.ownerId !== session.userId) return null;

  return {
    id: partner.id,
    name: partner.name,
    isArchived: partner.isArchived,
    shareToken: partner.shareToken,
    shareTokenExpiresAt: partner.shareTokenExpiresAt,
    balance: partner.transactions.reduce((sum, t) => sum + t.amount, 0),
    notes: partner.notes,
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
      shareToken: true,
      shareTokenExpiresAt: true,
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
    shareToken: p.shareToken,
    shareTokenExpiresAt: p.shareTokenExpiresAt,
    createdAt: p.createdAt,
    transactionCount: p.transactions.length,
    balance: p.transactions.reduce((sum, t) => sum + t.amount, 0),
  }));
}
