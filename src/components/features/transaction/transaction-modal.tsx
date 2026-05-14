"use client";

import { useState, useEffect, useTransition } from "react";
import { useForm, FormProvider } from "react-hook-form";
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  ResponsiveDialogBody,
  ResponsiveDialogFooter,
} from "@/components/ui/responsive-dialog";
import { FAB } from "@/components/layouts/fab";
import { LoadingButton } from "@/components/ui/loading-button";
import { TransactionFormFields } from "./transaction-form-fields";
import { PartnerPickerField } from "./partner-picker-field";
import { createTransaction } from "@/actions/transaction";
import {
  floorToNearest30,
  buildDateTime,
} from "@/lib/date-picker-utils";
import { formatDateToJST } from "@/lib/date-utils";
import { toast } from "sonner";
import type { Partner } from "@/actions/partner";
import type { TransactionFormValues } from "./transaction-form-schema";

type Props = {
  partners: Partner[];
  suggestions: string[];
  defaultPartnerId?: string;
};

export function TransactionModal({
  partners,
  suggestions,
  defaultPartnerId,
}: Props) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [partnerId, setPartnerId] = useState(defaultPartnerId ?? "");
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
    if (!open) return;
    setPartnerId(defaultPartnerId ?? "");
    setError(null);
    form.reset({
      amount: "",
      isLending: true,
      description: "",
      dateMode: "today",
      otherDate: formatDateToJST(),
      selectedTime: floorToNearest30(new Date()),
    });
  }, [open, defaultPartnerId, form]);

  // Keyboard shortcut: N to open modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (open) return;
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.tagName === "SELECT" ||
        target.isContentEditable
      )
        return;
      if (e.key === "n" || e.key === "N") setOpen(true);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  const handleSubmit = form.handleSubmit((data) => {
    if (!partnerId) {
      setError("相手を選択してください");
      return;
    }
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
      formData.set("partnerId", partnerId);
      formData.set("amount", signedAmount.toString());
      formData.set("description", data.description);
      formData.set("date", date.toISOString());

      const result = await createTransaction({}, formData);
      if (result.error) {
        setError(result.error);
        return;
      }
      toast.success("取引を登録しました");
      setOpen(false);
    });
  });

  return (
    <>
      <FAB id="transaction-fab" onClick={() => setOpen(true)} />
      <ResponsiveDialog open={open} onOpenChange={(v) => !isPending && setOpen(v)}>
        <ResponsiveDialogContent>
          <ResponsiveDialogHeader>
            <ResponsiveDialogTitle>新しい取引</ResponsiveDialogTitle>
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
                  partners={partners}
                  selectedId={partnerId}
                  onSelect={setPartnerId}
                  disabled={isPending}
                />

                <TransactionFormFields
                  suggestions={suggestions}
                  isPending={isPending}
                  maxDate={formatDateToJST()}
                />
              </div>
            </FormProvider>
          </ResponsiveDialogBody>

          <ResponsiveDialogFooter>
            <LoadingButton
              type="button"
              onClick={handleSubmit}
              className="w-full"
              loading={isPending}
              loadingText="登録中..."
              disabled={!partnerId || !form.watch("amount")}
            >
              登録
            </LoadingButton>
          </ResponsiveDialogFooter>
        </ResponsiveDialogContent>
      </ResponsiveDialog>
    </>
  );
}
