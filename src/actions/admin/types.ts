/**
 * 管理画面（/admin）が扱うデータの型。
 *
 * queries.ts / mutations.ts は "use server" なので非同期関数しか export できない。
 * 型と定数はこのファイルに置く。
 */

import type { LedgerBalanceBreakdown } from "@/lib/ledger-balance";
import type { NextInterestPreview } from "@/lib/ledger-interest";

/** 1ページに出す取引の件数 */
export const ADMIN_TRANSACTIONS_PAGE_SIZE = 50;

/**
 * 利子ジョブが「止まっている」とみなす日数。
 * 週1回のジョブなので、8日以上発生していなければ何かがおかしい。
 */
export const INTEREST_STALLED_DAYS = 8;

/** 共有リンクの「まもなく期限切れ」とみなす日数 */
export const SHARE_LINK_EXPIRING_DAYS = 14;

export type AdminOverview = {
  accountCount: number;
  partnerCount: number;
  archivedPartnerCount: number;
  ledgerCount: number;
  interestLedgerCount: number;
  transactionCount: number;
  archivedTransactionCount: number;
  /** 全アカウント合計の残高内訳（元本・未払利息） */
  breakdown: LedgerBalanceBreakdown;
  totalLent: number;
  totalBorrowed: number;
  activeShareLinkCount: number;
  expiringShareLinkCount: number;
  newAccountsLast30Days: number;
  transactionsLast30Days: number;
  /** 直近で利息が発生した日時（ジョブが動いているかの目安） */
  lastInterestAccruedAt: Date | null;
  /** 利子ジョブが止まっていそうな口座の数 */
  stalledInterestLedgerCount: number;
  recentTransactions: AdminTransactionRow[];
  recentAccounts: Array<{
    id: string;
    name: string;
    email: string;
    createdAt: Date;
    partnerCount: number;
  }>;
};

export type AdminAccountRow = {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
  partnerCount: number;
  ledgerCount: number;
  transactionCount: number;
  breakdown: LedgerBalanceBreakdown;
  lastTransactionAt: Date | null;
  shareLinkCount: number;
};

export type AdminAccountDetail = {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
  transactionLabelPreset: string;
  breakdown: LedgerBalanceBreakdown;
  totalLent: number;
  totalBorrowed: number;
  transactionCount: number;
  partners: Array<{
    id: string;
    name: string;
    isArchived: boolean;
    createdAt: Date;
    ledgerCount: number;
    transactionCount: number;
    breakdown: LedgerBalanceBreakdown;
    shareToken: string | null;
    shareTokenExpiresAt: Date | null;
  }>;
  ledgers: AdminLedgerRow[];
  recentTransactions: AdminTransactionRow[];
};

export type AdminLedgerRow = {
  id: string;
  title: string;
  createdAt: Date;
  partnerId: string;
  partnerName: string;
  partnerIsArchived: boolean;
  ownerId: string;
  ownerName: string;
  ownerEmail: string;
  annualInterestRate: number;
  interestAccrualWeekday: number;
  interestCompounding: boolean;
  lastInterestAccruedAt: Date | null;
  transactionCount: number;
  breakdown: LedgerBalanceBreakdown;
  nextInterest: NextInterestPreview;
  /** 利子つきなのに1週間以上利息が発生していない（ジョブが止まっている疑い） */
  isInterestStalled: boolean;
};

export type AdminTransactionRow = {
  id: string;
  amount: number;
  purpose: string | null;
  description: string | null;
  date: Date;
  kind: string;
  isArchived: boolean;
  createdAt: Date;
  ownerId: string;
  ownerName: string;
  partnerId: string;
  partnerName: string;
  ledgerId: string | null;
  ledgerTitle: string | null;
};

export type AdminTransactionFilters = {
  q?: string;
  ownerId?: string;
  kind?: string;
  from?: string;
  to?: string;
  includeArchived?: boolean;
  page?: number;
};

export type AdminTransactionPage = {
  rows: AdminTransactionRow[];
  total: number;
  page: number;
  pageCount: number;
};

export type AdminShareLinkRow = {
  partnerId: string;
  partnerName: string;
  partnerIsArchived: boolean;
  ownerId: string;
  ownerName: string;
  ownerEmail: string;
  token: string;
  expiresAt: Date | null;
  /** 期限切れ */
  isExpired: boolean;
  /** まもなく期限切れ */
  isExpiringSoon: boolean;
  ledgerCount: number;
  balance: number;
};

export type AdminAuditLogRow = {
  id: string;
  actorEmail: string;
  action: string;
  targetType: string | null;
  targetId: string | null;
  summary: string;
  createdAt: Date;
};

export type AdminActionState = {
  success?: boolean;
  error?: string;
  message?: string;
};
