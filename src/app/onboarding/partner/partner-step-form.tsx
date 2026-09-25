"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createPartner, type Partner } from "@/actions/partner";
import { completeOnboarding } from "@/actions/onboarding";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoadingButton } from "@/components/ui/loading-button";
import { ONBOARDING_PATHS } from "@/components/features/onboarding/onboarding-steps";

function transactionStepHref(partnerId: string) {
  return `${ONBOARDING_PATHS.transaction}?partner=${encodeURIComponent(partnerId)}`;
}

export function PartnerStepForm({
  existingPartner,
}: {
  existingPartner: Partner | null;
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const formData = new FormData();
      formData.set("name", name.trim());
      const result = await createPartner({}, formData);
      if (result.error || !result.partner) {
        setError(result.error ?? "相手を登録できませんでした");
        return;
      }
      router.push(transactionStepHref(result.partner.id));
    });
  };

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
      <div className="space-y-1.5">
        <Label htmlFor="onboarding-partner-name">相手の名前</Label>
        <Input
          id="onboarding-partner-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="例: たろう"
          maxLength={50}
          disabled={isPending}
          autoFocus
        />
      </div>

      <div className="space-y-2">
        <LoadingButton
          type="submit"
          className="w-full"
          loading={isPending}
          loadingText="登録中..."
          disabled={!name.trim()}
        >
          登録して次へ
        </LoadingButton>
        {existingPartner && (
          <Button
            type="button"
            variant="outline"
            className="w-full"
            disabled={isPending}
            onClick={() => router.push(transactionStepHref(existingPartner.id))}
          >
            登録済みの「{existingPartner.name}」で続ける
          </Button>
        )}
        <Button
          type="button"
          variant="ghost"
          className="w-full text-muted-foreground"
          disabled={isPending}
          onClick={handleSkip}
        >
          あとで登録する
        </Button>
      </div>
    </form>
  );
}
