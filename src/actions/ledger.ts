"use server";

import { z } from "zod";
import { asc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { ledger as ledgerTable } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { findOwnedPartner } from "@/actions/partner/_helpers";
import {
  getNextInterestPreview,
  toAnnualInterestRateBp,
  toInterestSettings,
  DEFAULT_INTEREST_WEEKDAY,
  MAX_ANNUAL_INTEREST_RATE,
  type LedgerInterestSettings,
  type NextInterestPreview,
} from "@/lib/ledger-interest";
import {
  calcLedgerBreakdown,
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
  nextInterest: NextInterestPreview;
  createdAt: Date;
};

/** 相手ページに出す口座の一覧（残高・内訳・次回の利子つき） */
export async function getLedgersByPartner(
  partnerId: string,
): Promise<LedgerWithBalance[]> {
  const session = await getSession();
  if (!session) return [];
  if (!(await findOwnedPartner(partnerId, session.userId))) return [];

  const ledgers = await db.query.ledger.findMany({
    where: eq(ledgerTable.partnerId, partnerId),
    orderBy: asc(ledgerTable.createdAt),
    with: {
      transactions: {
        where: (t, { eq }) => eq(t.isArchived, false),
        columns: { amount: true, kind: true, date: true, createdAt: true },
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
    const settings = toInterestSettings(l);
    const breakdown = calcLedgerBreakdown(l.transactions);

    return {
      id: l.id,
      title: l.title,
      ...settings,
      balance: breakdown.total,
      breakdown,
      totalLent: lent,
      totalBorrowed: Math.abs(borrowed),
      totalInterest: interest,
      transactionCount: l.transactions.length,
      nextInterest: getNextInterestPreview(breakdown, settings),
      createdAt: l.createdAt,
    };
  });
}

export type LedgerOption = {
  id: string;
  title: string;
  annualInterestRate: number;
};

/** 取引フォームの口座ピッカー用。残高を持たない軽い一覧 */
export async function getLedgerOptions(
  partnerId: string,
): Promise<LedgerOption[]> {
  const session = await getSession();
  if (!session) return [];
  if (!(await findOwnedPartner(partnerId, session.userId))) return [];

  const ledgers = await db.query.ledger.findMany({
    where: eq(ledgerTable.partnerId, partnerId),
    orderBy: asc(ledgerTable.createdAt),
    columns: { id: true, title: true, annualInterestRateBp: true },
  });

  return ledgers.map((l) => ({
    id: l.id,
    title: l.title,
    annualInterestRate: toInterestSettings(l).annualInterestRate,
  }));
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
  nextInterest: NextInterestPreview;
};

export async function getLedgerById(ledgerId: string): Promise<LedgerById | null> {
  const session = await getSession();
  if (!session) return null;

  const ledger = await db.query.ledger.findFirst({
    where: eq(ledgerTable.id, ledgerId),
    columns: {
      id: true,
      title: true,
      annualInterestRateBp: true,
      interestAccrualWeekday: true,
      interestCompounding: true,
      partnerId: true,
    },
    with: {
      partner: { columns: { name: true, isArchived: true, ownerId: true } },
      transactions: {
        where: (t, { eq }) => eq(t.isArchived, false),
        columns: { amount: true, kind: true, date: true, createdAt: true },
      },
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

/** 入力（年利は %）を DB の列（年利はベーシスポイント）に直す */
function toLedgerValues({
  annualInterestRate,
  ...rest
}: z.output<typeof ledgerSchema>) {
  return { ...rest, annualInterestRateBp: toAnnualInterestRateBp(annualInterestRate) };
}

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

  await db.insert(ledgerTable).values({ partnerId, ...toLedgerValues(result.data) });

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

  const ledger = await db.query.ledger.findFirst({
    where: eq(ledgerTable.id, ledgerId),
    with: { partner: { columns: { ownerId: true } } },
  });
  if (!ledger || ledger.partner.ownerId !== session.userId) {
    return { error: "口座が見つかりません" };
  }

  const result = ledgerSchema.safeParse(input);
  if (!result.success) return { error: result.error.issues[0].message };

  await db
    .update(ledgerTable)
    .set(toLedgerValues(result.data))
    .where(eq(ledgerTable.id, ledgerId));

  revalidatePath(`/partners/${ledger.partnerId}`);
  revalidatePath(`/ledgers/${ledgerId}/settings`);
  revalidatePath("/");
  revalidatePath("/statistics/accounts");
  return { success: true };
}

export async function deleteLedger(ledgerId: string): Promise<LedgerFormState> {
  const session = await getSession();
  if (!session) return { error: "ログインが必要です" };

  const ledger = await db.query.ledger.findFirst({
    where: eq(ledgerTable.id, ledgerId),
    with: {
      partner: { columns: { ownerId: true } },
      transactions: { columns: { id: true }, limit: 1 },
    },
  });
  if (!ledger || ledger.partner.ownerId !== session.userId) {
    return { error: "口座が見つかりません" };
  }
  if (ledger.transactions.length > 0) {
    return { error: "取引が記録されている口座は削除できません" };
  }

  const ledgerCount = await db.$count(
    ledgerTable,
    eq(ledgerTable.partnerId, ledger.partnerId),
  );
  if (ledgerCount <= 1) {
    return { error: "最後の1つの口座は削除できません" };
  }

  await db.delete(ledgerTable).where(eq(ledgerTable.id, ledgerId));

  revalidatePath(`/partners/${ledger.partnerId}`);
  revalidatePath("/");
  revalidatePath("/statistics/accounts");
  return { success: true };
}
