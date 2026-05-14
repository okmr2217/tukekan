"use server";

import { createId } from "@paralleldrive/cuid2";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { revalidatePartnerScope } from "@/lib/revalidate";
import { findOwnedPartner } from "./_helpers";
import type { ShareTokenState, SharedPartnerData, PartnerNote } from "./types";

export async function generateShareToken(
  partnerId: string,
): Promise<ShareTokenState> {
  const session = await getSession();
  if (!session) return { error: "ログインが必要です" };
  if (!(await findOwnedPartner(partnerId, session.userId))) {
    return { error: "相手が見つかりません" };
  }

  const token = createId();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 90);

  await prisma.partner.update({
    where: { id: partnerId },
    data: { shareToken: token, shareTokenExpiresAt: expiresAt },
  });

  revalidatePartnerScope(partnerId);
  return { success: true, token };
}

export async function revokeShareToken(
  partnerId: string,
): Promise<{ error?: string; success?: boolean }> {
  const session = await getSession();
  if (!session) return { error: "ログインが必要です" };
  if (!(await findOwnedPartner(partnerId, session.userId))) {
    return { error: "相手が見つかりません" };
  }

  await prisma.partner.update({
    where: { id: partnerId },
    data: { shareToken: null, shareTokenExpiresAt: null },
  });

  revalidatePartnerScope(partnerId);
  return { success: true };
}

export async function getPartnerByShareToken(
  token: string,
): Promise<{ data?: SharedPartnerData; error?: string }> {
  const partner = await prisma.partner.findUnique({
    where: { shareToken: token },
    select: {
      id: true,
      name: true,
      shareTokenExpiresAt: true,
      owner: { select: { name: true } },
      transactions: {
        where: { isArchived: false },
        select: { id: true, amount: true, description: true, date: true },
        orderBy: { date: "desc" },
      },
      notes: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!partner) return { error: "invalid" };
  if (!partner.shareTokenExpiresAt || partner.shareTokenExpiresAt < new Date()) {
    return { error: "expired" };
  }

  const balance = partner.transactions.reduce((sum, t) => sum + t.amount, 0);

  let runningBalance = balance;
  const transactionsWithBalance = partner.transactions.map((t) => {
    const entry = { ...t, runningBalance };
    runningBalance -= t.amount;
    return entry;
  });

  return {
    data: {
      partnerName: partner.name,
      ownerName: partner.owner.name,
      balance,
      transactions: transactionsWithBalance,
      notes: partner.notes as PartnerNote[],
    },
  };
}
