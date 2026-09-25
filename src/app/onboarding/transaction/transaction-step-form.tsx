"use client";

import { useState, useTransition } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { toast } from "sonner";
import { createTransaction } from "@/actions/transaction";
import { completeOnboarding } from "@/actions/onboarding";
import { Button } from "@/components/ui/button";
import { LoadingButton } from "@/components/ui/loading-button";
import { TransactionFormFields } from "@/components/features/transaction/transaction-form-fields";
import { useTransactionLabels } from "@/components/features/transaction/transaction-label-preset-context";
import {
  transactionFormResolver,
  type TransactionFormValues,
} from "@/components/features/transaction/transaction-form-schema";
import { buildDateTime } from "@/lib/date-picker-utils";

type Props = {
  partner: { id: string; name: string };
  suggestions: string[];
};

/**
 * FAB の「新しい取引」と同じ入力欄。相手は前のステップで決まっているので選ばせず、
 * 口座は相手を作ったときにできる「通常」口座に入れる（ledgerId を送らない）。
 */
export function TransactionStepForm({ partner, suggestions }: Props) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const { defaultIsLending } = useTransactionLabels();

  const form = useForm<TransactionFormValues>({
    resolver: transactionFormResolver,
    mode: "onSubmit",
    reValidateMode: "onChange",
    defaultValues: {
      partnerId: partner.id,
      ledgerId: "",
      amount: "",
      isLending: defaultIsLending,
      purpose: "",
      description: "",
      dateMode: "now",
      customDateTime: "",
    },
  });

  const handleSubmit = form.handleSubmit((data) => {
    const rawAmount = parseInt(data.amount, 10);
    const signedAmount = data.isLending ? rawAmount : -rawAmount;
    const date = buildDateTime(data.dateMode, data.customDateTime);

    setError(null);
    startTransition(async () => {
      const formData = new FormData();
      formData.set("partnerId", partner.id);
      formData.set("amount", signedAmount.toString());
      formData.set("purpose", data.purpose);
      formData.set("description", data.description);
      formData.set("date", date.toISOString());

      const result = await createTransaction({}, formData);
      if (result.error) {
        setError(result.error);
        return;
      }
      toast.success("はじめての取引を記録しました");
      await completeOnboarding();
    });
  });

  const handleSkip = () => {
    startTransition(() => completeOnboarding());
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
          {error}
        </div>
      )}

      <div className="rounded-lg bg-muted px-3 py-2 text-sm">
        <span className="text-muted-foreground">相手: </span>
        <span className="font-medium">{partner.name}</span>
      </div>

      <FormProvider {...form}>
        <TransactionFormFields suggestions={suggestions} isPending={isPending} />
      </FormProvider>

      <div className="space-y-2">
        <LoadingButton
          type="submit"
          className="w-full"
          loading={isPending}
          loadingText="記録中..."
        >
          記録してはじめる
        </LoadingButton>
        <Button
          type="button"
          variant="ghost"
          className="w-full text-muted-foreground"
          disabled={isPending}
          onClick={handleSkip}
        >
          あとで記録する
        </Button>
      </div>
    </form>
  );
}
