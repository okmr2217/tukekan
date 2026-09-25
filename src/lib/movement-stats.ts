/**
 * 統計の集計。取引を名目（貸した／返済された／借りた／返済した／利息）に分け、
 * 返済の傾向（どれくらいで返ってくるか・返しているか）を出す。
 *
 * ■ 名目への分解
 * 取引カードと同じく「その取引を反映する前の残高」で名目を決める。ただし集計では
 * 金額が合っていないと困るので、残高が0をまたぐ取引は分割する。
 *   例: 残高 +3,000 に -5,000 → 返済された 3,000 ＋ 借りた 2,000
 * こうすると口座ごとに次が必ず成り立つ。
 *   貸した ＋ 貸しに付いた利息 − 返済された ＝ 今の貸し（残高がプラスの分）
 *   借りた ＋ 借りに付いた利息 − 返済した   ＝ 今の借り（残高がマイナスの分）
 *
 * ■ 返済の傾向
 * 貸し（借り）は古いものから順に返済で埋まっていくとみなし（先入れ先出し）、
 * 埋まるまでの日数を金額で重み付けして平均する。
 *
 * 直前の残高も返済の充当も口座ごとの概念なので、どちらも口座単位で計算してから合算する。
 * 口座に紐づいていない過去の取引は、相手ごとに1つの口座として扱う。
 */

import { isInterestKind } from "@/lib/transaction-kind";
import {
  formatMonthLabel,
  formatMonthShort,
  jstMonthEnd,
  jstMonthKey,
} from "@/lib/stats-period";

const DAY_MS = 24 * 60 * 60 * 1000;

/** 「1ヶ月以内に返った」とみなす日数 */
export const PROMPT_REPAYMENT_DAYS = 30;

export type StatsTransaction = {
  amount: number;
  kind?: string | null;
  date: Date;
  createdAt?: Date;
  partnerId: string;
  ledgerId: string | null;
};

export type MovementKey =
  | "lend" // 貸した
  | "repayReceived" // 返済された
  | "borrow" // 借りた
  | "repayMade" // 返済した
  | "interestCredit" // 貸しに付いた利息
  | "interestDebt"; // 借りに付いた利息

/** 名目ごとの金額（すべて0以上） */
export type MovementTotals = Record<MovementKey, number>;

export const EMPTY_MOVEMENTS: MovementTotals = {
  lend: 0,
  repayReceived: 0,
  borrow: 0,
  repayMade: 0,
  interestCredit: 0,
  interestDebt: 0,
};

export const MOVEMENT_LABELS: Record<MovementKey, string> = {
  lend: "貸した",
  repayReceived: "返済された",
  borrow: "借りた",
  repayMade: "返済した",
  interestCredit: "利息（貸し）",
  interestDebt: "利息（借り）",
};

/** 取引を名目に分けたひとかけら */
export type MovementPart = {
  movement: MovementKey;
  amount: number;
  date: Date;
  partnerId: string;
};

/**
 * 貸し借りのどちら側か。
 *   credit : 自分の貸し（相手が返す）
 *   debt   : 自分の借り（自分が返す）
 */
export type RepaymentSide = "credit" | "debt";

/** 返済で埋まった貸し（借り）のひとかけら */
export type RepaidPortion = {
  side: RepaymentSide;
  partnerId: string;
  amount: number;
  /** 貸して（借りて）から返済で埋まるまでの日数 */
  days: number;
};

/** まだ返済で埋まっていない貸し（借り） */
export type OutstandingPortion = {
  side: RepaymentSide;
  partnerId: string;
  amount: number;
  since: Date;
};

export type MovementAnalysis = {
  parts: MovementPart[];
  repaid: RepaidPortion[];
  outstanding: OutstandingPortion[];
  /** 口座の残高が0に戻った（精算した）できごと */
  settlements: Array<{ partnerId: string; date: Date }>;
};

/** date 昇順（同値なら createdAt 昇順）に並べ替える */
export function sortChronologically<T extends { date: Date; createdAt?: Date }>(
  rows: T[],
): T[] {
  return [...rows].sort((a, b) => {
    const diff = a.date.getTime() - b.date.getTime();
    if (diff !== 0) return diff;
    return (a.createdAt?.getTime() ?? 0) - (b.createdAt?.getTime() ?? 0);
  });
}

function daysBetween(from: Date, to: Date): number {
  return Math.max(0, Math.floor((to.getTime() - from.getTime()) / DAY_MS));
}

function groupByLedger(
  transactions: StatsTransaction[],
): StatsTransaction[][] {
  const groups = new Map<string, StatsTransaction[]>();
  for (const t of transactions) {
    const key = t.ledgerId ?? `partner:${t.partnerId}`;
    const rows = groups.get(key);
    if (rows) rows.push(t);
    else groups.set(key, [t]);
  }
  return [...groups.values()];
}

type Lot = { amount: number; date: Date };

export function analyzeMovements(
  transactions: StatsTransaction[],
): MovementAnalysis {
  const analysis: MovementAnalysis = {
    parts: [],
    repaid: [],
    outstanding: [],
    settlements: [],
  };

  for (const group of groupByLedger(transactions)) {
    let balance = 0;
    const lots: Record<RepaymentSide, Lot[]> = { credit: [], debt: [] };

    for (const t of sortChronologically(group)) {
      if (t.amount === 0) continue;
      const { partnerId, date } = t;
      const abs = Math.abs(t.amount);
      const isPlus = t.amount > 0;

      // プラスの取引は借りを減らしてから貸しを増やす。マイナスはその逆
      const reducing: RepaymentSide = isPlus ? "debt" : "credit";
      const growing: RepaymentSide = isPlus ? "credit" : "debt";
      const reducible = isPlus ? Math.max(-balance, 0) : Math.max(balance, 0);
      const reduced = Math.min(abs, reducible);
      const grown = abs - reduced;

      const addPart = (movement: MovementKey, amount: number) => {
        if (amount > 0) analysis.parts.push({ movement, amount, date, partnerId });
      };

      const interest = isInterestKind(t.kind);
      if (interest) {
        addPart(isPlus ? "interestCredit" : "interestDebt", abs);
      } else {
        addPart(isPlus ? "repayMade" : "repayReceived", reduced);
        addPart(isPlus ? "lend" : "borrow", grown);
      }

      // 古い貸し（借り）から順に埋める
      let rest = reduced;
      const queue = lots[reducing];
      while (rest > 0 && queue.length > 0) {
        const lot = queue[0];
        const applied = Math.min(rest, lot.amount);
        if (!interest) {
          analysis.repaid.push({
            side: reducing,
            partnerId,
            amount: applied,
            days: daysBetween(lot.date, date),
          });
        }
        lot.amount -= applied;
        rest -= applied;
        if (lot.amount === 0) queue.shift();
      }
      if (grown > 0) lots[growing].push({ amount: grown, date });

      const before = balance;
      balance += t.amount;
      if (balance === 0 && before !== 0) {
        analysis.settlements.push({ partnerId, date });
      }
    }

    const partnerId = group[0].partnerId;
    for (const side of ["credit", "debt"] as const) {
      for (const lot of lots[side]) {
        analysis.outstanding.push({
          side,
          partnerId,
          amount: lot.amount,
          since: lot.date,
        });
      }
    }
  }

  return analysis;
}

/** 名目ごとの合計。from を渡すとその日時以降だけを数える */
export function sumMovements(
  parts: MovementPart[],
  from: Date | null = null,
): MovementTotals {
  const totals = { ...EMPTY_MOVEMENTS };
  for (const p of parts) {
    if (from && p.date < from) continue;
    totals[p.movement] += p.amount;
  }
  return totals;
}

export type MonthlyMovement = MovementTotals & {
  month: string;
  label: string;
  shortLabel: string;
};

/** 月（JST）ごとの名目の合計。months にない月の取引は捨てる */
export function monthlyMovements(
  parts: MovementPart[],
  months: string[],
): MonthlyMovement[] {
  const rows = new Map<string, MonthlyMovement>(
    months.map((month) => [
      month,
      {
        month,
        label: formatMonthLabel(month),
        shortLabel: formatMonthShort(month),
        ...EMPTY_MOVEMENTS,
      },
    ]),
  );
  for (const p of parts) {
    const row = rows.get(jstMonthKey(p.date));
    if (row) row[p.movement] += p.amount;
  }
  return months.map((m) => rows.get(m)!);
}

export type MonthEndPosition = {
  month: string;
  label: string;
  shortLabel: string;
  /** 月末時点で貸している相手への残高の合計 */
  lending: number;
  /** 月末時点で借りている相手への残高の合計（正の数） */
  borrowing: number;
};

/**
 * 月末時点の「貸している／借りている」の合計。
 * ホームの合計と同じく、相手ごとに全口座の残高を合算してから向きを決める。
 */
export function monthEndPositions(
  transactions: StatsTransaction[],
  months: string[],
): MonthEndPosition[] {
  const sorted = sortChronologically(transactions);
  const balances = new Map<string, number>();
  let i = 0;

  return months.map((month) => {
    const end = jstMonthEnd(month);
    for (; i < sorted.length && sorted[i].date < end; i++) {
      const t = sorted[i];
      balances.set(t.partnerId, (balances.get(t.partnerId) ?? 0) + t.amount);
    }
    let lending = 0;
    let borrowing = 0;
    for (const balance of balances.values()) {
      if (balance > 0) lending += balance;
      else borrowing -= balance;
    }
    return {
      month,
      label: formatMonthLabel(month),
      shortLabel: formatMonthShort(month),
      lending,
      borrowing,
    };
  });
}

export type BalancePoint = {
  /** UNIX ミリ秒 */
  time: number;
  balance: number;
};

/**
 * 残高の推移（取引ごと）。渡した取引をすべて合算した残高を出す。
 * 最初の取引の直前（0円）と、今の時点の点を両端に足す。
 */
export function balanceTimeline(
  transactions: StatsTransaction[],
  now: Date = new Date(),
): BalancePoint[] {
  const sorted = sortChronologically(transactions);
  if (sorted.length === 0) return [];

  const points: BalancePoint[] = [
    { time: sorted[0].date.getTime(), balance: 0 },
  ];
  let balance = 0;
  for (const t of sorted) {
    balance += t.amount;
    const time = t.date.getTime();
    const last = points[points.length - 1];
    // 同じ日時の取引は1点にまとめる
    if (last.time === time) last.balance = balance;
    else points.push({ time, balance });
  }
  points.push({ time: Math.max(now.getTime(), points[points.length - 1].time), balance });
  return points;
}

export type RepaymentSummary = {
  /** 返済で埋まった金額 */
  repaidAmount: number;
  /** 返済で埋まるまでの平均日数（金額で重み付け）。まだ返済がなければ null */
  averageDays: number | null;
  /**
   * 1ヶ月以内に返済で埋まった割合（0〜1）。
   * まだ1ヶ月たっていない未返済分は、どちらとも言えないので数えない。
   * 判定できる分がなければ null
   */
  promptRate: number | null;
  /** まだ返済で埋まっていない金額 */
  outstandingAmount: number;
  /** まだ埋まっていない分のうち、いちばん古いものの経過日数 */
  oldestOutstandingDays: number | null;
  /** 残高が0に戻った回数 */
  settlementCount: number;
};

/**
 * 返済の傾向をまとめる。
 *
 * @param side credit = 相手の返済（自分の貸しが返ってくる）、debt = 自分の返済
 * @param partnerId 渡すとその相手の分だけを見る
 */
export function summarizeRepayment(
  analysis: MovementAnalysis,
  side: RepaymentSide,
  partnerId?: string,
  now: Date = new Date(),
): RepaymentSummary {
  const match = (row: { partnerId: string }) =>
    partnerId === undefined || row.partnerId === partnerId;

  const repaid = analysis.repaid.filter((r) => r.side === side && match(r));
  const outstanding = analysis.outstanding.filter(
    (o) => o.side === side && match(o),
  );

  const repaidAmount = repaid.reduce((sum, r) => sum + r.amount, 0);
  const weightedDays = repaid.reduce((sum, r) => sum + r.amount * r.days, 0);

  let promptAmount = 0;
  let decidedAmount = 0;
  for (const r of repaid) {
    decidedAmount += r.amount;
    if (r.days <= PROMPT_REPAYMENT_DAYS) promptAmount += r.amount;
  }
  for (const o of outstanding) {
    if (daysBetween(o.since, now) > PROMPT_REPAYMENT_DAYS) {
      decidedAmount += o.amount;
    }
  }

  const oldest = outstanding.reduce<Date | null>(
    (min, o) => (!min || o.since < min ? o.since : min),
    null,
  );

  return {
    repaidAmount,
    averageDays: repaidAmount > 0 ? weightedDays / repaidAmount : null,
    promptRate: decidedAmount > 0 ? promptAmount / decidedAmount : null,
    outstandingAmount: outstanding.reduce((sum, o) => sum + o.amount, 0),
    oldestOutstandingDays: oldest ? daysBetween(oldest, now) : null,
    settlementCount: analysis.settlements.filter(match).length,
  };
}

/** 貸し借りのどちらかでも返済の記録・未返済があるか */
export function hasRepaymentData(summary: RepaymentSummary): boolean {
  return summary.repaidAmount > 0 || summary.outstandingAmount > 0;
}

export type PurposeStat = {
  purpose: string;
  count: number;
  /** 金額の絶対値の合計 */
  total: number;
};

/** よく使う用途（回数の多い順）。利息と用途なしは数えない */
export function topPurposes(
  transactions: Array<{ purpose?: string | null; kind?: string | null; amount: number }>,
  limit = 5,
): PurposeStat[] {
  const stats = new Map<string, PurposeStat>();
  for (const t of transactions) {
    const purpose = t.purpose?.trim();
    if (!purpose || isInterestKind(t.kind)) continue;
    const stat = stats.get(purpose) ?? { purpose, count: 0, total: 0 };
    stat.count += 1;
    stat.total += Math.abs(t.amount);
    stats.set(purpose, stat);
  }
  return [...stats.values()]
    .sort((a, b) => b.count - a.count || b.total - a.total)
    .slice(0, limit);
}
