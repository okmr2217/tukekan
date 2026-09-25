/**
 * 統計ページの期間と、月（JST）の扱い。
 *
 * 月の区切りは日本時間で考える。DB の日時は UTC なので、+9時間ずらしてから年月を取る。
 */

export const STATS_PERIODS = ["12m", "year", "all"] as const;

export type StatsPeriod = (typeof STATS_PERIODS)[number];

export const DEFAULT_STATS_PERIOD: StatsPeriod = "12m";

export const STATS_PERIOD_LABELS: Record<StatsPeriod, string> = {
  "12m": "直近12ヶ月",
  year: "今年",
  all: "全期間",
};

export function toStatsPeriod(value: unknown): StatsPeriod {
  return STATS_PERIODS.includes(value as StatsPeriod)
    ? (value as StatsPeriod)
    : DEFAULT_STATS_PERIOD;
}

const JST_OFFSET_MS = 9 * 60 * 60 * 1000;

/** 日時が属する JST の年月（"YYYY-MM"） */
export function jstMonthKey(date: Date): string {
  const jst = new Date(date.getTime() + JST_OFFSET_MS);
  return `${jst.getUTCFullYear()}-${String(jst.getUTCMonth() + 1).padStart(2, "0")}`;
}

function parseMonthKey(key: string): { year: number; month: number } {
  const [year, month] = key.split("-").map(Number);
  return { year, month };
}

function toMonthKey(year: number, month: number): string {
  // month は 1〜12 の範囲外も受け付ける（前後の年に繰り上げる）
  const d = new Date(Date.UTC(year, month - 1, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

/** その月の JST 1日 0:00 を UTC の日時で返す */
export function jstMonthStart(key: string): Date {
  const { year, month } = parseMonthKey(key);
  return new Date(Date.UTC(year, month - 1, 1) - JST_OFFSET_MS);
}

/** 翌月の JST 1日 0:00（= その月の終わり） */
export function jstMonthEnd(key: string): Date {
  const { year, month } = parseMonthKey(key);
  return jstMonthStart(toMonthKey(year, month + 1));
}

/** start から end まで（両端を含む）の年月の並び */
export function monthKeysBetween(start: string, end: string): string[] {
  const keys: string[] = [];
  const { year, month } = parseMonthKey(start);
  for (let i = 0; ; i++) {
    const key = toMonthKey(year, month + i);
    if (key > end) return keys;
    keys.push(key);
  }
}

/** 「2025年1月」 */
export function formatMonthLabel(key: string): string {
  const { year, month } = parseMonthKey(key);
  return `${year}年${month}月`;
}

/** グラフの目盛り用。1月だけ年を添える（「25年1月」「2月」…） */
export function formatMonthShort(key: string): string {
  const { year, month } = parseMonthKey(key);
  return month === 1 ? `${year % 100}年1月` : `${month}月`;
}

export type StatsPeriodRange = {
  /** 期間の始まり。全期間なら null */
  from: Date | null;
  /** 期間に含まれる年月（古い順） */
  months: string[];
};

/**
 * 期間の範囲。
 *
 * @param firstDate いちばん古い取引の日時。全期間のときの始まりの月に使う
 */
export function resolveStatsPeriod(
  period: StatsPeriod,
  firstDate: Date | null,
  now: Date = new Date(),
): StatsPeriodRange {
  const current = jstMonthKey(now);
  const { year, month } = parseMonthKey(current);

  if (period === "12m") {
    const start = toMonthKey(year, month - 11);
    return { from: jstMonthStart(start), months: monthKeysBetween(start, current) };
  }
  if (period === "year") {
    const start = toMonthKey(year, 1);
    return { from: jstMonthStart(start), months: monthKeysBetween(start, current) };
  }

  const start = firstDate ? jstMonthKey(firstDate) : current;
  return { from: null, months: monthKeysBetween(start, current) };
}
