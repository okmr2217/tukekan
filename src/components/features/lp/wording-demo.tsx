"use client";

import { useState } from "react";
import { Lightbulb, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  TRANSACTION_LABEL_OPTIONS,
  getTransactionLabelOption,
  type TransactionLabelPreset,
} from "@/lib/transaction-labels";
import {
  describeTransaction,
  formatYen,
  type TransactionMovement,
  type TransactionStatement,
  type TransactionViewpoint,
} from "@/lib/transaction-wording";
import {
  ownerBalanceStatement,
  partnerBalanceStatement,
} from "@/lib/balance-wording";
import { TransactionCard } from "@/components/features/transaction/transaction-card";
import { TransactionLabelOptionButton } from "@/components/features/transaction/transaction-label-option-button";
import {
  AMOUNT_SIDE_BASE,
  AMOUNT_SIDE_CLASSES,
} from "@/components/features/transaction/transaction-tone";
import { TONE_TEXT } from "@/components/features/transaction/transaction-tone";

/*
 * ことばの設計のライブデモ（docs/14-lp-visual-assets.md 10章）。
 * 名目・残高・色はすべてアプリと同じロジックで出す。
 * 実物のフォームは「ボタンで向きを選んでから登録」だが、ここでは触ってすぐ結果が見えるよう、
 * ボタンを押したらそのまま記録する。
 */

const AMOUNTS = [1000, 3000, 5000] as const;
/** 取引カードは新しい順にこの件数まで */
const MAX_CARDS = 5;

/** 「用途なし」の表示を避けるため、用途は名目から自動で入れる */
const PURPOSE_BY_MOVEMENT: Record<TransactionMovement, string> = {
  lend: "ランチ",
  repayReceived: "返済",
  repayMade: "返済",
  borrow: "タクシー代",
  interest: "利子",
};

type DemoTransaction = {
  id: string;
  amount: number;
  purpose: string;
  description: null;
  date: Date;
  /** その取引を反映した直後の残高（オーナー視点） */
  runningBalance: number;
};

/** なぜその言い方になったのか。statement は見ている人の視点 */
function explainMovement(statement: TransactionStatement): string {
  const { movement, previousBalance } = statement;
  const before =
    previousBalance > 0
      ? "貸しているとき"
      : previousBalance < 0
        ? "借りているとき"
        : "貸し借りがないとき";
  switch (movement) {
    case "lend":
      return `${before}に渡したので「貸した」`;
    case "repayMade":
      return "借りているときに渡したので「返済した」";
    case "repayReceived":
      return "貸しているときに受け取ったので「返済された」";
    case "borrow":
      return `${before}に受け取ったので「借りた」`;
    case "interest":
      return "";
  }
}

function initialTransactions(initialNow: number): DemoTransaction[] {
  return [
    {
      id: "demo-0",
      amount: 1000,
      purpose: "ランチ",
      description: null,
      date: new Date(initialNow - 5 * 60 * 1000),
      runningBalance: 1000,
    },
  ];
}

type Props = {
  ownerName: string;
  partnerName: string;
  /** サーバーで描いた時刻。最初の1件の日時をサーバーとクライアントでそろえる */
  initialNow: number;
};

export function WordingDemo({ ownerName, partnerName, initialNow }: Props) {
  const [viewpoint, setViewpoint] = useState<TransactionViewpoint>("owner");
  const [preset, setPreset] = useState<TransactionLabelPreset>("BOTH");
  const [presetChanges, setPresetChanges] = useState(0);
  const [amount, setAmount] = useState<number>(AMOUNTS[0]);
  const [transactions, setTransactions] = useState(() => initialTransactions(initialNow));
  const [nextId, setNextId] = useState(1);

  const option = getTransactionLabelOption(preset);
  const balance = transactions[0]?.runningBalance ?? 0;
  const isPartnerView = viewpoint === "partner";
  const statement = isPartnerView
    ? partnerBalanceStatement(balance, ownerName, partnerName)
    : ownerBalanceStatement(balance, partnerName);
  const latest = transactions[0];
  const latestStatement = latest
    ? describeTransaction(latest, latest.runningBalance, viewpoint)
    : null;

  const record = (signedAmount: number) => {
    const runningBalance = balance + signedAmount;
    const { movement } = describeTransaction(
      { amount: signedAmount },
      runningBalance,
      "owner",
    );
    setTransactions((rows) =>
      [
        {
          id: `demo-${nextId}`,
          amount: signedAmount,
          purpose: PURPOSE_BY_MOVEMENT[movement],
          description: null,
          date: new Date(),
          runningBalance,
        },
        ...rows,
      ].slice(0, MAX_CARDS),
    );
    setNextId((n) => n + 1);
  };

  const reset = () => {
    setViewpoint("owner");
    setPreset("BOTH");
    setPresetChanges(0);
    setAmount(AMOUNTS[0]);
    setTransactions(initialTransactions(Date.now()));
  };

  const viewers: Array<{ key: TransactionViewpoint; label: string; note?: string }> = [
    { key: "owner", label: `${ownerName}の画面` },
    { key: "partner", label: `${partnerName}さんの画面`, note: "（共有リンク）" },
  ];

  return (
    <div className="overflow-hidden rounded-3xl border bg-card shadow-sm">
      {/* 見ている人 */}
      <div className="flex flex-col gap-2 border-b bg-muted/40 px-4 py-3 sm:flex-row sm:items-center sm:gap-3 md:px-6">
        <p className="shrink-0 text-xs font-bold text-muted-foreground">見ている人</p>
        <div role="radiogroup" aria-label="見ている人" className="flex rounded-xl bg-muted p-1">
          {viewers.map(({ key, label, note }) => (
            <button
              key={key}
              type="button"
              role="radio"
              aria-checked={viewpoint === key}
              onClick={() => setViewpoint(key)}
              className={cn(
                "flex-1 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors sm:flex-none sm:text-sm",
                viewpoint === key
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {label}
              {note && <span className="hidden sm:inline">{note}</span>}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2">
        {/* 操作 */}
        <div className="relative border-b p-4 md:border-r md:border-b-0 md:p-6">
          <div
            className={cn(
              "space-y-6 transition-opacity",
              isPartnerView && "pointer-events-none opacity-40",
            )}
            aria-hidden={isPartnerView}
          >
            <div>
              <p className="mb-2 text-xs font-bold text-muted-foreground">ボタンの言い方</p>
              <div className="space-y-2">
                {TRANSACTION_LABEL_OPTIONS.map((o) => (
                  <TransactionLabelOptionButton
                    key={o.value}
                    option={o}
                    selected={o.value === preset}
                    disabled={isPartnerView}
                    onSelect={() => {
                      if (o.value === preset) return;
                      setPreset(o.value);
                      setPresetChanges((n) => n + 1);
                    }}
                  />
                ))}
              </div>
            </div>

            <div>
              <p className="mb-2 text-xs font-bold text-muted-foreground">金額</p>
              <div className="flex gap-2">
                {AMOUNTS.map((a) => (
                  <button
                    key={a}
                    type="button"
                    onClick={() => setAmount(a)}
                    disabled={isPartnerView}
                    aria-pressed={amount === a}
                    className={cn(
                      "flex-1 rounded-lg border px-3 py-2 text-sm font-medium tabular-nums transition-colors",
                      amount === a
                        ? "border-foreground bg-foreground text-background"
                        : "border-border hover:bg-muted",
                    )}
                  >
                    {formatYen(a)}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => record(amount)}
                  disabled={isPartnerView}
                  className={cn(
                    AMOUNT_SIDE_BASE,
                    "px-2 py-3 whitespace-nowrap",
                    option.defaultIsLending
                      ? AMOUNT_SIDE_CLASSES.lending.selected
                      : AMOUNT_SIDE_CLASSES.lending.unselected,
                  )}
                >
                  {option.lendingLabel}
                </button>
                <button
                  type="button"
                  onClick={() => record(-amount)}
                  disabled={isPartnerView}
                  className={cn(
                    AMOUNT_SIDE_BASE,
                    "px-2 py-3 whitespace-nowrap",
                    !option.defaultIsLending
                      ? AMOUNT_SIDE_CLASSES.borrowing.selected
                      : AMOUNT_SIDE_CLASSES.borrowing.unselected,
                  )}
                >
                  {option.borrowingLabel}
                </button>
              </div>
              <div className="mt-1.5 flex justify-between gap-2 px-1 text-[11px] text-muted-foreground">
                <span>お金を渡した</span>
                <span>お金を受け取った</span>
              </div>
              <p className="mt-3 text-center text-xs text-muted-foreground">
                押すと、そのまま記録されます
                {presetChanges > 0 && (
                  <span
                    key={presetChanges}
                    className="ml-1.5 inline-block animate-in rounded-full bg-foreground px-2 py-0.5 font-semibold text-background duration-500 fade-in zoom-in-95 motion-reduce:animate-none"
                  >
                    並びはそのまま
                  </span>
                )}
              </p>
            </div>
          </div>

          {isPartnerView && (
            <p className="absolute inset-x-4 top-1/2 -translate-y-1/2 rounded-xl border bg-background px-4 py-3 text-center text-sm font-medium shadow-sm md:inset-x-6">
              共有リンクのページは読み取り専用です
            </p>
          )}

          <div className="mt-6 flex justify-end">
            <button
              type="button"
              onClick={reset}
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <RotateCcw className="size-3.5" />
              最初から
            </button>
          </div>
        </div>

        {/* 残高と取引 */}
        <div className="bg-muted/20 p-4 md:p-6" aria-live="polite">
          <div className="rounded-2xl border bg-card px-4 pt-4 pb-3.5">
            <p className="text-xs text-muted-foreground">{statement.message}</p>
            <p
              className={cn(
                "mt-1 text-3xl leading-tight font-semibold tabular-nums",
                TONE_TEXT[statement.tone],
              )}
            >
              {formatYen(balance)}
            </p>
          </div>

          <div className="mt-4 space-y-2">
            {transactions.map((t, i) => (
              <div
                key={t.id}
                className={cn(i === 0 && "animate-in fade-in slide-in-from-top-2 duration-300 motion-reduce:animate-none")}
              >
                <TransactionCard
                  transaction={t}
                  runningBalance={t.runningBalance}
                  viewpoint={viewpoint}
                />
                {i === 0 && latestStatement && (
                  <p className="mt-1.5 mb-3 px-1 text-xs font-medium text-foreground">
                    <Lightbulb className="mr-1 inline size-3.5 -translate-y-px text-muted-foreground" />
                    {isPartnerView && `${partnerName}さんから見ると、`}
                    {explainMovement(latestStatement)}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
