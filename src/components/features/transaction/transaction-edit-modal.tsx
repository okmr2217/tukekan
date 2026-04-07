"use client";

import { useState, useEffect, useTransition } from "react";
import {
  updateTransaction,
  deleteTransaction,
  archiveTransaction,
  unarchiveTransaction,
} from "@/actions/transaction";
import type { TransactionWithPartner } from "@/actions/transaction";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2, Trash2, Archive, ArchiveRestore } from "lucide-react";
import { toast } from "sonner";
import { TransactionFormFields } from "./transaction-form-fields";
import {
  floorToNearest30,
  buildDateTime,
  type DateMode,
} from "@/lib/date-picker-utils";
import { formatDateToJST } from "@/lib/dateUtils";

type Props = {
  transaction: TransactionWithPartner | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  suggestions?: string[];
};

function initDateMode(date: Date): DateMode {
  const jst = new Date(
    date.toLocaleString("en-US", { timeZone: "Asia/Tokyo" }),
  );
  const nowJst = new Date(
    new Date().toLocaleString("en-US", { timeZone: "Asia/Tokyo" }),
  );
  const today = new Date(
    nowJst.getFullYear(),
    nowJst.getMonth(),
    nowJst.getDate(),
  );
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const d = new Date(jst.getFullYear(), jst.getMonth(), jst.getDate());
  if (d.getTime() === today.getTime()) return "today";
  if (d.getTime() === yesterday.getTime()) return "yesterday";
  return "other";
}

function getDateString(date: Date): string {
  const jst = new Date(
    date.toLocaleString("en-US", { timeZone: "Asia/Tokyo" }),
  );
  return `${jst.getFullYear()}-${String(jst.getMonth() + 1).padStart(2, "0")}-${String(jst.getDate()).padStart(2, "0")}`;
}

export function TransactionEditModal({
  transaction,
  open,
  onOpenChange,
  suggestions = [],
}: Props) {
  const [isUpdatePending, startUpdateTransition] = useTransition();
  const [isDeletePending, startDeleteTransition] = useTransition();
  const [isArchivePending, startArchiveTransition] = useTransition();

  const [isLending, setIsLending] = useState(true);
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [dateMode, setDateMode] = useState<DateMode>("today");
  const [otherDate, setOtherDate] = useState(formatDateToJST());
  const [selectedTime, setSelectedTime] = useState(
    floorToNearest30(new Date()),
  );
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (transaction) {
      setIsLending(transaction.amount >= 0);
      setAmount(Math.abs(transaction.amount).toString());
      setDescription(transaction.description ?? "");
      setDateMode(initDateMode(transaction.date));
      setOtherDate(getDateString(transaction.date));
      setSelectedTime(floorToNearest30(transaction.date));
      setShowDeleteConfirm(false);
      setError(null);
    }
  }, [transaction]);

  const handleUpdate = () => {
    if (!transaction) return;
    const rawAmount = parseInt(amount, 10);
    if (isNaN(rawAmount) || rawAmount <= 0) {
      setError("金額を正しく入力してください");
      return;
    }
    const signedAmount = isLending ? rawAmount : -rawAmount;
    const date = buildDateTime(dateMode, otherDate, selectedTime);

    setError(null);
    startUpdateTransition(async () => {
      const formData = new FormData();
      formData.set("transactionId", transaction.id);
      formData.set("amount", signedAmount.toString());
      formData.set("description", description);
      formData.set("date", date.toISOString());

      const result = await updateTransaction({}, formData);
      if (result.error) {
        setError(result.error);
        return;
      }
      toast.success("取引を更新しました");
      onOpenChange(false);
    });
  };

  const handleDelete = () => {
    if (!transaction) return;
    startDeleteTransition(async () => {
      const result = await deleteTransaction(transaction.id);
      if (result.error) {
        setError(result.error);
        return;
      }
      toast.success("取引を削除しました");
      onOpenChange(false);
    });
  };

  const handleArchiveToggle = () => {
    if (!transaction) return;
    const action = transaction.isArchived
      ? unarchiveTransaction
      : archiveTransaction;
    startArchiveTransition(async () => {
      const result = await action(transaction.id);
      if (result.error) {
        setError(result.error);
        return;
      }
      toast.success(
        transaction.isArchived ? "アーカイブを解除しました" : "アーカイブしました",
      );
      onOpenChange(false);
    });
  };

  if (!transaction) return null;

  const isPending = isUpdatePending || isDeletePending || isArchivePending;

  return (
    <Dialog open={open} onOpenChange={(v) => !isPending && onOpenChange(v)}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>取引を編集</DialogTitle>
        </DialogHeader>

        {!showDeleteConfirm ? (
          <div className="space-y-5">
            {error && (
              <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
                {error}
              </div>
            )}

            {/* Partner (read-only) */}
            <div className="space-y-2">
              <Label>相手</Label>
              <p className="text-sm py-2 px-3 bg-muted rounded-md">
                {transaction.partnerName}
              </p>
            </div>

            <TransactionFormFields
              amount={amount}
              setAmount={setAmount}
              isLending={isLending}
              setIsLending={setIsLending}
              description={description}
              setDescription={setDescription}
              dateMode={dateMode}
              setDateMode={setDateMode}
              otherDate={otherDate}
              setOtherDate={setOtherDate}
              selectedTime={selectedTime}
              setSelectedTime={setSelectedTime}
              suggestions={suggestions}
              isPending={isPending}
              maxDate={formatDateToJST()}
            />

            {/* Actions */}
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setShowDeleteConfirm(true)}
                disabled={isPending}
                className="text-destructive hover:text-destructive shrink-0"
                aria-label="削除"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={handleArchiveToggle}
                disabled={isPending}
                className="shrink-0"
                aria-label={
                  transaction.isArchived ? "アーカイブ解除" : "アーカイブ"
                }
              >
                {isArchivePending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : transaction.isArchived ? (
                  <ArchiveRestore className="h-4 w-4" />
                ) : (
                  <Archive className="h-4 w-4" />
                )}
              </Button>
              <Button
                type="button"
                onClick={handleUpdate}
                className="flex-1"
                disabled={isPending || !amount}
              >
                {isUpdatePending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-1" />
                    更新中...
                  </>
                ) : (
                  "更新"
                )}
              </Button>
            </div>
          </div>
        ) : (
          <>
            <DialogDescription>
              この取引を削除しますか？この操作は取り消せません。
            </DialogDescription>

            {error && (
              <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
                {error}
              </div>
            )}

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeletePending}
              >
                キャンセル
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
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
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
