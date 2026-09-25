"use server";

import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import {
  calcPartnerBreakdown,
  EMPTY_BREAKDOWN,
  type LedgerBalanceBreakdown,
} from "@/lib/ledger-balance";
import { findOwnedPartner } from "./_helpers";
import type { Partner, PartnerWithBalance, PartnerById } from "./types";

/**
 * 取引フォームの相手ピッカーに出す相手。
 *
 * 並び順は「最後に自分で記録した取引が新しい順」。記録する相手はたいてい
 * 直近にやり取りした相手なので、よく使う相手ほど上に来るようにする。
 * 週次ジョブが自動で作る利息は数えない（利子つきの相手が毎週先頭に来てしまうため）。
 * 取引がない相手は名前順で後ろにまとめる。
 */
export async function getPartners(): Promise<Partner[]> {
  const session = await getSession();
  if (!session) return [];

  const partners = await prisma.partner.findMany({
    where: { ownerId: session.userId, isArchived: false },
    select: {
      id: true,
      name: true,
      transactions: {
        where: { isArchived: false, kind: { not: "INTEREST" } },
        select: { date: true },
        orderBy: [{ date: "desc" }, { createdAt: "desc" }],
        take: 1,
      },
    },
    orderBy: { name: "asc" },
  });

  return partners
    .map((p) => ({
      id: p.id,
      name: p.name,
      lastDate: p.transactions[0]?.date.getTime() ?? null,
    }))
    .sort((a, b) => {
      if (a.lastDate === null && b.lastDate === null) {
        return a.name.localeCompare(b.name, "ja");
      }
      if (a.lastDate === null) return 1;
      if (b.lastDate === null) return -1;
      return b.lastDate - a.lastDate;
    })
    .map(({ id, name }) => ({ id, name }));
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

  const partners = await prisma.partner.findMany({
    where: { ownerId: session.userId },
    select: {
      id: true,
      name: true,
      isArchived: true,
      createdAt: true,
      _count: { select: { ledgers: true } },
      transactions: {
        where: { isArchived: false },
        select: {
          amount: true,
          purpose: true,
          date: true,
          kind: true,
          createdAt: true,
          ledgerId: true,
        },
        orderBy: [{ date: "desc" }, { createdAt: "desc" }],
      },
    },
    orderBy: { name: "asc" },
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
        ledgerCount: p._count.ledgers,
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

  const transactions = await prisma.transaction.findMany({
    where: { partnerId, isArchived: false },
    select: { amount: true, kind: true, date: true, createdAt: true, ledgerId: true },
  });

  return calcPartnerBreakdown(transactions);
}
