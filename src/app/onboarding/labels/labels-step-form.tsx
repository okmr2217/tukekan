"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateTransactionLabelPreset } from "@/actions/auth";
import { LoadingButton } from "@/components/ui/loading-button";
import { TransactionLabelOptionButton } from "@/components/features/transaction/transaction-label-option-button";
import { ONBOARDING_PATHS } from "@/components/features/onboarding/onboarding-steps";
import {
  TRANSACTION_LABEL_OPTIONS,
  type TransactionLabelPreset,
} from "@/lib/transaction-labels";

export function LabelsStepForm({
  defaultPreset,
}: {
  defaultPreset: TransactionLabelPreset;
}) {
  const router = useRouter();
  const [selected, setSelected] = useState(defaultPreset);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleNext = () => {
    setError(null);
    startTransition(async () => {
      if (selected !== defaultPreset) {
        const result = await updateTransactionLabelPreset(selected);
        if (result.error) {
          setError(result.error);
          return;
        }
      }
      router.push(ONBOARDING_PATHS.partner);
    });
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
          {error}
        </div>
      )}
      <div className="space-y-2">
        {TRANSACTION_LABEL_OPTIONS.map((option) => (
          <TransactionLabelOptionButton
            key={option.value}
            option={option}
            selected={selected === option.value}
            disabled={isPending}
            onSelect={() => setSelected(option.value)}
          />
        ))}
      </div>
      <LoadingButton
        type="button"
        className="w-full"
        onClick={handleNext}
        loading={isPending}
        loadingText="保存中..."
      >
        次へ
      </LoadingButton>
    </div>
  );
}
