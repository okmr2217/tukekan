/**
 * 取引の「名目」ラベル。
 *
 * 取引の実質は金額の符号（+ = 自分の債権が増える / - = 自分の債務が増える）の2択だが、
 * 名目としては4通りの言い方がある。
 *
 *   + : 貸した / 返済した
 *   - : 借りた / 返済された
 *
 * どちらの言い方を前面に出すかはユーザーの使い方次第なので、
 * プリセットとして設定ページから切り替えられるようにしている。
 *
 * ボタンの並び順は常に「+ が左、- が右」で固定する（プリセットを変えても
 * 押す位置が入れ替わらないようにするため）。プリセットで変わるのは
 * ラベルと初期選択だけ。
 */

export const TRANSACTION_LABEL_PRESETS = ["BOTH", "LENDER", "BORROWER"] as const;

export type TransactionLabelPreset = (typeof TRANSACTION_LABEL_PRESETS)[number];

export const DEFAULT_TRANSACTION_LABEL_PRESET: TransactionLabelPreset = "BOTH";

export type TransactionLabelOption = {
  value: TransactionLabelPreset;
  /** 設定画面での選択肢名 */
  title: string;
  /** 設定画面での補足 */
  hint: string;
  /** 金額 + 側（自分の債権が増える）のラベル */
  lendingLabel: string;
  /** 金額 - 側（自分の債務が増える）のラベル */
  borrowingLabel: string;
  /** 取引フォームを開いたときに選ばれている側 */
  defaultIsLending: boolean;
};

export const TRANSACTION_LABEL_OPTIONS: readonly TransactionLabelOption[] = [
  {
    value: "BOTH",
    title: "貸し借り両方",
    hint: "貸すことも借りることもある人向け",
    lendingLabel: "貸した・返済した",
    borrowingLabel: "借りた・返済された",
    defaultIsLending: true,
  },
  {
    value: "LENDER",
    title: "よく貸す",
    hint: "貸して返してもらうことが多い人向け",
    lendingLabel: "貸した",
    borrowingLabel: "返済された",
    defaultIsLending: true,
  },
  {
    value: "BORROWER",
    title: "よく借りる",
    hint: "借りて返すことが多い人向け",
    lendingLabel: "返済した",
    borrowingLabel: "借りた",
    defaultIsLending: false,
  },
] as const;

export function isTransactionLabelPreset(
  value: unknown,
): value is TransactionLabelPreset {
  return TRANSACTION_LABEL_PRESETS.includes(value as TransactionLabelPreset);
}

export function toTransactionLabelPreset(value: unknown): TransactionLabelPreset {
  return isTransactionLabelPreset(value)
    ? value
    : DEFAULT_TRANSACTION_LABEL_PRESET;
}

export function getTransactionLabelOption(
  preset: TransactionLabelPreset,
): TransactionLabelOption {
  return (
    TRANSACTION_LABEL_OPTIONS.find((o) => o.value === preset) ??
    TRANSACTION_LABEL_OPTIONS[0]
  );
}
