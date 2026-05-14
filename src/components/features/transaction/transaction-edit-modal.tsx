"use client";

import { useState, useEffect, useTransition } from "react";
import { useForm, FormProvider } from "react-hook-form";
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
import { LoadingButton } from "@/components/ui/loading-button";
import type { Partner } from "@/actions/partner";
import { toast } from "sonner";
import { TransactionFormFields } from "./transaction-form-fields";
import {
  floorToNearest30,
  buildDateTime,
  type DateMode,
} from "@/lib/date-picker-utils";
import { formatDateToJST, toJST } from "@/lib/date-utils";
import type { TransactionFormValues } from "./transaction-form-schema";

type Props = {
  transaction: TransactionWithPartner | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  suggestions?: string[];
  partners?: Partner[];
};

function initDateMode(date: Date): DateMode {
  const jst = toJST(date);
  const nowJst = toJST(new Date());
  const today = new Date(nowJst.getFullYear(), nowJst.getMonth(), nowJst.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const d = new Date(jst.getFullYear(), jst.getMonth(), jst.getDate());
  if (d.getTime() === today.getTime()) return "today";
  if (d.getTime() === yesterday.getTime()) return "yesterday";
  return "other";
}

function getDateString(date: Date): string {
  const jst = toJST(date);
  return `${jst.getFullYear()}-${String(jst.getMonth() + 1).padStart(2, "0")}-${String(jst.getDate()).padStart(2, "0")}`;
}

export function TransactionEditModal({
  transaction,
  open,
  onOpenChange,
  suggestions = [],
  partners = [],
}: Props) {
  const [isPending, startTransition] = useTransition();
  const [partnerId, setPartnerId] = useState("");
  const [error, setError] = useState<string | null>(null);

  const form = useForm<TransactionFormValues>({
    defaultValues: {
      amount: "",
      isLending: true,
      description: "",
      dateMode: "today",
      otherDate: formatDateToJST(),
      selectedTime: floorToNearest30(new Date()),
    },
  });

  useEffect(() => {
    if (transaction) {
      setPartnerId(transaction.partnerId);
      setError(null);
      form.reset({
        amount: Math.abs(transaction.amount).toString(),
        isLending: transaction.amount >= 0,
        description: transaction.description ?? "",
        dateMode: initDateMode(transaction.date),
        otherDate: getDateString(transaction.date),
        selectedTime: floorToNearest30(transaction.date),
      });
    }
  }, [transaction, form]);

  const handleUpdate = form.handleSubmit((data) => {
    if (!transaction) return;
    const rawAmount = parseInt(data.amount, 10);
    if (isNaN(rawAmount) || rawAmount <= 0) {
      setError("金額を正しく入力してください");
      return;
    }
    const signedAmount = data.isLending ? rawAmount : -rawAmount;
    const date = buildDateTime(data.dateMode, data.otherDate, data.selectedTime);

    setError(null);
    startTransition(async () => {
      const formData = new FormData();
      formData.set("transactionId", transaction.id);
      formData.set("partnerId", partnerId);
      formData.set("amount", signedAmount.toString());
      formData.set("description", data.description);
      formData.set("date", date.toISOString());

      const result = await updateTransaction({}, formData);
      if (result.error) {
        setError(result.error);
        return;
      }
      toast.success("取引を更新しました");
      onOpenChange(false);
    });
  });

  if (!transaction) return null;

  const currentInList = partners.some((p) => p.id === transaction.partnerId);
  const displayPartners = currentInList
    ? partners
    : [...partners, { id: transaction.partnerId, name: transaction.partnerName }];

  return (
    <Dialog open={open} onOpenChange={(v) => !isPending && onOpenChange(v)}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>取引を編集</DialogTitle>
        </DialogHeader>

        <FormProvider {...form}>
          <div className="space-y-5">
            {error && (
              <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
                {error}
              </div>
            )}

            {/* Partner */}
            <div className="space-y-2">
              <Label>相手</Label>
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
            </div>

            <TransactionFormFields
              suggestions={suggestions}
              isPending={isPending}
              maxDate={formatDateToJST()}
            />

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isPending}
                className="flex-1"
              >
                キャンセル
              </Button>
              <LoadingButton
                type="button"
                onClick={handleUpdate}
                className="flex-1"
                loading={isPending}
                loadingText="更新中..."
                disabled={!form.watch("amount")}
              >
                更新
              </LoadingButton>
            </div>
          </div>
        </FormProvider>
      </DialogContent>
    </Dialog>
  );
}
