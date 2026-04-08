"use client";

import { useState, useTransition } from "react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

type Props = {
  transactions: TransactionWithPartner[];
  suggestions: string[];
  partners?: Partner[];
};

export function TransactionCardList({ transactions, suggestions, partners = [] }: Props) {
  const [selectedTransaction, setSelectedTransaction] =
    useState<TransactionWithPartner | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [deleteTargetTransaction, setDeleteTargetTransaction] =
    useState<TransactionWithPartner | null>(null);

  const [isArchivePending, startArchiveTransition] = useTransition();
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
    const action = transaction.isArchived ? unarchiveTransaction : archiveTransaction;
    startArchiveTransition(async () => {
      const result = await action(transaction.id);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success(transaction.isArchived ? "アーカイブを解除しました" : "アーカイブしました");
    });
  };

  const handleDeleteRequest = (transaction: TransactionWithPartner) => {
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
          <TransactionCard
            key={t.id}
            transaction={t}
            onEdit={handleEdit}
            onDetail={handleDetail}
            onArchiveToggle={handleArchiveToggle}
            onDelete={handleDeleteRequest}
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
      />

      {/* 削除確認ダイアログ */}
      <Dialog
        open={deleteTargetTransaction !== null}
        onOpenChange={(open) => {
          if (!open && !isDeletePending) setDeleteTargetTransaction(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>取引を削除</DialogTitle>
            <DialogDescription>
              この取引を削除しますか？この操作は取り消せません。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteTargetTransaction(null)}
              disabled={isDeletePending}
            >
              キャンセル
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={isDeletePending}
            >
              {isDeletePending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  削除中...
                </>
              ) : (
                "削除"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
