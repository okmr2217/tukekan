"use client";

import { useMemo, useState, useTransition } from "react";
import { buildRunningBalanceMap } from "@/lib/calc-running-balance";
import { TransactionCard } from "./transaction-card";
import { TransactionEditModal } from "./transaction-edit-modal";
import { TransactionDetailModal } from "./transaction-detail-modal";
import {
  archiveTransaction,
  unarchiveTransaction,
  deleteTransaction,
} from "@/actions/transaction";
import type { TransactionWithPartner } from "@/actions/transaction";
import type { Partner } from "@/actions/partner";
import { DeleteConfirmDialog } from "@/components/ui/delete-confirm-dialog";
import { toast } from "sonner";

type Props = {
  transactions: TransactionWithPartner[];
  suggestions: string[];
  partners?: Partner[];
  showPartnerName?: boolean;
};

export function TransactionCardList({
  transactions,
  suggestions,
  partners = [],
  showPartnerName = false,
}: Props) {
  const [selectedTransaction, setSelectedTransaction] =
    useState<TransactionWithPartner | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [deleteTargetTransaction, setDeleteTargetTransaction] =
    useState<TransactionWithPartner | null>(null);

  const [, startArchiveTransition] = useTransition();
  const [isDeletePending, startDeleteTransition] = useTransition();

  const handleEdit = (transaction: TransactionWithPartner) => {
    setSelectedTransaction(transaction);
    setEditModalOpen(true);
  };

  const handleDetail = (transaction: TransactionWithPartner) => {
    setSelectedTransaction(transaction);
    setDetailModalOpen(true);
  };

  const handleArchiveToggle = (transaction: TransactionWithPartner) => {
    const action = transaction.isArchived
      ? unarchiveTransaction
      : archiveTransaction;
    startArchiveTransition(async () => {
      const result = await action(transaction.id);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success(
        transaction.isArchived
          ? "アーカイブを解除しました"
          : "アーカイブしました",
      );
    });
  };

  const handleDeleteRequest = (transaction: TransactionWithPartner) => {
    setDetailModalOpen(false);
    setDeleteTargetTransaction(transaction);
  };

  const handleDeleteConfirm = () => {
    if (!deleteTargetTransaction) return;
    startDeleteTransition(async () => {
      const result = await deleteTransaction(deleteTargetTransaction.id);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("取引を削除しました");
      setDeleteTargetTransaction(null);
    });
  };

  const runningBalanceMap = useMemo(
    () => buildRunningBalanceMap(transactions),
    [transactions],
  );

  if (transactions.length === 0) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        取引履歴がありません
      </div>
    );
  }

  return (
    <>
      <div className="space-y-2">
        {transactions.map((t) => (
          <TransactionCard
            key={t.id}
            transaction={t}
            runningBalance={runningBalanceMap.get(t.id) ?? 0}
            onClick={() => handleDetail(t)}
            showPartnerName={showPartnerName}
          />
        ))}
      </div>

      <TransactionEditModal
        transaction={selectedTransaction}
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        suggestions={suggestions}
        partners={partners}
      />

      <TransactionDetailModal
        transaction={selectedTransaction}
        open={detailModalOpen}
        onOpenChange={setDetailModalOpen}
        onEdit={(t) => {
          setDetailModalOpen(false);
          handleEdit(t);
        }}
        onArchiveToggle={(t) => {
          setDetailModalOpen(false);
          handleArchiveToggle(t);
        }}
        onDelete={handleDeleteRequest}
      />

      <DeleteConfirmDialog
        open={deleteTargetTransaction !== null}
        onOpenChange={(open) => {
          if (!open && !isDeletePending) setDeleteTargetTransaction(null);
        }}
        title="取引を削除"
        description="この取引を削除しますか？この操作は取り消せません。"
        onConfirm={handleDeleteConfirm}
        isPending={isDeletePending}
      />
    </>
  );
}
