"use client";

import { useState } from "react";
import { TransactionCard } from "./transaction-card";
import { TransactionEditModal } from "./transaction-edit-modal";
import type { TransactionWithPartner } from "@/actions/transaction";
import type { Transaction } from "./transaction-list";

type Props = {
  transactions: TransactionWithPartner[];
  suggestions: string[];
};

export function TransactionCardList({ transactions, suggestions }: Props) {
  const [selectedTransaction, setSelectedTransaction] =
    useState<Transaction | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);

  const handleEdit = (transaction: TransactionWithPartner) => {
    setSelectedTransaction({
      id: transaction.id,
      amount: transaction.amount,
      description: transaction.description,
      date: transaction.date,
      partnerName: transaction.partnerName,
      partnerId: transaction.partnerId,
    });
    setEditModalOpen(true);
  };

  if (transactions.length === 0) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        取引履歴がありません
      </div>
    );
  }

  return (
    <>
      <div className="space-y-1.5">
        {transactions.map((t) => (
          <TransactionCard key={t.id} transaction={t} onEdit={handleEdit} />
        ))}
      </div>
      <TransactionEditModal
        transaction={selectedTransaction}
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        suggestions={suggestions}
      />
    </>
  );
}
