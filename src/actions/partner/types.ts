import type { LedgerNote } from "@/generated/prisma";
import type { LedgerBalanceBreakdown } from "@/lib/ledger-balance";
import type {
  LedgerInterestSettings,
  NextInterestPreview,
} from "@/lib/ledger-interest";

export type Partner = {
  id: string;
  name: string;
};

/** 相手一覧（ホーム）のカード1件ぶん */
export type PartnerWithBalance = {
  id: string;
  name: string;
  /** 全口座を合算した残高（元本 + 未払利息） */
  balance: number;
  /** 全口座を合算した内訳 */
  breakdown: LedgerBalanceBreakdown;
  isArchived: boolean;
  transactionCount: number;
  ledgerCount: number;
  lastTransaction: {
    amount: number;
    purpose: string | null;
    date: Date;
  } | null;
  createdAt: Date;
};

export type PartnerById = {
  id: string;
  name: string;
  isArchived: boolean;
  shareToken: string | null;
  shareTokenExpiresAt: Date | null;
};

/** 公開ページに出す口座1件ぶん */
export type SharedPartnerLedger = LedgerInterestSettings & {
  id: string;
  title: string;
  /** 合計残高（元本 + 未払利息）。記録者（オーナー）視点 */
  balance: number;
  breakdown: LedgerBalanceBreakdown;
  nextInterest: NextInterestPreview;
  notes: LedgerNote[];
};

/** 公開ページ（/share/[token]）に渡すデータ。金額はすべてオーナー視点で、表示時に反転する */
export type SharedPartnerData = {
  partnerName: string;
  ownerName: string;
  /** 全口座を合算した残高 */
  balance: number;
  breakdown: LedgerBalanceBreakdown;
  ledgers: SharedPartnerLedger[];
  transactions: Array<{
    id: string;
    amount: number;
    purpose: string | null;
    description: string | null;
    date: Date;
    kind: string;
    ledgerId: string | null;
    /** その取引を適用した直後の、その口座の合計残高 */
    runningBalance: number;
  }>;
};

export type CreatePartnerState = {
  error?: string;
  success?: boolean;
  partner?: { id: string; name: string };
};

export type UpdatePartnerState = {
  error?: string;
  success?: boolean;
};

export type ShareTokenState = {
  error?: string;
  success?: boolean;
  token?: string;
};
