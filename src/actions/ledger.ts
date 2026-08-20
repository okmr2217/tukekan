"use server";

import { z } from "zod";
import { createId } from "@paralleldrive/cuid2";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { findOwnedPartner } from "@/actions/partner/_helpers";
import type { LedgerNote } from "@/generated/prisma";
import {
  getEffectiveWeeklyRate,
  getNextInterestPreview,
  type NextInterestPreview,
} from "@/lib/ledger-interest";

export type LedgerWithBalance = {
  id: string;
  title: string;
  weeklyInterestRateUnder5000: number;
  weeklyInterestRateFrom5000: number;
  effectiveWeeklyInterestRate: number;
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
    const balance = lent + borrowed;
    const rateUnder5000 = l.weeklyInterestRateUnder5000
      ? Number(l.weeklyInterestRateUnder5000)
      : 0;
    const rateFrom5000 = l.weeklyInterestRateFrom5000
      ? Number(l.weeklyInterestRateFrom5000)
      : 0;

    return {
      id: l.id,
      title: l.title,
      weeklyInterestRateUnder5000: rateUnder5000,
      weeklyInterestRateFrom5000: rateFrom5000,
      effectiveWeeklyInterestRate: getEffectiveWeeklyRate(
        balance,
        rateUnder5000,
        rateFrom5000,
      ),
      balance,
      totalLent: lent,
      totalBorrowed: Math.abs(borrowed),
      transactionCount: l.transactions.length,
      createdAt: l.createdAt,
    };
  });
}

export type LedgerForHome = {
  id: string;
  partnerId: string;
  partnerName: string;
  title: string;
  effectiveWeeklyInterestRate: number;
  balance: number;
  lastTransaction: {
    amount: number;
    description: string | null;
    date: Date;
  } | null;
};

export async function getLedgersForHome(): Promise<LedgerForHome[]> {
  const session = await getSession();
  if (!session) return [];

  const ledgers = await prisma.ledger.findMany({
    where: { partner: { ownerId: session.userId, isArchived: false } },
    select: {
      id: true,
      title: true,
      weeklyInterestRateUnder5000: true,
      weeklyInterestRateFrom5000: true,
      partnerId: true,
      partner: { select: { name: true } },
      transactions: {
        where: { isArchived: false },
        select: { amount: true, description: true, date: true, createdAt: true },
        orderBy: [{ date: "desc" }, { createdAt: "desc" }],
      },
    },
  });

  return ledgers
    .map((l) => {
      const balance = l.transactions.reduce((sum, t) => sum + t.amount, 0);
      return {
        id: l.id,
        partnerId: l.partnerId,
        partnerName: l.partner.name,
        title: l.title,
        effectiveWeeklyInterestRate: getEffectiveWeeklyRate(
          balance,
          l.weeklyInterestRateUnder5000 ? Number(l.weeklyInterestRateUnder5000) : 0,
          l.weeklyInterestRateFrom5000 ? Number(l.weeklyInterestRateFrom5000) : 0,
        ),
        balance,
        lastTransaction: l.transactions[0] ?? null,
      };
    })
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

export type LedgerById = {
  id: string;
  title: string;
  weeklyInterestRateUnder5000: number;
  weeklyInterestRateFrom5000: number;
  effectiveWeeklyInterestRate: number;
  balance: number;
  partnerId: string;
  partnerName: string;
  partnerIsArchived: boolean;
  shareToken: string | null;
  shareTokenExpiresAt: Date | null;
  notes: LedgerNote[];
  nextInterest: NextInterestPreview;
};

export async function getLedgerById(ledgerId: string): Promise<LedgerById | null> {
  const session = await getSession();
  if (!session) return null;

  const ledger = await prisma.ledger.findUnique({
    where: { id: ledgerId },
    select: {
      id: true,
      title: true,
      weeklyInterestRateUnder5000: true,
      weeklyInterestRateFrom5000: true,
      shareToken: true,
      shareTokenExpiresAt: true,
      partnerId: true,
      partner: { select: { name: true, isArchived: true, ownerId: true } },
      transactions: {
        where: { isArchived: false },
        select: { amount: true },
      },
      notes: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!ledger || ledger.partner.ownerId !== session.userId) return null;

  const balance = ledger.transactions.reduce((sum, t) => sum + t.amount, 0);
  const rateUnder5000 = ledger.weeklyInterestRateUnder5000
    ? Number(ledger.weeklyInterestRateUnder5000)
    : 0;
  const rateFrom5000 = ledger.weeklyInterestRateFrom5000
    ? Number(ledger.weeklyInterestRateFrom5000)
    : 0;

  return {
    id: ledger.id,
    title: ledger.title,
    weeklyInterestRateUnder5000: rateUnder5000,
    weeklyInterestRateFrom5000: rateFrom5000,
    effectiveWeeklyInterestRate: getEffectiveWeeklyRate(balance, rateUnder5000, rateFrom5000),
    balance,
    partnerId: ledger.partnerId,
    partnerName: ledger.partner.name,
    partnerIsArchived: ledger.partner.isArchived,
    shareToken: ledger.shareToken,
    shareTokenExpiresAt: ledger.shareTokenExpiresAt,
    notes: ledger.notes,
    nextInterest: getNextInterestPreview(balance, rateUnder5000, rateFrom5000),
  };
}

const ledgerSchema = z.object({
  title: z
    .string()
    .min(1, "口座名を入力してください")
    .max(30, "口座名は30文字以内で入力してください"),
  weeklyInterestRateUnder5000: z
    .number()
    .min(0, "週利率は0%以上で入力してください")
    .max(100, "週利率は100%以下で入力してください"),
  weeklyInterestRateFrom5000: z
    .number()
    .min(0, "週利率は0%以上で入力してください")
    .max(100, "週利率は100%以下で入力してください"),
});

export type LedgerInput = z.infer<typeof ledgerSchema>;

export type LedgerFormState = { error?: string; success?: boolean };

export async function createLedger(
  partnerId: string,
  input: LedgerInput,
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
  revalidatePath("/");
  revalidatePath("/statistics/accounts");
  return { success: true };
}

export async function updateLedger(
  ledgerId: string,
  input: LedgerInput,
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
  revalidatePath(`/ledgers/${ledgerId}`);
  revalidatePath("/");
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
  revalidatePath("/");
  revalidatePath("/statistics/accounts");
  return { success: true };
}

// --- 共有リンク ---

export type ShareTokenState = {
  error?: string;
  success?: boolean;
  token?: string;
};

export async function generateLedgerShareToken(
  ledgerId: string,
): Promise<ShareTokenState> {
  const session = await getSession();
  if (!session) return { error: "ログインが必要です" };

  const ledger = await prisma.ledger.findUnique({
    where: { id: ledgerId },
    include: { partner: true },
  });
  if (!ledger || ledger.partner.ownerId !== session.userId) {
    return { error: "口座が見つかりません" };
  }

  const token = createId();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 90);

  await prisma.ledger.update({
    where: { id: ledgerId },
    data: { shareToken: token, shareTokenExpiresAt: expiresAt },
  });

  revalidatePath(`/ledgers/${ledgerId}`);
  return { success: true, token };
}

export async function revokeLedgerShareToken(
  ledgerId: string,
): Promise<{ error?: string; success?: boolean }> {
  const session = await getSession();
  if (!session) return { error: "ログインが必要です" };

  const ledger = await prisma.ledger.findUnique({
    where: { id: ledgerId },
    include: { partner: true },
  });
  if (!ledger || ledger.partner.ownerId !== session.userId) {
    return { error: "口座が見つかりません" };
  }

  await prisma.ledger.update({
    where: { id: ledgerId },
    data: { shareToken: null, shareTokenExpiresAt: null },
  });

  revalidatePath(`/ledgers/${ledgerId}`);
  return { success: true };
}

export type SharedLedgerData = {
  partnerName: string;
  ledgerTitle: string;
  ownerName: string;
  balance: number;
  weeklyInterestRateUnder5000: number;
  weeklyInterestRateFrom5000: number;
  effectiveWeeklyInterestRate: number;
  nextInterest: NextInterestPreview;
  transactions: Array<{
    id: string;
    amount: number;
    description: string | null;
    date: Date;
    runningBalance: number;
  }>;
  notes: LedgerNote[];
};

export async function getLedgerByShareToken(
  token: string,
): Promise<{ data?: SharedLedgerData; error?: string }> {
  const ledger = await prisma.ledger.findUnique({
    where: { shareToken: token },
    select: {
      title: true,
      shareTokenExpiresAt: true,
      weeklyInterestRateUnder5000: true,
      weeklyInterestRateFrom5000: true,
      partner: { select: { name: true, owner: { select: { name: true } } } },
      transactions: {
        where: { isArchived: false },
        select: { id: true, amount: true, description: true, date: true },
        orderBy: { date: "desc" },
      },
      notes: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!ledger) return { error: "invalid" };
  if (!ledger.shareTokenExpiresAt || ledger.shareTokenExpiresAt < new Date()) {
    return { error: "expired" };
  }

  const balance = ledger.transactions.reduce((sum, t) => sum + t.amount, 0);
  const rateUnder5000 = ledger.weeklyInterestRateUnder5000
    ? Number(ledger.weeklyInterestRateUnder5000)
    : 0;
  const rateFrom5000 = ledger.weeklyInterestRateFrom5000
    ? Number(ledger.weeklyInterestRateFrom5000)
    : 0;

  let runningBalance = balance;
  const transactionsWithBalance = ledger.transactions.map((t) => {
    const entry = { ...t, runningBalance };
    runningBalance -= t.amount;
    return entry;
  });

  return {
    data: {
      partnerName: ledger.partner.name,
      ledgerTitle: ledger.title,
      ownerName: ledger.partner.owner.name,
      balance,
      weeklyInterestRateUnder5000: rateUnder5000,
      weeklyInterestRateFrom5000: rateFrom5000,
      effectiveWeeklyInterestRate: getEffectiveWeeklyRate(balance, rateUnder5000, rateFrom5000),
      nextInterest: getNextInterestPreview(balance, rateUnder5000, rateFrom5000),
      transactions: transactionsWithBalance,
      notes: ledger.notes,
    },
  };
}

// --- 相手ごとの Ledger↔Partner 対応（取引フォームでのデフォルト口座解決用） ---

export async function getLedgerPartnerMap(): Promise<Record<string, string>> {
  const session = await getSession();
  if (!session) return {};

  const ledgers = await prisma.ledger.findMany({
    where: { partner: { ownerId: session.userId } },
    select: { id: true, partnerId: true },
  });

  return Object.fromEntries(ledgers.map((l) => [l.id, l.partnerId]));
}
