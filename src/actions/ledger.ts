"use server";

import { z } from "zod";
import { createId } from "@paralleldrive/cuid2";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { findOwnedPartner } from "@/actions/partner/_helpers";
import type { LedgerNote } from "@/generated/prisma";
import {
  getNextInterestPreview,
  toInterestSettings,
  DEFAULT_INTEREST_WEEKDAY,
  MAX_ANNUAL_INTEREST_RATE,
  type LedgerInterestSettings,
  type NextInterestPreview,
} from "@/lib/ledger-interest";
import {
  calcLedgerBreakdown,
  calcLedgerRunningBreakdown,
  type LedgerBalanceBreakdown,
} from "@/lib/ledger-balance";
import { isInterestKind } from "@/lib/transaction-kind";

export type LedgerWithBalance = LedgerInterestSettings & {
  id: string;
  title: string;
  /** 合計残高（元本 + 未払利息） */
  balance: number;
  breakdown: LedgerBalanceBreakdown;
  /** 貸した金額の合計（利息は含まない） */
  totalLent: number;
  /** 借りた・返済された金額の合計 */
  totalBorrowed: number;
  /** これまでに発生した利息の合計 */
  totalInterest: number;
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
        select: { amount: true, kind: true, date: true, createdAt: true },
      },
    },
  });

  return ledgers.map((l) => {
    const lent = l.transactions
      .filter((t) => t.amount > 0 && !isInterestKind(t.kind))
      .reduce((sum, t) => sum + t.amount, 0);
    const borrowed = l.transactions
      .filter((t) => t.amount < 0)
      .reduce((sum, t) => sum + t.amount, 0);
    const interest = l.transactions
      .filter((t) => isInterestKind(t.kind))
      .reduce((sum, t) => sum + t.amount, 0);
    const breakdown = calcLedgerBreakdown(l.transactions);

    return {
      id: l.id,
      title: l.title,
      ...toInterestSettings(l),
      balance: breakdown.total,
      breakdown,
      totalLent: lent,
      totalBorrowed: Math.abs(borrowed),
      totalInterest: interest,
      transactionCount: l.transactions.length,
      createdAt: l.createdAt,
    };
  });
}

export type LedgerForHome = LedgerInterestSettings & {
  id: string;
  partnerId: string;
  partnerName: string;
  title: string;
  /** 合計残高（元本 + 未払利息） */
  balance: number;
  breakdown: LedgerBalanceBreakdown;
  lastTransaction: {
    amount: number;
    purpose: string | null;
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
      annualInterestRate: true,
      interestAccrualWeekday: true,
      interestCompounding: true,
      partnerId: true,
      partner: { select: { name: true } },
      transactions: {
        where: { isArchived: false },
        select: { amount: true, purpose: true, date: true, kind: true, createdAt: true },
        orderBy: [{ date: "desc" }, { createdAt: "desc" }],
      },
    },
  });

  return ledgers
    .map((l) => {
      const breakdown = calcLedgerBreakdown(l.transactions);
      return {
        id: l.id,
        partnerId: l.partnerId,
        partnerName: l.partner.name,
        title: l.title,
        ...toInterestSettings(l),
        balance: breakdown.total,
        breakdown,
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

export type LedgerById = LedgerInterestSettings & {
  id: string;
  title: string;
  /** 合計残高（元本 + 未払利息） */
  balance: number;
  breakdown: LedgerBalanceBreakdown;
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
      annualInterestRate: true,
      interestAccrualWeekday: true,
      interestCompounding: true,
      shareToken: true,
      shareTokenExpiresAt: true,
      partnerId: true,
      partner: { select: { name: true, isArchived: true, ownerId: true } },
      transactions: {
        where: { isArchived: false },
        select: { amount: true, kind: true, date: true, createdAt: true },
      },
      notes: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!ledger || ledger.partner.ownerId !== session.userId) return null;

  const settings = toInterestSettings(ledger);
  const breakdown = calcLedgerBreakdown(ledger.transactions);

  return {
    id: ledger.id,
    title: ledger.title,
    ...settings,
    balance: breakdown.total,
    breakdown,
    partnerId: ledger.partnerId,
    partnerName: ledger.partner.name,
    partnerIsArchived: ledger.partner.isArchived,
    shareToken: ledger.shareToken,
    shareTokenExpiresAt: ledger.shareTokenExpiresAt,
    notes: ledger.notes,
    nextInterest: getNextInterestPreview(breakdown, settings),
  };
}

const ledgerSchema = z.object({
  title: z
    .string()
    .min(1, "口座名を入力してください")
    .max(30, "口座名は30文字以内で入力してください"),
  annualInterestRate: z
    .number()
    .min(0, "年利は0%以上で入力してください")
    .max(
      MAX_ANNUAL_INTEREST_RATE,
      `年利は${MAX_ANNUAL_INTEREST_RATE.toLocaleString()}%以下で入力してください`,
    ),
  interestAccrualWeekday: z
    .number()
    .int()
    .min(0, "曜日を選択してください")
    .max(6, "曜日を選択してください")
    .default(DEFAULT_INTEREST_WEEKDAY),
  interestCompounding: z.boolean().default(false),
});

/** 口座の追加時は曜日・単複利を省略できる（既定値が入る） */
export type LedgerInput = z.input<typeof ledgerSchema>;

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

export type SharedLedgerData = LedgerInterestSettings & {
  partnerName: string;
  ledgerTitle: string;
  ownerName: string;
  /** 合計残高（元本 + 未払利息） */
  balance: number;
  breakdown: LedgerBalanceBreakdown;
  nextInterest: NextInterestPreview;
  transactions: Array<{
    id: string;
    amount: number;
    purpose: string | null;
    description: string | null;
    date: Date;
    kind: string;
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
      annualInterestRate: true,
      interestAccrualWeekday: true,
      interestCompounding: true,
      partner: { select: { name: true, owner: { select: { name: true } } } },
      transactions: {
        where: { isArchived: false },
        select: {
          id: true,
          amount: true,
          purpose: true,
          description: true,
          date: true,
          kind: true,
          createdAt: true,
        },
        orderBy: [{ date: "desc" }, { createdAt: "desc" }],
      },
      notes: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!ledger) return { error: "invalid" };
  if (!ledger.shareTokenExpiresAt || ledger.shareTokenExpiresAt < new Date()) {
    return { error: "expired" };
  }

  const settings = toInterestSettings(ledger);
  // 内訳（元本／未払利息）は時系列に取引を適用して求めるので、
  // 共通ロジック（calcLedgerRunningBreakdown）に計算を任せて表示用に新しい順へ戻す。
  const transactionsWithBalance = calcLedgerRunningBreakdown(ledger.transactions)
    .map((t) => ({
      id: t.id,
      amount: t.amount,
      purpose: t.purpose,
      description: t.description,
      date: t.date,
      kind: t.kind,
      runningBalance: t.total,
    }))
    .reverse();
  const breakdown = calcLedgerBreakdown(ledger.transactions);

  return {
    data: {
      partnerName: ledger.partner.name,
      ledgerTitle: ledger.title,
      ownerName: ledger.partner.owner.name,
      ...settings,
      balance: breakdown.total,
      breakdown,
      nextInterest: getNextInterestPreview(breakdown, settings),
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
