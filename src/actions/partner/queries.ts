"use server";

import { and, asc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { partner as partnerTable, transaction } from "@/db/schema";
import { getSession } from "@/lib/auth";
import {
  calcPartnerBreakdown,
  EMPTY_BREAKDOWN,
  type LedgerBalanceBreakdown,
} from "@/lib/ledger-balance";
import { findOwnedPartner } from "./_helpers";
import type { Partner, PartnerWithBalance, PartnerById } from "./types";

export async function getPartners(): Promise<Partner[]> {
  const session = await getSession();
  if (!session) return [];

  return db.query.partner.findMany({
    where: and(
      eq(partnerTable.ownerId, session.userId),
      eq(partnerTable.isArchived, false),
    ),
    columns: { id: true, name: true },
    orderBy: asc(partnerTable.name),
  });
}

export async function getPartnerById(
  partnerId: string,
): Promise<PartnerById | null> {
  const session = await getSession();
  if (!session) return null;

  const partner = await db.query.partner.findFirst({
    where: eq(partnerTable.id, partnerId),
    columns: {
      id: true,
      name: true,
      isArchived: true,
      shareToken: true,
      shareTokenExpiresAt: true,
      shareNote: true,
      ownerId: true,
    },
  });

  if (!partner || partner.ownerId !== session.userId) return null;

  return {
    id: partner.id,
    name: partner.name,
    isArchived: partner.isArchived,
    shareToken: partner.shareToken,
    shareTokenExpiresAt: partner.shareTokenExpiresAt,
    shareNote: partner.shareNote,
  };
}

/**
 * 相手ごとの残高（口座をまたいだ合算）。相手一覧（ホーム）で使う。
 *
 * 合計残高は「元本 + 未払利息 = 全取引の金額合計」なので単純な合計でも出せるが、
 * 内訳（未払利息がいくら残っているか）は口座ごとに充当を計算しないと出せないため、
 * `calcPartnerBreakdown` に任せる。
 *
 * 並び順は「最後の取引が新しい順」。取引がない相手は名前順で後ろにまとめる。
 */
export async function getPartnersWithBalance(): Promise<PartnerWithBalance[]> {
  const session = await getSession();
  if (!session) return [];

  const partners = await db.query.partner.findMany({
    where: eq(partnerTable.ownerId, session.userId),
    columns: { id: true, name: true, isArchived: true, createdAt: true },
    with: {
      ledgers: { columns: { id: true } },
      transactions: {
        where: (t, { eq }) => eq(t.isArchived, false),
        columns: {
          amount: true,
          purpose: true,
          date: true,
          kind: true,
          createdAt: true,
          ledgerId: true,
        },
        orderBy: (t, { desc }) => [desc(t.date), desc(t.createdAt)],
      },
    },
    orderBy: asc(partnerTable.name),
  });

  return partners
    .map((p) => {
      const breakdown = calcPartnerBreakdown(p.transactions);
      return {
        id: p.id,
        name: p.name,
        isArchived: p.isArchived,
        createdAt: p.createdAt,
        transactionCount: p.transactions.length,
        ledgerCount: p.ledgers.length,
        balance: breakdown.total,
        breakdown,
        lastTransaction: p.transactions[0] ?? null,
      };
    })
    .sort((a, b) => {
      if (!a.lastTransaction && !b.lastTransaction) {
        return a.name.localeCompare(b.name, "ja");
      }
      if (!a.lastTransaction) return 1;
      if (!b.lastTransaction) return -1;
      return (
        new Date(b.lastTransaction.date).getTime() -
        new Date(a.lastTransaction.date).getTime()
      );
    });
}

/**
 * 相手の合計残高の内訳（口座をまたいだ合算）。
 *
 * 口座に紐づいていない過去の取引も数に入れたいので、口座からではなく
 * 相手の取引そのものから計算する。
 */
export async function getPartnerBalance(
  partnerId: string,
): Promise<LedgerBalanceBreakdown> {
  const session = await getSession();
  if (!session) return EMPTY_BREAKDOWN;
  if (!(await findOwnedPartner(partnerId, session.userId))) {
    return EMPTY_BREAKDOWN;
  }

  const transactions = await db
    .select({
      amount: transaction.amount,
      kind: transaction.kind,
      date: transaction.date,
      createdAt: transaction.createdAt,
      ledgerId: transaction.ledgerId,
    })
    .from(transaction)
    .where(
      and(eq(transaction.partnerId, partnerId), eq(transaction.isArchived, false)),
    );

  return calcPartnerBreakdown(transactions);
}
