"use server";

/**
 * 管理画面（/admin）の読み取り。
 *
 * アプリ本体のアクションが「必ず ownerId でスコープする」のに対し、
 * 管理画面は全アカウントを横断して読む。だからこそ、どの関数も
 * 先頭で requireAdmin() を呼んで管理者であることを確かめる。
 */

import type { Prisma } from "@/generated/prisma/client";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";
import {
  calcLedgerBreakdown,
  type LedgerBalanceBreakdown,
} from "@/lib/ledger-balance";
import {
  getNextInterestPreview,
  toInterestSettings,
} from "@/lib/ledger-interest";
import { runInterestJob, type InterestJobResult } from "@/lib/interest-job";
import {
  ADMIN_TRANSACTIONS_PAGE_SIZE,
  INTEREST_STALLED_DAYS,
  SHARE_LINK_EXPIRING_DAYS,
  type AdminAccountDetail,
  type AdminAccountRow,
  type AdminAuditLogRow,
  type AdminLedgerRow,
  type AdminOverview,
  type AdminShareLinkRow,
  type AdminTransactionFilters,
  type AdminTransactionPage,
  type AdminTransactionRow,
} from "./types";

const DAY_MS = 24 * 60 * 60 * 1000;

/** 残高の計算に必要な最小限の取引の形 */
type BalanceRow = {
  amount: number;
  kind: string;
  date: Date;
  createdAt: Date;
  ledgerId: string | null;
  partnerId: string;
};

/**
 * 返済を未払利息に充当するルールは口座ごとの概念なので、口座単位に分けて
 * 内訳を出してから合算する。口座に紐づいていない取引（移行前のデータ）は
 * 相手ごとにまとめる。アカウントをまたいで混ざらないよう、
 * calcPartnerBreakdown ではなくこちらを使う。
 */
function calcBreakdownAcrossLedgers(rows: BalanceRow[]): LedgerBalanceBreakdown {
  const groups = new Map<string, BalanceRow[]>();
  for (const row of rows) {
    const key = row.ledgerId ?? `partner:${row.partnerId}`;
    const group = groups.get(key);
    if (group) group.push(row);
    else groups.set(key, [row]);
  }

  let principal = 0;
  let unpaidInterest = 0;
  for (const group of groups.values()) {
    const breakdown = calcLedgerBreakdown(group);
    principal += breakdown.principal;
    unpaidInterest += breakdown.unpaidInterest;
  }

  return { principal, unpaidInterest, total: principal + unpaidInterest };
}

/** アーカイブされていない取引のうち、残高計算に必要な列だけを読む */
async function loadBalanceRows(
  where: Prisma.TransactionWhereInput = {},
): Promise<Array<BalanceRow & { ownerId: string }>> {
  return prisma.transaction.findMany({
    where: { ...where, isArchived: false },
    select: {
      amount: true,
      kind: true,
      date: true,
      createdAt: true,
      ledgerId: true,
      partnerId: true,
      ownerId: true,
    },
  });
}

function sumLent(rows: Array<{ amount: number }>): number {
  return rows.reduce((sum, r) => (r.amount > 0 ? sum + r.amount : sum), 0);
}

function sumBorrowed(rows: Array<{ amount: number }>): number {
  return rows.reduce((sum, r) => (r.amount < 0 ? sum - r.amount : sum), 0);
}

const TRANSACTION_ROW_SELECT = {
  id: true,
  amount: true,
  purpose: true,
  description: true,
  date: true,
  kind: true,
  isArchived: true,
  createdAt: true,
  ownerId: true,
  partnerId: true,
  ledgerId: true,
  owner: { select: { name: true } },
  partner: { select: { name: true } },
  ledger: { select: { title: true } },
} satisfies Prisma.TransactionSelect;

type TransactionWithRelations = Prisma.TransactionGetPayload<{
  select: typeof TRANSACTION_ROW_SELECT;
}>;

function toTransactionRow(t: TransactionWithRelations): AdminTransactionRow {
  return {
    id: t.id,
    amount: t.amount,
    purpose: t.purpose,
    description: t.description,
    date: t.date,
    kind: t.kind,
    isArchived: t.isArchived,
    createdAt: t.createdAt,
    ownerId: t.ownerId,
    ownerName: t.owner.name,
    partnerId: t.partnerId,
    partnerName: t.partner.name,
    ledgerId: t.ledgerId,
    ledgerTitle: t.ledger?.title ?? null,
  };
}

/**
 * 口座の一覧を残高の内訳つきで組み立てる。
 * 口座ページ・アカウント詳細・ダッシュボードの「止まっている口座」で共用する。
 */
async function buildLedgerRows(
  where: Prisma.LedgerWhereInput = {},
  now: Date = new Date(),
): Promise<AdminLedgerRow[]> {
  const ledgers = await prisma.ledger.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      partner: {
        select: {
          id: true,
          name: true,
          isArchived: true,
          ownerId: true,
          owner: { select: { name: true, email: true } },
        },
      },
      transactions: {
        where: { isArchived: false },
        select: { amount: true, kind: true, date: true, createdAt: true },
      },
    },
  });

  return ledgers.map((ledger) => {
    const settings = toInterestSettings(ledger);
    const breakdown = calcLedgerBreakdown(ledger.transactions);
    const nextInterest = getNextInterestPreview(breakdown, settings, now);

    // 週1回のジョブなので、利子が発生するはずの口座で8日以上動きがなければ異常
    const sinceLastAccrual = ledger.lastInterestAccruedAt
      ? (now.getTime() - ledger.lastInterestAccruedAt.getTime()) / DAY_MS
      : Number.POSITIVE_INFINITY;

    return {
      id: ledger.id,
      title: ledger.title,
      createdAt: ledger.createdAt,
      partnerId: ledger.partner.id,
      partnerName: ledger.partner.name,
      partnerIsArchived: ledger.partner.isArchived,
      ownerId: ledger.partner.ownerId,
      ownerName: ledger.partner.owner.name,
      ownerEmail: ledger.partner.owner.email,
      ...settings,
      lastInterestAccruedAt: ledger.lastInterestAccruedAt,
      transactionCount: ledger.transactions.length,
      breakdown,
      nextInterest,
      isInterestStalled:
        nextInterest.isEligible &&
        !ledger.partner.isArchived &&
        sinceLastAccrual > INTEREST_STALLED_DAYS,
    };
  });
}

/** ダッシュボード用の全体サマリー */
export async function getAdminOverview(): Promise<AdminOverview> {
  await requireAdmin();

  const now = new Date();
  const since30Days = new Date(now.getTime() - 30 * DAY_MS);

  const [
    accountCount,
    partnerCount,
    archivedPartnerCount,
    ledgerCount,
    interestLedgerCount,
    transactionCount,
    archivedTransactionCount,
    activeShareLinkCount,
    expiringShareLinkCount,
    newAccountsLast30Days,
    transactionsLast30Days,
    lastInterest,
    balanceRows,
    recentTransactions,
    recentAccounts,
    ledgerRows,
  ] = await Promise.all([
    prisma.account.count(),
    prisma.partner.count(),
    prisma.partner.count({ where: { isArchived: true } }),
    prisma.ledger.count(),
    prisma.ledger.count({ where: { annualInterestRate: { gt: 0 } } }),
    prisma.transaction.count(),
    prisma.transaction.count({ where: { isArchived: true } }),
    prisma.partner.count({
      where: { shareToken: { not: null }, shareTokenExpiresAt: { gt: now } },
    }),
    prisma.partner.count({
      where: {
        shareToken: { not: null },
        shareTokenExpiresAt: {
          gt: now,
          lte: new Date(now.getTime() + SHARE_LINK_EXPIRING_DAYS * DAY_MS),
        },
      },
    }),
    prisma.account.count({ where: { createdAt: { gte: since30Days } } }),
    prisma.transaction.count({ where: { createdAt: { gte: since30Days } } }),
    prisma.transaction.findFirst({
      where: { kind: "INTEREST" },
      orderBy: { date: "desc" },
      select: { date: true },
    }),
    loadBalanceRows(),
    prisma.transaction.findMany({
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
      take: 8,
      select: TRANSACTION_ROW_SELECT,
    }),
    prisma.account.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        _count: { select: { partners: true } },
      },
    }),
    buildLedgerRows({}, now),
  ]);

  return {
    accountCount,
    partnerCount,
    archivedPartnerCount,
    ledgerCount,
    interestLedgerCount,
    transactionCount,
    archivedTransactionCount,
    breakdown: calcBreakdownAcrossLedgers(balanceRows),
    totalLent: sumLent(balanceRows),
    totalBorrowed: sumBorrowed(balanceRows),
    activeShareLinkCount,
    expiringShareLinkCount,
    newAccountsLast30Days,
    transactionsLast30Days,
    lastInterestAccruedAt: lastInterest?.date ?? null,
    stalledInterestLedgerCount: ledgerRows.filter((l) => l.isInterestStalled)
      .length,
    recentTransactions: recentTransactions.map(toTransactionRow),
    recentAccounts: recentAccounts.map((a) => ({
      id: a.id,
      name: a.name,
      email: a.email,
      createdAt: a.createdAt,
      partnerCount: a._count.partners,
    })),
  };
}

/** アカウント一覧（名前・メールの部分一致で絞り込み） */
export async function getAdminAccounts(q?: string): Promise<AdminAccountRow[]> {
  await requireAdmin();

  const keyword = q?.trim();
  const where: Prisma.AccountWhereInput = keyword
    ? {
        OR: [
          { name: { contains: keyword, mode: "insensitive" } },
          { email: { contains: keyword, mode: "insensitive" } },
        ],
      }
    : {};

  const now = new Date();
  const [accounts, balanceRows] = await Promise.all([
    prisma.account.findMany({
      where,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        _count: { select: { partners: true, transactions: true } },
        partners: {
          select: {
            shareToken: true,
            shareTokenExpiresAt: true,
            _count: { select: { ledgers: true } },
          },
        },
        transactions: {
          orderBy: { date: "desc" },
          take: 1,
          select: { date: true },
        },
      },
    }),
    loadBalanceRows(),
  ]);

  const byOwner = new Map<string, BalanceRow[]>();
  for (const row of balanceRows) {
    const rows = byOwner.get(row.ownerId);
    if (rows) rows.push(row);
    else byOwner.set(row.ownerId, [row]);
  }

  return accounts.map((account) => ({
    id: account.id,
    name: account.name,
    email: account.email,
    createdAt: account.createdAt,
    partnerCount: account._count.partners,
    ledgerCount: account.partners.reduce((sum, p) => sum + p._count.ledgers, 0),
    transactionCount: account._count.transactions,
    breakdown: calcBreakdownAcrossLedgers(byOwner.get(account.id) ?? []),
    lastTransactionAt: account.transactions[0]?.date ?? null,
    shareLinkCount: account.partners.filter(
      (p) =>
        p.shareToken !== null &&
        p.shareTokenExpiresAt !== null &&
        p.shareTokenExpiresAt > now,
    ).length,
  }));
}

/** アカウント1件の詳細（相手・口座・直近の取引） */
export async function getAdminAccountDetail(
  accountId: string,
): Promise<AdminAccountDetail | null> {
  await requireAdmin();

  const now = new Date();
  const account = await prisma.account.findUnique({
    where: { id: accountId },
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
      transactionLabelPreset: true,
      _count: { select: { transactions: true } },
      partners: {
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          name: true,
          isArchived: true,
          createdAt: true,
          shareToken: true,
          shareTokenExpiresAt: true,
          _count: { select: { ledgers: true, transactions: true } },
        },
      },
    },
  });

  if (!account) return null;

  const [balanceRows, ledgers, recentTransactions] = await Promise.all([
    loadBalanceRows({ ownerId: accountId }),
    buildLedgerRows({ partner: { ownerId: accountId } }, now),
    prisma.transaction.findMany({
      where: { ownerId: accountId },
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
      take: 15,
      select: TRANSACTION_ROW_SELECT,
    }),
  ]);

  const byPartner = new Map<string, BalanceRow[]>();
  for (const row of balanceRows) {
    const rows = byPartner.get(row.partnerId);
    if (rows) rows.push(row);
    else byPartner.set(row.partnerId, [row]);
  }

  return {
    id: account.id,
    name: account.name,
    email: account.email,
    createdAt: account.createdAt,
    transactionLabelPreset: account.transactionLabelPreset,
    breakdown: calcBreakdownAcrossLedgers(balanceRows),
    totalLent: sumLent(balanceRows),
    totalBorrowed: sumBorrowed(balanceRows),
    transactionCount: account._count.transactions,
    partners: account.partners.map((p) => ({
      id: p.id,
      name: p.name,
      isArchived: p.isArchived,
      createdAt: p.createdAt,
      ledgerCount: p._count.ledgers,
      transactionCount: p._count.transactions,
      breakdown: calcBreakdownAcrossLedgers(byPartner.get(p.id) ?? []),
      shareToken: p.shareToken,
      shareTokenExpiresAt: p.shareTokenExpiresAt,
    })),
    ledgers,
    recentTransactions: recentTransactions.map(toTransactionRow),
  };
}

/** 口座一覧。利子つきの口座を上に出す */
export async function getAdminLedgers(
  onlyInterest = false,
): Promise<AdminLedgerRow[]> {
  await requireAdmin();

  const rows = await buildLedgerRows(
    onlyInterest ? { annualInterestRate: { gt: 0 } } : {},
  );

  // 止まっている口座 → 利子つき → 残高の大きい順。異常を先に見せる
  return rows.sort((a, b) => {
    if (a.isInterestStalled !== b.isInterestStalled) {
      return a.isInterestStalled ? -1 : 1;
    }
    if (a.annualInterestRate !== b.annualInterestRate) {
      return b.annualInterestRate - a.annualInterestRate;
    }
    return b.breakdown.total - a.breakdown.total;
  });
}

/** 全アカウント横断の取引検索 */
export async function getAdminTransactions(
  filters: AdminTransactionFilters = {},
): Promise<AdminTransactionPage> {
  await requireAdmin();

  const keyword = filters.q?.trim();
  const page = Math.max(1, filters.page ?? 1);

  const dateFilter: Prisma.DateTimeFilter = {};
  if (filters.from) {
    const from = new Date(`${filters.from}T00:00:00+09:00`);
    if (!Number.isNaN(from.getTime())) dateFilter.gte = from;
  }
  if (filters.to) {
    const to = new Date(`${filters.to}T23:59:59+09:00`);
    if (!Number.isNaN(to.getTime())) dateFilter.lte = to;
  }

  const where: Prisma.TransactionWhereInput = {
    ...(filters.includeArchived ? {} : { isArchived: false }),
    ...(filters.ownerId ? { ownerId: filters.ownerId } : {}),
    ...(filters.kind ? { kind: filters.kind } : {}),
    ...(Object.keys(dateFilter).length > 0 ? { date: dateFilter } : {}),
    ...(keyword
      ? {
          OR: [
            { purpose: { contains: keyword, mode: "insensitive" } },
            { description: { contains: keyword, mode: "insensitive" } },
            { partner: { name: { contains: keyword, mode: "insensitive" } } },
          ],
        }
      : {}),
  };

  const [total, rows] = await Promise.all([
    prisma.transaction.count({ where }),
    prisma.transaction.findMany({
      where,
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
      skip: (page - 1) * ADMIN_TRANSACTIONS_PAGE_SIZE,
      take: ADMIN_TRANSACTIONS_PAGE_SIZE,
      select: TRANSACTION_ROW_SELECT,
    }),
  ]);

  return {
    rows: rows.map(toTransactionRow),
    total,
    page,
    pageCount: Math.max(1, Math.ceil(total / ADMIN_TRANSACTIONS_PAGE_SIZE)),
  };
}

/** アカウントの絞り込み用の選択肢 */
export async function getAdminAccountOptions(): Promise<
  Array<{ id: string; name: string; email: string }>
> {
  await requireAdmin();

  return prisma.account.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, email: true },
  });
}

/** 発行済みの共有リンク一覧（期限切れも含む） */
export async function getAdminShareLinks(): Promise<AdminShareLinkRow[]> {
  await requireAdmin();

  const now = new Date();
  const soon = new Date(now.getTime() + SHARE_LINK_EXPIRING_DAYS * DAY_MS);

  const partners = await prisma.partner.findMany({
    where: { shareToken: { not: null } },
    orderBy: { shareTokenExpiresAt: "asc" },
    select: {
      id: true,
      name: true,
      isArchived: true,
      ownerId: true,
      shareToken: true,
      shareTokenExpiresAt: true,
      owner: { select: { name: true, email: true } },
      _count: { select: { ledgers: true } },
      transactions: {
        where: { isArchived: false },
        select: {
          amount: true,
          kind: true,
          date: true,
          createdAt: true,
          ledgerId: true,
          partnerId: true,
        },
      },
    },
  });

  return partners.map((partner) => {
    const expiresAt = partner.shareTokenExpiresAt;
    const isExpired = !expiresAt || expiresAt <= now;

    return {
      partnerId: partner.id,
      partnerName: partner.name,
      partnerIsArchived: partner.isArchived,
      ownerId: partner.ownerId,
      ownerName: partner.owner.name,
      ownerEmail: partner.owner.email,
      token: partner.shareToken ?? "",
      expiresAt,
      isExpired,
      isExpiringSoon: !isExpired && !!expiresAt && expiresAt <= soon,
      ledgerCount: partner._count.ledgers,
      balance: calcBreakdownAcrossLedgers(partner.transactions).total,
    };
  });
}

/**
 * 利子ジョブの状況。
 * 「いま実行したら何が起きるか」は dry-run をそのまま使う（DBは変更しない）。
 */
export async function getInterestJobStatus(): Promise<{
  preview: InterestJobResult;
  ledgers: AdminLedgerRow[];
  lastAccruedAt: Date | null;
  lastRunLog: AdminAuditLogRow | null;
}> {
  await requireAdmin();

  const [preview, ledgers, lastInterest, lastRunLog] = await Promise.all([
    runInterestJob(prisma, { dryRun: true }),
    getAdminLedgers(true),
    prisma.transaction.findFirst({
      where: { kind: "INTEREST" },
      orderBy: { date: "desc" },
      select: { date: true },
    }),
    prisma.adminAuditLog.findFirst({
      where: { action: "RUN_INTEREST_JOB" },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return {
    preview,
    ledgers,
    lastAccruedAt: lastInterest?.date ?? null,
    lastRunLog,
  };
}

/** 監査ログ */
export async function getAdminAuditLogs(limit = 100): Promise<AdminAuditLogRow[]> {
  await requireAdmin();

  return prisma.adminAuditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}
