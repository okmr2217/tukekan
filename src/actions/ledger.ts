"use server";

import { z } from "zod";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { findOwnedPartner } from "@/actions/partner/_helpers";

export type LedgerWithBalance = {
  id: string;
  title: string;
  weeklyInterestRate: number;
  balance: number;
  totalLent: number;
  totalBorrowed: number;
  transactionCount: number;
  createdAt: Date;
};

export async function getLedgersByPartner(
  partnerId: string,
): Promise<LedgerWithBalance[]> {
  const session = await getSession();
  if (!session) return [];
  if (!(await findOwnedPartner(partnerId, session.userId))) return [];

  const ledgers = await prisma.ledger.findMany({
    where: { partnerId },
    orderBy: { createdAt: "asc" },
    include: {
      transactions: {
        where: { isArchived: false },
        select: { amount: true },
      },
    },
  });

  return ledgers.map((l) => {
    const lent = l.transactions
      .filter((t) => t.amount > 0)
      .reduce((sum, t) => sum + t.amount, 0);
    const borrowed = l.transactions
      .filter((t) => t.amount < 0)
      .reduce((sum, t) => sum + t.amount, 0);

    return {
      id: l.id,
      title: l.title,
      weeklyInterestRate: l.weeklyInterestRate ? Number(l.weeklyInterestRate) : 0,
      balance: lent + borrowed,
      totalLent: lent,
      totalBorrowed: Math.abs(borrowed),
      transactionCount: l.transactions.length,
      createdAt: l.createdAt,
    };
  });
}

const ledgerSchema = z.object({
  title: z
    .string()
    .min(1, "口座名を入力してください")
    .max(30, "口座名は30文字以内で入力してください"),
  weeklyInterestRate: z
    .number()
    .min(0, "週利率は0%以上で入力してください")
    .max(100, "週利率は100%以下で入力してください"),
});

export type LedgerFormState = { error?: string; success?: boolean };

export async function createLedger(
  partnerId: string,
  input: { title: string; weeklyInterestRate: number },
): Promise<LedgerFormState> {
  const session = await getSession();
  if (!session) return { error: "ログインが必要です" };
  if (!(await findOwnedPartner(partnerId, session.userId))) {
    return { error: "相手が見つかりません" };
  }

  const result = ledgerSchema.safeParse(input);
  if (!result.success) return { error: result.error.issues[0].message };

  await prisma.ledger.create({
    data: { partnerId, ...result.data },
  });

  revalidatePath(`/partners/${partnerId}`);
  revalidatePath("/statistics/accounts");
  return { success: true };
}

export async function updateLedger(
  ledgerId: string,
  input: { title: string; weeklyInterestRate: number },
): Promise<LedgerFormState> {
  const session = await getSession();
  if (!session) return { error: "ログインが必要です" };

  const ledger = await prisma.ledger.findUnique({
    where: { id: ledgerId },
    include: { partner: true },
  });
  if (!ledger || ledger.partner.ownerId !== session.userId) {
    return { error: "口座が見つかりません" };
  }

  const result = ledgerSchema.safeParse(input);
  if (!result.success) return { error: result.error.issues[0].message };

  await prisma.ledger.update({
    where: { id: ledgerId },
    data: result.data,
  });

  revalidatePath(`/partners/${ledger.partnerId}`);
  revalidatePath("/statistics/accounts");
  return { success: true };
}

export async function deleteLedger(ledgerId: string): Promise<LedgerFormState> {
  const session = await getSession();
  if (!session) return { error: "ログインが必要です" };

  const ledger = await prisma.ledger.findUnique({
    where: { id: ledgerId },
    include: { partner: true, transactions: { select: { id: true }, take: 1 } },
  });
  if (!ledger || ledger.partner.ownerId !== session.userId) {
    return { error: "口座が見つかりません" };
  }
  if (ledger.transactions.length > 0) {
    return { error: "取引が記録されている口座は削除できません" };
  }

  const ledgerCount = await prisma.ledger.count({
    where: { partnerId: ledger.partnerId },
  });
  if (ledgerCount <= 1) {
    return { error: "最後の1つの口座は削除できません" };
  }

  await prisma.ledger.delete({ where: { id: ledgerId } });

  revalidatePath(`/partners/${ledger.partnerId}`);
  revalidatePath("/statistics/accounts");
  return { success: true };
}
