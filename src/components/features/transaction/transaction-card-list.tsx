"use client";

import { useState } from "react";
import { TransactionCard } from "./transaction-card";
import { TransactionEditModal } from "./transaction-edit-modal";
import type { TransactionWithPartner } from "@/actions/transaction";
import type { Partner } from "@/actions/partner";

type Props = {
  transactions: TransactionWithPartner[];
  suggestions: string[];
  partners?: Partner[];
};

export function TransactionCardList({ transactions, suggestions, partners = [] }: Props) {
  const [selectedTransaction, setSelectedTransaction] =
    useState<TransactionWithPartner | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);

  const handleEdit = (transaction: TransactionWithPartner) => {
    setSelectedTransaction(transaction);
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
        partners={partners}
      />
    </>
  );
}
