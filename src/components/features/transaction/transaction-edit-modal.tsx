"use client";

import { useState, useEffect, useTransition, useCallback } from "react";
import { useForm, FormProvider, useWatch } from "react-hook-form";
import { updateTransaction } from "@/actions/transaction";
import type { TransactionWithPartner } from "@/actions/transaction";
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  ResponsiveDialogBody,
  ResponsiveDialogFooter,
} from "@/components/ui/responsive-dialog";
import { Button } from "@/components/ui/button";
import { LoadingButton } from "@/components/ui/loading-button";
import type { Partner } from "@/actions/partner";
import { toast } from "sonner";
import { TransactionFormFields } from "./transaction-form-fields";
import { PartnerPickerField } from "./partner-picker-field";
import { LedgerPickerField } from "./ledger-picker-field";
import {
  buildDateTime,
  toDateTimeLocalValue,
} from "@/lib/date-picker-utils";
import {
  transactionFormResolver,
  type TransactionFormValues,
} from "./transaction-form-schema";

type Props = {
  transaction: TransactionWithPartner | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  suggestions?: string[];
  partners?: Partner[];
};

export function TransactionEditModal({
  transaction,
  open,
  onOpenChange,
  suggestions = [],
  partners = [],
}: Props) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const form = useForm<TransactionFormValues>({
    resolver: transactionFormResolver,
    mode: "onSubmit",
    reValidateMode: "onChange",
    defaultValues: {
      partnerId: "",
      ledgerId: "",
      amount: "",
      isLending: true,
      purpose: "",
      description: "",
      dateMode: "custom",
      customDateTime: "",
    },
  });

  useEffect(() => {
    if (transaction) {
      setError(null);
      form.reset({
        partnerId: transaction.partnerId,
        ledgerId: transaction.ledgerId ?? "",
        amount: Math.abs(transaction.amount).toString(),
        isLending: transaction.amount >= 0,
        purpose: transaction.purpose ?? "",
        description: transaction.description ?? "",
        // 編集時は既存の日時を保つため、常に「日時を指定」で開く
        dateMode: "custom",
        customDateTime: toDateTimeLocalValue(transaction.date),
      });
    }
  }, [transaction, form]);

  const partnerId = useWatch({ control: form.control, name: "partnerId" });
  const ledgerId = useWatch({ control: form.control, name: "ledgerId" });
  const { setValue } = form;

  const handleSelectPartner = useCallback(
    (id: string) => {
      setValue("partnerId", id, { shouldValidate: true });
      setValue("ledgerId", "");
    },
    [setValue],
  );
  const handleSelectLedger = useCallback(
    (id: string) => setValue("ledgerId", id),
    [setValue],
  );

  const handleUpdate = form.handleSubmit((data) => {
    if (!transaction) return;
    const rawAmount = parseInt(data.amount, 10);
    const signedAmount = data.isLending ? rawAmount : -rawAmount;
    const date = buildDateTime(data.dateMode, data.customDateTime);

    setError(null);
    startTransition(async () => {
      const formData = new FormData();
      formData.set("transactionId", transaction.id);
      formData.set("partnerId", data.partnerId);
      if (data.ledgerId) formData.set("ledgerId", data.ledgerId);
      formData.set("amount", signedAmount.toString());
      formData.set("purpose", data.purpose);
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
    <ResponsiveDialog open={open} onOpenChange={(v) => !isPending && onOpenChange(v)}>
      <ResponsiveDialogContent>
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>取引を編集</ResponsiveDialogTitle>
        </ResponsiveDialogHeader>

        <ResponsiveDialogBody>
          <FormProvider {...form}>
            <div className="space-y-5 pb-2">
              {error && (
                <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
                  {error}
                </div>
              )}

              <PartnerPickerField
                partners={displayPartners}
                selectedId={partnerId}
                onSelect={handleSelectPartner}
                disabled={isPending}
              />

              <LedgerPickerField
                partnerId={partnerId}
                selectedId={ledgerId}
                onSelect={handleSelectLedger}
                disabled={isPending}
              />

              <TransactionFormFields
                suggestions={suggestions}
                isPending={isPending}
                showDateModeToggle={false}
              />
            </div>
          </FormProvider>
        </ResponsiveDialogBody>

        <ResponsiveDialogFooter>
          <div className="flex gap-2 w-full">
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
            >
              更新
            </LoadingButton>
          </div>
        </ResponsiveDialogFooter>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
