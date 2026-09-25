/**
 * 口座（Ledger）の利子ルール。
 *
 * - 利率は「年利(%)」で保持・表示する。週ごとの利息額は「年利 ÷ 52」で計算する
 * - 利息は口座ごとに指定した曜日（JST）に週1回発生する
 * - 単利なら元本のみ、複利なら元本＋未払利息に対して課金する
 * - 発生した利息は元本に足さず、未払利息として別勘定に積む（src/lib/ledger-balance.ts）
 */

import { toJST } from "@/lib/date-utils";
import type { LedgerBalanceBreakdown } from "@/lib/ledger-balance";

/** 週換算に使う1年の週数 */
export const WEEKS_PER_YEAR = 52;

/** 年利の入力上限(%)。旧仕様の週利100%と等価 */
export const MAX_ANNUAL_INTEREST_RATE = 5200;

export const WEEKDAY_LABELS = ["日", "月", "火", "水", "木", "金", "土"] as const;

/** 既定の発生曜日（水曜）。旧仕様の固定スケジュールに合わせている */
export const DEFAULT_INTEREST_WEEKDAY = 3;

/** 利子の計算に必要な口座の設定 */
export type LedgerInterestSettings = {
  /** 年利(%)。0 = 無利子 */
  annualInterestRate: number;
  /** 利息が発生する曜日（JST。0=日 〜 6=土） */
  interestAccrualWeekday: number;
  /** true = 複利（元本＋未払利息に課金） / false = 単利（元本のみ） */
  interestCompounding: boolean;
};

/** 年利1%あたりのベーシスポイント。DB では年利を 0.01% 単位の整数で持つ */
const BASIS_POINTS_PER_PERCENT = 100;

/** 年利(%) → DB に保存するベーシスポイント（例: 5.25 → 525）。小数3桁目以下は四捨五入 */
export function toAnnualInterestRateBp(annualRate: number): number {
  return Math.round(annualRate * BASIS_POINTS_PER_PERCENT);
}

/** DB のベーシスポイント → 年利(%)（例: 525 → 5.25） */
export function fromAnnualInterestRateBp(bp: number | null | undefined): number {
  return bp ? bp / BASIS_POINTS_PER_PERCENT : 0;
}

/**
 * DB の Ledger 行から利子の設定を読み出す。年利はベーシスポイントから % に直す。
 * 各サーバーアクションで同じ変換を繰り返さないための共通ヘルパー。
 */
export function toInterestSettings(ledger: {
  annualInterestRateBp?: number | null;
  interestAccrualWeekday?: number | null;
  interestCompounding?: boolean | null;
}): LedgerInterestSettings {
  const weekday = Number(ledger.interestAccrualWeekday);
  return {
    annualInterestRate: fromAnnualInterestRateBp(ledger.annualInterestRateBp),
    interestAccrualWeekday: isValidWeekday(weekday) ? weekday : DEFAULT_INTEREST_WEEKDAY,
    interestCompounding: ledger.interestCompounding === true,
  };
}

export function isValidWeekday(value: number): boolean {
  return Number.isInteger(value) && value >= 0 && value <= 6;
}

/** 曜日番号を「水」のような1文字に変換する */
export function getWeekdayLabel(weekday: number): string {
  return WEEKDAY_LABELS[isValidWeekday(weekday) ? weekday : DEFAULT_INTEREST_WEEKDAY];
}

/** 年利(%) → 週利(%) */
export function toWeeklyRate(annualRate: number): number {
  return annualRate / WEEKS_PER_YEAR;
}

/** 小数の末尾の0を落として表示する（260 → "260", 4.50 → "4.5"） */
export function formatRate(rate: number, maxFractionDigits = 2): string {
  return rate.toLocaleString("ja-JP", { maximumFractionDigits: maxFractionDigits });
}

/** 週利の表示。端数が出るので小数2桁に丸める（年利260% → "5.00"） */
export function formatWeeklyRate(annualRate: number): string {
  return toWeeklyRate(annualRate).toFixed(2);
}

/** 利息が課金される対象額。単利は元本のみ、複利は元本＋未払利息 */
export function getInterestBase(
  breakdown: LedgerBalanceBreakdown,
  compounding: boolean,
): number {
  return compounding ? breakdown.total : breakdown.principal;
}

/** 1週間ぶんの利息額（円・四捨五入） */
export function calcWeeklyInterestAmount(base: number, annualRate: number): number {
  if (base <= 0 || annualRate <= 0) return 0;
  return Math.round((base * annualRate) / 100 / WEEKS_PER_YEAR);
}

/**
 * 次回、利子ジョブ（毎日 0:00 JST に起動し、当日が指定曜日の口座だけ処理する）が
 * この口座の利息を発生させる日時を返す。
 * 返り値は他の日付ユーティリティと同じ規約で、Date のフィールド（getFullYear等）が
 * そのまま JST の壁時計時刻を表す（toJST() の変換結果と同じ扱い）。
 */
export function getNextInterestDateJST(
  weekday: number = DEFAULT_INTEREST_WEEKDAY,
  from: Date = new Date(),
): Date {
  const jst = toJST(from);
  // ジョブは JST 0時に走るので、その日の 00:00 を基準にする。
  const target = new Date(
    jst.getFullYear(),
    jst.getMonth(),
    jst.getDate(),
    0,
    0,
    0,
    0,
  );

  const targetWeekday = isValidWeekday(weekday) ? weekday : DEFAULT_INTEREST_WEEKDAY;
  let daysUntilTarget = (targetWeekday - jst.getDay() + 7) % 7;
  if (daysUntilTarget === 0 && jst.getTime() >= target.getTime()) {
    daysUntilTarget = 7;
  }
  target.setDate(target.getDate() + daysUntilTarget);
  return target;
}

export type NextInterestPreview = {
  nextDate: Date;
  /** 年利(%) */
  annualRate: number;
  /** 週利(%)。年利 ÷ 52 */
  weeklyRate: number;
  /** 利息が課金される対象額（単利なら元本、複利なら元本＋未払利息） */
  base: number;
  /** 残高がこのまま変わらなかった場合に、次回発生する見込み利子額（円） */
  amount: number;
  /** 利率が設定され、かつ対象額がプラスで実際に利子が発生する見込みか */
  isEligible: boolean;
  /** 複利かどうか */
  compounding: boolean;
  /** 発生曜日（0=日 〜 6=土） */
  weekday: number;
};

/**
 * 「このまま残高が変わらなければ、次回いくらの利子が発生するか」のプレビューを返す。
 * 週次ジョブと同じ規則（対象額がプラスの口座のみ対象）に合わせている。
 */
export function getNextInterestPreview(
  breakdown: LedgerBalanceBreakdown,
  settings: LedgerInterestSettings,
  from: Date = new Date(),
): NextInterestPreview {
  const { annualInterestRate, interestAccrualWeekday, interestCompounding } = settings;
  const base = getInterestBase(breakdown, interestCompounding);
  const amount = calcWeeklyInterestAmount(base, annualInterestRate);

  return {
    nextDate: getNextInterestDateJST(interestAccrualWeekday, from),
    annualRate: annualInterestRate,
    weeklyRate: toWeeklyRate(annualInterestRate),
    base,
    amount,
    isEligible: annualInterestRate > 0 && base > 0,
    compounding: interestCompounding,
    weekday: interestAccrualWeekday,
  };
}

/**
 * 「毎週水曜日に、元本に対して年利260%（週5.00%）の利息が発生します」のような
 * 利子ルールの説明文。設定ページ・口座追加ダイアログ・共有ページ・ヘルプで共用する。
 */
export function describeInterestRule(settings: LedgerInterestSettings): string {
  const { annualInterestRate, interestAccrualWeekday, interestCompounding } = settings;
  if (annualInterestRate <= 0) {
    return "この口座では利息は発生しません。";
  }
  const target = interestCompounding ? "元本と未払利息の合計" : "元本";
  return `毎週${getWeekdayLabel(interestAccrualWeekday)}曜日に、${target}に対して年利${formatRate(
    annualInterestRate,
  )}%（週${formatWeeklyRate(annualInterestRate)}%）の利息が発生します。`;
}

/** 返済の充当順序の説明。設定ページ・ヘルプで共用する */
export const INTEREST_REPAYMENT_RULE_TEXT =
  "発生した利息は元本には足さず「未払利息」としてたまります。返済を記録すると、まず未払利息に充当され、余った分が元本の返済になります。";
