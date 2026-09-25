"use server";

/**
 * 管理画面（/admin）の読み取り。
 *
 * アプリ本体のアクションが「必ず ownerId でスコープする」のに対し、
 * 管理画面は全アカウントを横断して読む。だからこそ、どの関数も
 * 先頭で requireAdmin() を呼んで管理者であることを確かめる。
 */

import {
  and,
  asc,
  count,
  desc,
  eq,
  gt,
  gte,
  inArray,
  isNotNull,
  lte,
  max,
  or,
  type SQL,
} from "drizzle-orm";
import { db } from "@/lib/db";
import { contains } from "@/db/sql";
import {
  account,
  adminAuditLog,
  ledger as ledgerTable,
  partner as partnerTable,
  transaction,
} from "@/db/schema";
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
  where?: SQL,
): Promise<Array<BalanceRow & { ownerId: string }>> {
  return db
    .select({
      amount: transaction.amount,
      kind: transaction.kind,
      date: transaction.date,
      createdAt: transaction.createdAt,
      ledgerId: transaction.ledgerId,
      partnerId: transaction.partnerId,
      ownerId: transaction.ownerId,
    })
    .from(transaction)
    .where(and(where, eq(transaction.isArchived, false)));
}

function sumLent(rows: Array<{ amount: number }>): number {
  return rows.reduce((sum, r) => (r.amount > 0 ? sum + r.amount : sum), 0);
}

function sumBorrowed(rows: Array<{ amount: number }>): number {
  return rows.reduce((sum, r) => (r.amount < 0 ? sum - r.amount : sum), 0);
}

/**
 * 取引の一覧（持ち主・相手・口座の名前つき）を新しい順に読む。
 * where では partner の列（相手の名前など）も使える。
 */
async function loadTransactionRows(options: {
  where?: SQL;
  limit: number;
  offset?: number;
}): Promise<AdminTransactionRow[]> {
  return db
    .select({
      id: transaction.id,
      amount: transaction.amount,
      purpose: transaction.purpose,
      description: transaction.description,
      date: transaction.date,
      kind: transaction.kind,
      isArchived: transaction.isArchived,
      createdAt: transaction.createdAt,
      ownerId: transaction.ownerId,
      ownerName: account.name,
      partnerId: transaction.partnerId,
      partnerName: partnerTable.name,
      ledgerId: transaction.ledgerId,
      ledgerTitle: ledgerTable.title,
    })
    .from(transaction)
    .innerJoin(account, eq(transaction.ownerId, account.id))
    .innerJoin(partnerTable, eq(transaction.partnerId, partnerTable.id))
    .leftJoin(ledgerTable, eq(transaction.ledgerId, ledgerTable.id))
    .where(options.where)
    .orderBy(desc(transaction.date), desc(transaction.createdAt))
    .limit(options.limit)
    .offset(options.offset ?? 0);
}

/** キーごとの件数を Map にする（groupBy の結果を引きやすくする） */
function toCountMap<K>(rows: Array<{ key: K; count: number }>): Map<K, number> {
  return new Map(rows.map((r) => [r.key, r.count]));
}

/**
 * 口座の一覧を残高の内訳つきで組み立てる。
 * 口座ページ・アカウント詳細・ダッシュボードの「止まっている口座」で共用する。
 */
async function buildLedgerRows(
  where?: SQL,
  now: Date = new Date(),
): Promise<AdminLedgerRow[]> {
  const ledgers = await db.query.ledger.findMany({
    where,
    orderBy: desc(ledgerTable.createdAt),
    with: {
      partner: {
        columns: { id: true, name: true, isArchived: true, ownerId: true },
        with: { owner: { columns: { name: true, email: true } } },
      },
      transactions: {
        where: (t, { eq }) => eq(t.isArchived, false),
        columns: { amount: true, kind: true, date: true, createdAt: true },
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

/** 直近で発生した利息の取引（ジョブが動いているかの目安） */
async function findLastInterest() {
  return db.query.transaction.findFirst({
    where: eq(transaction.kind, "INTEREST"),
    orderBy: desc(transaction.date),
    columns: { date: true },
  });
}

/** 指定した操作の最新の監査ログ */
async function findLastAuditLog(action: string) {
  return db.query.adminAuditLog.findFirst({
    where: eq(adminAuditLog.action, action),
    orderBy: desc(adminAuditLog.createdAt),
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
    db.$count(account),
    db.$count(partnerTable),
    db.$count(partnerTable, eq(partnerTable.isArchived, true)),
    db.$count(ledgerTable),
    db.$count(ledgerTable, gt(ledgerTable.annualInterestRateBp, 0)),
    db.$count(transaction),
    db.$count(transaction, eq(transaction.isArchived, true)),
    db.$count(
      partnerTable,
      and(
        isNotNull(partnerTable.shareToken),
        gt(partnerTable.shareTokenExpiresAt, now),
      ),
    ),
    db.$count(
      partnerTable,
      and(
        isNotNull(partnerTable.shareToken),
        gt(partnerTable.shareTokenExpiresAt, now),
        lte(
          partnerTable.shareTokenExpiresAt,
          new Date(now.getTime() + SHARE_LINK_EXPIRING_DAYS * DAY_MS),
        ),
      ),
    ),
    db.$count(account, gte(account.createdAt, since30Days)),
    db.$count(transaction, gte(transaction.createdAt, since30Days)),
    findLastInterest(),
    loadBalanceRows(),
    loadTransactionRows({ limit: 8 }),
    db.query.account.findMany({
      orderBy: desc(account.createdAt),
      limit: 5,
      columns: { id: true, name: true, email: true, createdAt: true },
      with: { partners: { columns: { id: true } } },
    }),
    buildLedgerRows(undefined, now),
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
    recentTransactions,
    recentAccounts: recentAccounts.map((a) => ({
      id: a.id,
      name: a.name,
      email: a.email,
      createdAt: a.createdAt,
      partnerCount: a.partners.length,
    })),
  };
}

/** アカウント一覧（名前・メールの部分一致で絞り込み） */
export async function getAdminAccounts(q?: string): Promise<AdminAccountRow[]> {
  await requireAdmin();

  const keyword = q?.trim();
  const where = keyword
    ? or(contains(account.name, keyword), contains(account.email, keyword))
    : undefined;

  const now = new Date();
  const [accounts, transactionStats, balanceRows] = await Promise.all([
    db.query.account.findMany({
      where,
      orderBy: desc(account.createdAt),
      columns: { id: true, name: true, email: true, createdAt: true },
      with: {
        partners: {
          columns: { shareToken: true, shareTokenExpiresAt: true },
          with: { ledgers: { columns: { id: true } } },
        },
      },
    }),
    // 取引の件数（アーカイブ済みも含む）と最後の取引日をアカウントごとに
    db
      .select({
        ownerId: transaction.ownerId,
        count: count(),
        lastDate: max(transaction.date),
      })
      .from(transaction)
      .groupBy(transaction.ownerId),
    loadBalanceRows(),
  ]);

  const statsByOwner = new Map(transactionStats.map((t) => [t.ownerId, t]));

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
    partnerCount: account.partners.length,
    ledgerCount: account.partners.reduce((sum, p) => sum + p.ledgers.length, 0),
    transactionCount: statsByOwner.get(account.id)?.count ?? 0,
    breakdown: calcBreakdownAcrossLedgers(byOwner.get(account.id) ?? []),
    lastTransactionAt: statsByOwner.get(account.id)?.lastDate ?? null,
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
  const found = await db.query.account.findFirst({
    where: eq(account.id, accountId),
    columns: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
      transactionLabelPreset: true,
    },
    with: {
      partners: {
        orderBy: (p, { asc }) => asc(p.createdAt),
        columns: {
          id: true,
          name: true,
          isArchived: true,
          createdAt: true,
          shareToken: true,
          shareTokenExpiresAt: true,
        },
        with: { ledgers: { columns: { id: true } } },
      },
    },
  });

  if (!found) return null;

  const [balanceRows, ledgers, recentTransactions, transactionCounts] =
    await Promise.all([
      loadBalanceRows(eq(transaction.ownerId, accountId)),
      buildLedgerRows(
        inArray(
          ledgerTable.partnerId,
          db
            .select({ id: partnerTable.id })
            .from(partnerTable)
            .where(eq(partnerTable.ownerId, accountId)),
        ),
        now,
      ),
      loadTransactionRows({
        where: eq(transaction.ownerId, accountId),
        limit: 15,
      }),
      // 相手ごとの取引の件数（アーカイブ済みも含む）
      db
        .select({ key: transaction.partnerId, count: count() })
        .from(transaction)
        .where(eq(transaction.ownerId, accountId))
        .groupBy(transaction.partnerId),
    ]);

  const countByPartner = toCountMap(transactionCounts);

  const byPartner = new Map<string, BalanceRow[]>();
  for (const row of balanceRows) {
    const rows = byPartner.get(row.partnerId);
    if (rows) rows.push(row);
    else byPartner.set(row.partnerId, [row]);
  }

  return {
    id: found.id,
    name: found.name,
    email: found.email,
    createdAt: found.createdAt,
    transactionLabelPreset: found.transactionLabelPreset,
    breakdown: calcBreakdownAcrossLedgers(balanceRows),
    totalLent: sumLent(balanceRows),
    totalBorrowed: sumBorrowed(balanceRows),
    transactionCount: [...countByPartner.values()].reduce((a, b) => a + b, 0),
    partners: found.partners.map((p) => ({
      id: p.id,
      name: p.name,
      isArchived: p.isArchived,
      createdAt: p.createdAt,
      ledgerCount: p.ledgers.length,
      transactionCount: countByPartner.get(p.id) ?? 0,
      breakdown: calcBreakdownAcrossLedgers(byPartner.get(p.id) ?? []),
      shareToken: p.shareToken,
      shareTokenExpiresAt: p.shareTokenExpiresAt,
    })),
    ledgers,
    recentTransactions,
  };
}

/** 口座一覧。利子つきの口座を上に出す */
export async function getAdminLedgers(
  onlyInterest = false,
): Promise<AdminLedgerRow[]> {
  await requireAdmin();

  const rows = await buildLedgerRows(
    onlyInterest ? gt(ledgerTable.annualInterestRateBp, 0) : undefined,
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

  const from = filters.from
    ? new Date(`${filters.from}T00:00:00+09:00`)
    : null;
  const to = filters.to ? new Date(`${filters.to}T23:59:59+09:00`) : null;

  // 相手の名前でも探すので、partner を join した上で使う条件
  const where = and(
    filters.includeArchived ? undefined : eq(transaction.isArchived, false),
    filters.ownerId ? eq(transaction.ownerId, filters.ownerId) : undefined,
    filters.kind ? eq(transaction.kind, filters.kind) : undefined,
    from && !Number.isNaN(from.getTime())
      ? gte(transaction.date, from)
      : undefined,
    to && !Number.isNaN(to.getTime()) ? lte(transaction.date, to) : undefined,
    keyword
      ? or(
          contains(transaction.purpose, keyword),
          contains(transaction.description, keyword),
          contains(partnerTable.name, keyword),
        )
      : undefined,
  );

  const [[{ total }], rows] = await Promise.all([
    db
      .select({ total: count() })
      .from(transaction)
      .innerJoin(partnerTable, eq(transaction.partnerId, partnerTable.id))
      .where(where),
    loadTransactionRows({
      where,
      limit: ADMIN_TRANSACTIONS_PAGE_SIZE,
      offset: (page - 1) * ADMIN_TRANSACTIONS_PAGE_SIZE,
    }),
  ]);

  return {
    rows,
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

  return db.query.account.findMany({
    orderBy: asc(account.name),
    columns: { id: true, name: true, email: true },
  });
}

/** 発行済みの共有リンク一覧（期限切れも含む） */
export async function getAdminShareLinks(): Promise<AdminShareLinkRow[]> {
  await requireAdmin();

  const now = new Date();
  const soon = new Date(now.getTime() + SHARE_LINK_EXPIRING_DAYS * DAY_MS);

  const partners = await db.query.partner.findMany({
    where: isNotNull(partnerTable.shareToken),
    orderBy: asc(partnerTable.shareTokenExpiresAt),
    columns: {
      id: true,
      name: true,
      isArchived: true,
      ownerId: true,
      shareToken: true,
      shareTokenExpiresAt: true,
    },
    with: {
      owner: { columns: { name: true, email: true } },
      ledgers: { columns: { id: true } },
      transactions: {
        where: (t, { eq }) => eq(t.isArchived, false),
        columns: {
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
      ledgerCount: partner.ledgers.length,
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
  lastScheduledRunLog: AdminAuditLogRow | null;
}> {
  await requireAdmin();

  const [preview, ledgers, lastInterest, lastRunLog, lastScheduledRunLog] =
    await Promise.all([
      runInterestJob(db, { dryRun: true }),
      getAdminLedgers(true),
      findLastInterest(),
      findLastAuditLog("RUN_INTEREST_JOB"),
      findLastAuditLog("SCHEDULED_INTEREST_JOB"),
    ]);

  return {
    preview,
    ledgers,
    lastAccruedAt: lastInterest?.date ?? null,
    lastRunLog: lastRunLog ?? null,
    lastScheduledRunLog: lastScheduledRunLog ?? null,
  };
}

/** 監査ログ */
export async function getAdminAuditLogs(limit = 100): Promise<AdminAuditLogRow[]> {
  await requireAdmin();

  return db.query.adminAuditLog.findMany({
    orderBy: desc(adminAuditLog.createdAt),
    limit,
  });
}
