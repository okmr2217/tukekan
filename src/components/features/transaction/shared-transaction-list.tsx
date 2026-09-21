"use client";

import { useState } from "react";
import { TransactionCard } from "./transaction-card";
import { TransactionDetailModal } from "./transaction-detail-modal";

/**
 * 公開URL（/share/[token]）の取引。
 * 金額・残高は記録者（オーナー）視点の符号のまま渡ってくる。
 */
export type SharedTransaction = {
  id: string;
  amount: number;
  purpose: string | null;
  description: string | null;
  date: Date;
  kind?: string | null;
  ledgerId: string | null;
  runningBalance: number;
};

type Props = {
  transactions: SharedTransaction[];
  /** 記録者の名前。相手から見た「相手」なので、文言はこの名前で組み立てる */
  ownerName: string;
  /** 口座ID → 口座名。複数の口座をまとめて出しているときだけ渡す */
  ledgerTitles?: Map<string, string>;
};

/**
 * 公開ページの取引一覧。
 *
 * カードもダイアログも認証ページと同じコンポーネントを使い、
 * viewpoint="partner" で符号と文言だけ相手視点にする。
 * 編集などのフッターは actions を渡さないので出ない。
 */
export function SharedTransactionList({
  transactions,
  ownerName,
  ledgerTitles,
}: Props) {
  const [selected, setSelected] = useState<SharedTransaction | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const titleOf = (t: SharedTransaction) =>
    t.ledgerId ? ledgerTitles?.get(t.ledgerId) : undefined;

  return (
    <>
      <div className="space-y-2">
        {transactions.map((t) => (
          <TransactionCard
            key={t.id}
            transaction={t}
            runningBalance={t.runningBalance}
            viewpoint="partner"
            ledgerTitle={titleOf(t)}
            onClick={() => {
              setSelected(t);
              setDetailOpen(true);
            }}
          />
        ))}
      </div>

      <TransactionDetailModal
        transaction={selected}
        runningBalance={selected?.runningBalance ?? 0}
        viewpoint="partner"
        counterpartyName={ownerName}
        ledgerTitle={selected ? titleOf(selected) : undefined}
        open={detailOpen}
        onOpenChange={setDetailOpen}
      />
    </>
  );
}
