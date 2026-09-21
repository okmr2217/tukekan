/**
 * 取引カード／取引詳細ダイアログの文言。
 *
 * 金額（amount）も残高（runningBalance）も、DBには常に
 * 「記録者（オーナー）視点」の符号で入っている。
 *   +  : オーナーの債権が増える
 *   -  : オーナーの債務が増える
 *
 * 表示は「そのページを見ている人」の視点に揃えるので、公開URL（相手が見る）では
 * 符号を反転してから文言を決める。これにより
 *   - 名目（貸した／返済した／借りた／返済された）
 *   - 残高の立場（債権／債務）
 *   - 色（債権 = 緑 / 債務 = 赤）
 * がページをまたいで一貫する。
 *
 * 名目は「金額の向き」だけでは決まらない。同じマイナスの取引でも、
 * その取引を反映する前の残高が債権なら「返済された」、債務なら「借りた」になる。
 * そのため反映前の残高（runningBalance - amount）を使って判定する。
 */

import { isInterestKind } from "@/lib/transaction-kind";

/** 表示の視点。owner = アプリ本体（記録者）、partner = 公開URL（相手） */
export type TransactionViewpoint = "owner" | "partner";

/** 見ている人にとっての立場。そのまま色に対応する */
export type MoneyTone = "credit" | "debt" | "settled";

/** 取引の名目 */
export type TransactionMovement =
  | "lend" // 貸した
  | "repayMade" // 返済した（自分が返した）
  | "borrow" // 借りた
  | "repayReceived" // 返済された（相手が返してくれた）
  | "interest"; // 利息（自動発生）

const MOVEMENT_LABELS: Record<TransactionMovement, string> = {
  lend: "貸した",
  repayMade: "返済した",
  borrow: "借りた",
  repayReceived: "返済された",
  interest: "利息",
};

/** オーナー視点で保存された値を、見ている人の視点に直す */
export function toViewpointValue(
  value: number,
  viewpoint: TransactionViewpoint,
): number {
  return viewpoint === "owner" ? value : -value;
}

type TransactionInput = {
  amount: number;
  kind?: string | null;
};

export type TransactionStatement = {
  movement: TransactionMovement;
  /** 名目ラベル（貸した／返済した／借りた／返済された／利息） */
  label: string;
  /** 見ている人にとって債権が増える取引なら credit */
  tone: MoneyTone;
  /** 見ている人の視点の金額（符号つき） */
  amount: number;
  /** 見ている人の視点の、取引を反映する前の残高 */
  previousBalance: number;
  /** 見ている人の視点の、取引を反映した後の残高 */
  balance: number;
};

/**
 * 取引ひとつぶんの名目・金額・前後の残高を、見ている人の視点で組み立てる。
 *
 * @param runningBalance その取引を反映した直後の残高（オーナー視点）
 */
export function describeTransaction(
  transaction: TransactionInput,
  runningBalance: number,
  viewpoint: TransactionViewpoint,
): TransactionStatement {
  const amount = toViewpointValue(transaction.amount, viewpoint);
  const balance = toViewpointValue(runningBalance, viewpoint);
  const previousBalance = balance - amount;

  const movement: TransactionMovement = isInterestKind(transaction.kind)
    ? "interest"
    : amount >= 0
      ? previousBalance < 0
        ? "repayMade"
        : "lend"
      : previousBalance > 0
        ? "repayReceived"
        : "borrow";

  return {
    movement,
    label: MOVEMENT_LABELS[movement],
    tone: amount > 0 ? "credit" : amount < 0 ? "debt" : "settled",
    amount,
    previousBalance,
    balance,
  };
}

/** 「◯◯さんに貸しました」のような一文。counterparty は見ている人から見た相手 */
export function transactionSentence(
  statement: TransactionStatement,
  counterpartyName: string,
): string {
  const name = `${counterpartyName}さん`;
  switch (statement.movement) {
    case "lend":
      return `${name}に貸しました`;
    case "repayMade":
      return `${name}に返しました`;
    case "borrow":
      return `${name}から借りました`;
    case "repayReceived":
      return `${name}から返してもらいました`;
    case "interest":
      return statement.tone === "credit"
        ? `${name}への貸しに利息が付きました`
        : `${name}からの借りに利息が付きました`;
  }
}

export type BalanceRoleStatement = {
  tone: MoneyTone;
  /** 債権か債務かが読み取れる短いラベル */
  label: string;
  /** 「残高」と組み合わせて使うラベル */
  balanceLabel: string;
  /** 会計用語での立場 */
  role: string;
  /** 表示用の絶対値 */
  absAmount: number;
};

/**
 * 残高が債権なのか債務なのかを表す。balance は見ている人の視点の値。
 */
export function describeBalanceRole(balance: number): BalanceRoleStatement {
  if (balance > 0) {
    return {
      tone: "credit",
      label: "貸している",
      balanceLabel: "貸している残高",
      role: "債権",
      absAmount: balance,
    };
  }
  if (balance < 0) {
    return {
      tone: "debt",
      label: "借りている",
      balanceLabel: "借りている残高",
      role: "債務",
      absAmount: -balance,
    };
  }
  return {
    tone: "settled",
    label: "貸し借りなし",
    balanceLabel: "残高",
    role: "精算済み",
    absAmount: 0,
  };
}

/** 「¥1,234」 */
export function formatYen(amount: number): string {
  return `¥${Math.abs(amount).toLocaleString()}`;
}

/**
 * 取引の金額。マイナスのときだけ符号を付ける（プラスは符号なし）。
 *
 * 金額そのものは色を持たせず黒（foreground）で出すので、
 * 「減った」ことだけはマイナス符号で示す。債権／債務の向きは
 * 名目チップと残高の色が担当する。
 */
export function formatTransactionAmount(amount: number): string {
  return amount < 0 ? `-${formatYen(amount)}` : formatYen(amount);
}
