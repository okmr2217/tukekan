"use client";

import { useState, useEffect, useTransition } from "react";
import { updateTransaction } from "@/actions/transaction";
import type { TransactionWithPartner } from "@/actions/transaction";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import type { Partner } from "@/actions/partner";
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
  partners?: Partner[];
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
  partners = [],
}: Props) {
  const [isUpdatePending, startUpdateTransition] = useTransition();

  const [partnerId, setPartnerId] = useState("");
  const [isLending, setIsLending] = useState(true);
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [dateMode, setDateMode] = useState<DateMode>("today");
  const [otherDate, setOtherDate] = useState(formatDateToJST());
  const [selectedTime, setSelectedTime] = useState(
    floorToNearest30(new Date()),
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (transaction) {
      setPartnerId(transaction.partnerId);
      setIsLending(transaction.amount >= 0);
      setAmount(Math.abs(transaction.amount).toString());
      setDescription(transaction.description ?? "");
      setDateMode(initDateMode(transaction.date));
      setOtherDate(getDateString(transaction.date));
      setSelectedTime(floorToNearest30(transaction.date));
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
      formData.set("partnerId", partnerId);
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

  if (!transaction) return null;

  const isPending = isUpdatePending;

  return (
    <Dialog open={open} onOpenChange={(v) => !isPending && onOpenChange(v)}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>取引を編集</DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
            {error && (
              <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
                {error}
              </div>
            )}

            {/* Partner */}
            <div className="space-y-2">
              <Label>相手</Label>
              {(() => {
                const currentInList = partners.some(
                  (p) => p.id === transaction.partnerId,
                );
                const displayPartners = currentInList
                  ? partners
                  : [
                      ...partners,
                      {
                        id: transaction.partnerId,
                        name: transaction.partnerName,
                      },
                    ];
                return (
                  <div
                    className={`grid gap-1.5 ${displayPartners.length > 4 ? "grid-cols-3" : "grid-cols-2"}`}
                  >
                    {displayPartners.map((p) => {
                      const isSelected = partnerId === p.id;
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => setPartnerId(p.id)}
                          disabled={isPending}
                          className={`px-3 py-2 rounded-xl border transition-all duration-150 active:scale-[0.98] text-sm font-medium truncate ${
                            isSelected
                              ? "bg-primary/10 border-primary/40 text-primary"
                              : "bg-muted border-transparent text-foreground/80 hover:bg-muted/80"
                          }`}
                        >
                          {p.name}
                        </button>
                      );
                    })}
                  </div>
                );
              })()}
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

            <Button
              type="button"
              onClick={handleUpdate}
              className="w-full"
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
      </DialogContent>
    </Dialog>
  );
}
