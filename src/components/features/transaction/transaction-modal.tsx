"use client";

import { useState, useEffect, useTransition, useCallback } from "react";
import { useForm, FormProvider, useWatch } from "react-hook-form";
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
import { useTransactionLabels } from "./transaction-label-preset-context";
import { PartnerPickerField } from "./partner-picker-field";
import { LedgerPickerField } from "./ledger-picker-field";
import { createTransaction } from "@/actions/transaction";
import {
  floorToNearest30,
  buildDateTime,
} from "@/lib/date-picker-utils";
import { formatDateToJST } from "@/lib/date-utils";
import { toast } from "sonner";
import type { Partner } from "@/actions/partner";
import {
  transactionFormResolver,
  type TransactionFormValues,
} from "./transaction-form-schema";

type Props = {
  partners: Partner[];
  suggestions: string[];
  defaultPartnerId?: string;
  defaultLedgerId?: string;
};

export function TransactionModal({
  partners,
  suggestions,
  defaultPartnerId,
  defaultLedgerId,
}: Props) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  // 初期選択はプリセット次第（よく借りる人は「借りた」側から始まる）
  const { defaultIsLending } = useTransactionLabels();

  const form = useForm<TransactionFormValues>({
    resolver: transactionFormResolver,
    mode: "onSubmit",
    reValidateMode: "onChange",
    defaultValues: {
      partnerId: defaultPartnerId ?? "",
      ledgerId: defaultLedgerId ?? "",
      amount: "",
      isLending: defaultIsLending,
      purpose: "",
      description: "",
      dateMode: "today",
      otherDate: formatDateToJST(),
      selectedTime: floorToNearest30(new Date()),
    },
  });

  useEffect(() => {
    if (!open) return;
    setError(null);
    form.reset({
      partnerId: defaultPartnerId ?? "",
      ledgerId: defaultLedgerId ?? "",
      amount: "",
      isLending: defaultIsLending,
      purpose: "",
      description: "",
      dateMode: "today",
      otherDate: formatDateToJST(),
      selectedTime: floorToNearest30(new Date()),
    });
  }, [open, defaultPartnerId, defaultLedgerId, defaultIsLending, form]);

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

  const handleSubmit = form.handleSubmit((data) => {
    const rawAmount = parseInt(data.amount, 10);
    const signedAmount = data.isLending ? rawAmount : -rawAmount;
    const date = buildDateTime(data.dateMode, data.otherDate, data.selectedTime);

    setError(null);
    startTransition(async () => {
      const formData = new FormData();
      formData.set("partnerId", data.partnerId);
      if (data.ledgerId) formData.set("ledgerId", data.ledgerId);
      formData.set("amount", signedAmount.toString());
      formData.set("purpose", data.purpose);
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
            >
              登録
            </LoadingButton>
          </ResponsiveDialogFooter>
        </ResponsiveDialogContent>
      </ResponsiveDialog>
    </>
  );
}
