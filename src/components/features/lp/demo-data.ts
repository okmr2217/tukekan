/**
 * LP のモックアップに出すダミーデータ（docs/14-lp-visual-assets.md 2章）。
 *
 * 日付は「何日前」で持ち、表示するリクエストの時刻（now）から組み立てる。
 * 利息だけは「毎週水曜」なので、直近の水曜（JST 0時）からさかのぼって週ごとに置く。
 *
 * 名目・残高・統計の数字は手で書かず、アプリと同じロジック（残高の内訳・
 * 返済の傾向・次回の利子）に通して出す。数字の食い違いを防ぐため。
 */

import type { PartnerWithBalance } from "@/actions/partner";
import type { TransactionWithPartner } from "@/actions/transaction";
import type { BalanceCardLedger } from "@/components/features/partner/balance-card";
import { calcRunningBalance } from "@/lib/calc-running-balance";
import { calcLedgerBreakdown, calcPartnerBreakdown } from "@/lib/ledger-balance";
import {
  formatRate,
  getNextInterestPreview,
  type LedgerInterestSettings,
} from "@/lib/ledger-interest";
import {
  analyzeMovements,
  balanceTimeline,
  monthlyMovements,
  sumMovements,
  summarizeRepayment,
  topPurposes,
} from "@/lib/movement-stats";
import { resolveStatsPeriod } from "@/lib/stats-period";
import type { TransactionKind } from "@/lib/transaction-kind";

const MINUTE_MS = 60 * 1000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;
const JST_OFFSET_MS = 9 * HOUR_MS;

/** オーナー（記録する人）の表示名。仮の名前 */
export const LP_OWNER_NAME = "りく";

export const LP_PARTNER_IDS = {
  kenta: "lp-kenta",
  shota: "lp-shota",
  takumi: "lp-takumi",
  yuki: "lp-yuki",
  misaki: "lp-misaki",
  hanako: "lp-hanako",
} as const;

/** 取引の種。金額の + は「渡した」、− は「受け取った」 */
type Seed = {
  daysAgo: number;
  amount: number;
  purpose: string;
  /** 同じ日のうちで、いまから何分前か（今日の取引だけ使う） */
  minutesAgo?: number;
};

const NO_INTEREST: LedgerInterestSettings = {
  annualInterestRate: 0,
  interestAccrualWeekday: 3,
  interestCompounding: false,
};

/** 翔太さんの利子つき口座。年利13%（週0.25%）なので、元本20,000円で1週間 ¥50 になる */
export const LP_SHOTA_INTEREST: LedgerInterestSettings = {
  annualInterestRate: 13,
  interestAccrualWeekday: 3,
  interestCompounding: false,
};

/** 健太さん：麻雀仲間。少額をよく貸して、だいたい2〜3週間で返してくれる（14章2-2の34件） */
const KENTA: Seed[] = [
  { daysAgo: 430, amount: 2000, purpose: "麻雀" },
  { daysAgo: 425, amount: 4000, purpose: "飲み会" },
  { daysAgo: 418, amount: -6000, purpose: "返済" },
  { daysAgo: 400, amount: 1200, purpose: "ランチ" },
  { daysAgo: 390, amount: 3000, purpose: "麻雀" },
  { daysAgo: 380, amount: -4200, purpose: "返済" },
  { daysAgo: 360, amount: -2000, purpose: "終電のタクシー代" },
  { daysAgo: 355, amount: 2000, purpose: "返済" },
  { daysAgo: 340, amount: 5000, purpose: "麻雀" },
  { daysAgo: 330, amount: 2500, purpose: "麻雀" },
  { daysAgo: 320, amount: -5000, purpose: "返済" },
  { daysAgo: 315, amount: -2500, purpose: "返済" },
  { daysAgo: 280, amount: 3500, purpose: "飲み会" },
  { daysAgo: 270, amount: -3500, purpose: "返済" },
  { daysAgo: 250, amount: 6000, purpose: "ライブのグッズ代" },
  { daysAgo: 240, amount: -3000, purpose: "返済" },
  { daysAgo: 225, amount: -3000, purpose: "返済" },
  { daysAgo: 200, amount: 2000, purpose: "麻雀" },
  { daysAgo: 196, amount: 1000, purpose: "ランチ" },
  { daysAgo: 190, amount: -3000, purpose: "返済" },
  { daysAgo: 170, amount: -1500, purpose: "誕生日ケーキ代" },
  { daysAgo: 160, amount: 1500, purpose: "返済" },
  { daysAgo: 150, amount: 4000, purpose: "麻雀" },
  { daysAgo: 145, amount: 3000, purpose: "飲み会" },
  { daysAgo: 100, amount: -7000, purpose: "返済" },
  { daysAgo: 80, amount: 3000, purpose: "麻雀" },
  { daysAgo: 72, amount: -3000, purpose: "返済" },
  { daysAgo: 60, amount: 1200, purpose: "ランチ" },
  { daysAgo: 55, amount: 2500, purpose: "麻雀" },
  { daysAgo: 48, amount: -3700, purpose: "返済" },
  { daysAgo: 35, amount: 4500, purpose: "飲み会" },
  { daysAgo: 25, amount: -4500, purpose: "返済" },
  { daysAgo: 9, amount: 3500, purpose: "飲み会" },
  { daysAgo: 0, minutesAgo: 2, amount: 3000, purpose: "麻雀" },
];

/** 拓海さん：共有リンクで見せる相手。利子なしなので、公開ページで反転だけが目に入る */
const TAKUMI: Seed[] = [
  { daysAgo: 40, amount: 1000, purpose: "ランチ" },
  { daysAgo: 33, amount: -1000, purpose: "返済" },
  { daysAgo: 3, amount: 3200, purpose: "ライブのチケット代" },
];

const YUKI: Seed[] = [{ daysAgo: 5, amount: -8000, purpose: "旅行の宿代" }];

const MISAKI: Seed[] = [
  { daysAgo: 9, amount: -4500, purpose: "プレゼント代（立て替え）" },
];

const HANAKO: Seed[] = [
  { daysAgo: 30, amount: 1200, purpose: "ランチ代" },
  { daysAgo: 16, amount: -1200, purpose: "返済" },
];

/** 拓海さんの公開ページに出す共有メモ */
export const LP_TAKUMI_SHARE_NOTE = "チケット代、月末までにお願い！";

export type LpTransaction = TransactionWithPartner & {
  /** その取引を反映した直後の、その口座の合計残高（オーナー視点） */
  runningBalance: number;
};

type LedgerDraft = {
  id: string;
  title: string;
  settings: LedgerInterestSettings;
  rows: Array<{ date: Date; amount: number; purpose: string; kind?: TransactionKind }>;
};

type PartnerDraft = { id: string; name: string; ledgers: LedgerDraft[] };

/** 直近の水曜 0時（JST）。今日が水曜なら今日の0時 */
function latestWednesdayJst(now: Date): Date {
  const jst = new Date(now.getTime() + JST_OFFSET_MS);
  const midnight = Date.UTC(jst.getUTCFullYear(), jst.getUTCMonth(), jst.getUTCDate());
  const daysSince = (jst.getUTCDay() - 3 + 7) % 7;
  return new Date(midnight - daysSince * DAY_MS - JST_OFFSET_MS);
}

function fromSeeds(seeds: Seed[], now: Date): LedgerDraft["rows"] {
  return seeds.map((s) => ({
    date: new Date(now.getTime() - s.daysAgo * DAY_MS - (s.minutesAgo ?? 0) * MINUTE_MS),
    amount: s.amount,
    purpose: s.purpose,
  }));
}

function singleLedger(id: string, rows: LedgerDraft["rows"]): LedgerDraft[] {
  return [{ id: `${id}-normal`, title: "通常", settings: NO_INTEREST, rows }];
}

/** 翔太さんの2口座。利子つき口座は「火曜に貸す → 以後毎週水曜に利息 ¥50 が7回」 */
function shotaLedgers(now: Date): LedgerDraft[] {
  const wednesday = latestWednesdayJst(now);
  const loanDate = new Date(wednesday.getTime() - 43 * DAY_MS + 21 * HOUR_MS);
  const interestRows = Array.from({ length: 7 }, (_, i) => ({
    date: new Date(wednesday.getTime() - (6 - i) * 7 * DAY_MS),
    amount: 50,
    purpose: `利子（年利${formatRate(LP_SHOTA_INTEREST.annualInterestRate)}%）`,
    kind: "INTEREST" as const,
  }));

  return [
    {
      id: `${LP_PARTNER_IDS.shota}-normal`,
      title: "通常",
      settings: NO_INTEREST,
      rows: fromSeeds([{ daysAgo: 1, amount: 2000, purpose: "タクシー代" }], now),
    },
    {
      id: `${LP_PARTNER_IDS.shota}-interest`,
      title: "利子つき",
      settings: LP_SHOTA_INTEREST,
      rows: [
        { date: loanDate, amount: 20000, purpose: "バイクの修理代" },
        ...interestRows,
      ],
    },
  ];
}

function partnerDrafts(now: Date): PartnerDraft[] {
  const id = LP_PARTNER_IDS;
  return [
    { id: id.kenta, name: "健太", ledgers: singleLedger(id.kenta, fromSeeds(KENTA, now)) },
    { id: id.shota, name: "翔太", ledgers: shotaLedgers(now) },
    { id: id.takumi, name: "拓海", ledgers: singleLedger(id.takumi, fromSeeds(TAKUMI, now)) },
    { id: id.yuki, name: "ゆうき", ledgers: singleLedger(id.yuki, fromSeeds(YUKI, now)) },
    { id: id.misaki, name: "美咲", ledgers: singleLedger(id.misaki, fromSeeds(MISAKI, now)) },
    { id: id.hanako, name: "花子", ledgers: singleLedger(id.hanako, fromSeeds(HANAKO, now)) },
  ];
}

export type LpPartnerDemo = {
  id: string;
  name: string;
  /** ホームの相手カードに渡す形 */
  summary: PartnerWithBalance;
  /** 残高カード（BalanceCard）に渡す口座 */
  ledgers: BalanceCardLedger[];
  /** この相手の取引（新しい順） */
  transactions: LpTransaction[];
};

export type LpDemo = {
  now: Date;
  /** ホームと同じ並び（直近の取引が新しい順） */
  partners: LpPartnerDemo[];
  /** すべての相手の取引（新しい順） */
  transactions: LpTransaction[];
};

function newestFirst<T extends { date: Date; createdAt: Date }>(rows: T[]): T[] {
  return [...rows].sort(
    (a, b) =>
      b.date.getTime() - a.date.getTime() ||
      b.createdAt.getTime() - a.createdAt.getTime(),
  );
}

export function buildLpDemo(now: Date = new Date()): LpDemo {
  const partners = partnerDrafts(now).map((draft): LpPartnerDemo => {
    const ledgers = draft.ledgers.map((ledger) => {
      const rows: TransactionWithPartner[] = ledger.rows.map((row, i) => ({
        id: `${ledger.id}-${i}`,
        amount: row.amount,
        purpose: row.purpose,
        description: null,
        date: row.date,
        kind: row.kind ?? "NORMAL",
        isArchived: false,
        partnerId: draft.id,
        partnerName: draft.name,
        partnerIsArchived: false,
        ledgerId: ledger.id,
        createdAt: row.date,
        updatedAt: row.date,
      }));
      const breakdown = calcLedgerBreakdown(rows);
      return {
        card: {
          id: ledger.id,
          title: ledger.title,
          annualInterestRate: ledger.settings.annualInterestRate,
          balance: breakdown.total,
          breakdown,
          nextInterest: getNextInterestPreview(breakdown, ledger.settings, now),
        } satisfies BalanceCardLedger,
        transactions: calcRunningBalance(rows),
      };
    });

    const transactions = newestFirst(ledgers.flatMap((l) => l.transactions));
    const breakdown = calcPartnerBreakdown(transactions);
    const last = transactions[0];

    return {
      id: draft.id,
      name: draft.name,
      summary: {
        id: draft.id,
        name: draft.name,
        balance: breakdown.total,
        breakdown,
        isArchived: false,
        transactionCount: transactions.length,
        ledgerCount: ledgers.length,
        lastTransaction: last
          ? { amount: last.amount, purpose: last.purpose, date: last.date }
          : null,
        createdAt: transactions[transactions.length - 1]?.date ?? now,
      },
      ledgers: ledgers.map((l) => l.card),
      transactions,
    };
  });

  partners.sort(
    (a, b) =>
      (b.summary.lastTransaction?.date.getTime() ?? 0) -
      (a.summary.lastTransaction?.date.getTime() ?? 0),
  );

  return {
    now,
    partners,
    transactions: newestFirst(partners.flatMap((p) => p.transactions)),
  };
}

export function lpPartner(demo: LpDemo, id: string): LpPartnerDemo {
  const partner = demo.partners.find((p) => p.id === id);
  if (!partner) throw new Error(`LP のダミーの相手が見つかりません: ${id}`);
  return partner;
}

/**
 * 相手ごとの統計（/partners/[id]/statistics）と同じ集計。
 * getPartnerStatistics() の計算部分を、DB を通さずにダミーの取引で行う。
 */
export function buildLpPartnerStats(partner: LpPartnerDemo, now: Date) {
  const scoped = partner.transactions;
  const userTransactions = scoped.filter((t) => t.kind !== "INTEREST");
  const analysis = analyzeMovements(scoped);
  const { months } = resolveStatsPeriod("12m", null, now);
  const dates = userTransactions.map((t) => t.date.getTime());
  const firstDate = dates.length > 0 ? new Date(Math.min(...dates)) : null;
  const lastDate = dates.length > 0 ? new Date(Math.max(...dates)) : null;

  return {
    breakdown: calcPartnerBreakdown(scoped),
    firstDate,
    daysSinceFirst: firstDate
      ? Math.floor((now.getTime() - firstDate.getTime()) / DAY_MS)
      : null,
    lastDate,
    transactionCount: userTransactions.length,
    flows: sumMovements(analysis.parts),
    theirRepayment: summarizeRepayment(analysis, "credit", undefined, now),
    myRepayment: summarizeRepayment(analysis, "debt", undefined, now),
    timeline: balanceTimeline(scoped, now),
    monthly: monthlyMovements(analysis.parts, months),
    purposes: topPurposes(scoped),
  };
}

export type LpPartnerStats = ReturnType<typeof buildLpPartnerStats>;
