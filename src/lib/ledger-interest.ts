import { toJST } from "@/lib/date-utils";

/** 週利率の段階が切り替わる残高のしきい値（円） */
export const INTEREST_TIER_THRESHOLD = 5000;

/**
 * 口座の残高に応じて、どちらの週利率を適用するかを決める。
 * 残高（絶対値）がしきい値以上なら rateFrom5000、未満なら rateUnder5000。
 */
export function getEffectiveWeeklyRate(
  balance: number,
  rateUnder5000: number,
  rateFrom5000: number,
): number {
  return Math.abs(balance) >= INTEREST_TIER_THRESHOLD ? rateFrom5000 : rateUnder5000;
}

/**
 * 次回、週次利子ジョブ（毎週水曜 9:00 JST）が実行される日時を返す。
 * 返り値は他の日付ユーティリティと同じ規約で、Date のフィールド（getFullYear等）が
 * そのまま JST の壁時計時刻を表す（toJST() の変換結果と同じ扱い）。
 */
export function getNextInterestDateJST(from: Date = new Date()): Date {
  const jst = toJST(from);
  const target = new Date(
    jst.getFullYear(),
    jst.getMonth(),
    jst.getDate(),
    9,
    0,
    0,
    0,
  );

  const WEDNESDAY = 3;
  let daysUntilWednesday = (WEDNESDAY - jst.getDay() + 7) % 7;
  if (daysUntilWednesday === 0 && jst.getTime() >= target.getTime()) {
    daysUntilWednesday = 7;
  }
  target.setDate(target.getDate() + daysUntilWednesday);
  return target;
}

export type NextInterestPreview = {
  nextDate: Date;
  rate: number;
  /** 残高がこのまま変わらなかった場合に、次回発生する見込み利子額（円） */
  amount: number;
  /** いずれかの利率が設定され、かつ残高がプラスで実際に利子が発生する見込みか */
  isEligible: boolean;
};

/**
 * 「このまま残高が変わらなければ、次回いくらの利子が発生するか」のプレビューを返す。
 * 週次ジョブと同じ規則（残高がプラスの口座のみ対象）に合わせている。
 */
export function getNextInterestPreview(
  balance: number,
  rateUnder5000: number,
  rateFrom5000: number,
  from: Date = new Date(),
): NextInterestPreview {
  const rate = getEffectiveWeeklyRate(balance, rateUnder5000, rateFrom5000);
  const isEligible = rate > 0 && balance > 0;
  return {
    nextDate: getNextInterestDateJST(from),
    rate,
    amount: isEligible ? Math.round(balance * (rate / 100)) : 0,
    isEligible,
  };
}
