"use server";

import { createId } from "@paralleldrive/cuid2";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { partner as partnerTable } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { findOwnedPartner } from "./_helpers";
import {
  calcLedgerBreakdown,
  calcLedgerRunningBreakdown,
  calcPartnerBreakdown,
} from "@/lib/ledger-balance";
import {
  getNextInterestPreview,
  toInterestSettings,
} from "@/lib/ledger-interest";
import { SHARE_NOTE_MAX_LENGTH } from "@/lib/share-note";
import type {
  ShareNoteState,
  ShareTokenState,
  SharedPartnerData,
} from "./types";

/** 共有リンクの有効期間（日） */
const SHARE_TOKEN_VALID_DAYS = 90;

export async function generatePartnerShareToken(
  partnerId: string,
): Promise<ShareTokenState> {
  const session = await getSession();
  if (!session) return { error: "ログインが必要です" };
  if (!(await findOwnedPartner(partnerId, session.userId))) {
    return { error: "相手が見つかりません" };
  }

  const token = createId();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + SHARE_TOKEN_VALID_DAYS);

  await db
    .update(partnerTable)
    .set({ shareToken: token, shareTokenExpiresAt: expiresAt })
    .where(eq(partnerTable.id, partnerId));

  revalidatePath(`/partners/${partnerId}`);
  return { success: true, token };
}

export async function revokePartnerShareToken(
  partnerId: string,
): Promise<ShareTokenState> {
  const session = await getSession();
  if (!session) return { error: "ログインが必要です" };
  if (!(await findOwnedPartner(partnerId, session.userId))) {
    return { error: "相手が見つかりません" };
  }

  await db
    .update(partnerTable)
    .set({ shareToken: null, shareTokenExpiresAt: null })
    .where(eq(partnerTable.id, partnerId));

  revalidatePath(`/partners/${partnerId}`);
  return { success: true };
}

/**
 * 公開ページ（/share/[token]）に表示するメモを保存する。
 *
 * メモは相手ごとに1つだけ。空文字を渡すとメモなし（null）になる。
 */
export async function updatePartnerShareNote(
  partnerId: string,
  note: string,
): Promise<ShareNoteState> {
  const session = await getSession();
  if (!session) return { error: "ログインが必要です" };
  if (!(await findOwnedPartner(partnerId, session.userId))) {
    return { error: "相手が見つかりません" };
  }

  const trimmed = note.trim();
  if (trimmed.length > SHARE_NOTE_MAX_LENGTH) {
    return { error: `メモは${SHARE_NOTE_MAX_LENGTH}文字以内で入力してください` };
  }

  await db
    .update(partnerTable)
    .set({ shareNote: trimmed.length === 0 ? null : trimmed })
    .where(eq(partnerTable.id, partnerId));

  revalidatePath(`/partners/${partnerId}`);
  return { success: true };
}

/**
 * 公開ページ用のデータ。相手のすべての口座をまとめて返す。
 *
 * 金額はすべて記録者（オーナー）視点のまま返し、符号の反転は表示側で行う。
 */
export async function getPartnerByShareToken(
  token: string,
): Promise<{ data?: SharedPartnerData; error?: string }> {
  const partner = await db.query.partner.findFirst({
    where: eq(partnerTable.shareToken, token),
    columns: { name: true, shareNote: true, shareTokenExpiresAt: true },
    with: {
      owner: { columns: { name: true } },
      ledgers: {
        orderBy: (l, { asc }) => asc(l.createdAt),
        columns: {
          id: true,
          title: true,
          annualInterestRateBp: true,
          interestAccrualWeekday: true,
          interestCompounding: true,
        },
      },
      transactions: {
        where: (t, { eq }) => eq(t.isArchived, false),
        columns: {
          id: true,
          amount: true,
          purpose: true,
          description: true,
          date: true,
          kind: true,
          ledgerId: true,
          createdAt: true,
        },
      },
    },
  });

  if (!partner) return { error: "invalid" };
  if (!partner.shareTokenExpiresAt || partner.shareTokenExpiresAt < new Date()) {
    return { error: "expired" };
  }

  // 未払利息の充当は口座ごとの概念なので、口座単位に分けて残高を積む
  const byLedger = new Map<string, typeof partner.transactions>();
  for (const t of partner.transactions) {
    const key = t.ledgerId ?? "";
    const rows = byLedger.get(key);
    if (rows) rows.push(t);
    else byLedger.set(key, [t]);
  }

  const ledgers = partner.ledgers.map((l) => {
    const settings = toInterestSettings(l);
    const breakdown = calcLedgerBreakdown(byLedger.get(l.id) ?? []);
    return {
      id: l.id,
      title: l.title,
      ...settings,
      balance: breakdown.total,
      breakdown,
      nextInterest: getNextInterestPreview(breakdown, settings),
    };
  });

  const transactions = [...byLedger.values()]
    .flatMap((rows) =>
      calcLedgerRunningBreakdown(rows).map((t) => ({
        id: t.id,
        amount: t.amount,
        purpose: t.purpose,
        description: t.description,
        date: t.date,
        kind: t.kind,
        ledgerId: t.ledgerId,
        createdAt: t.createdAt,
        runningBalance: t.total,
      })),
    )
    .sort(
      (a, b) =>
        b.date.getTime() - a.date.getTime() ||
        b.createdAt.getTime() - a.createdAt.getTime(),
    )
    .map((t) => ({
      id: t.id,
      amount: t.amount,
      purpose: t.purpose,
      description: t.description,
      date: t.date,
      kind: t.kind,
      ledgerId: t.ledgerId,
      runningBalance: t.runningBalance,
    }));

  const breakdown = calcPartnerBreakdown(partner.transactions);

  return {
    data: {
      partnerName: partner.name,
      ownerName: partner.owner.name,
      shareNote: partner.shareNote,
      balance: breakdown.total,
      breakdown,
      ledgers,
      transactions,
    },
  };
}
