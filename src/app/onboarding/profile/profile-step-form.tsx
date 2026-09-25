"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateProfile } from "@/actions/auth";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoadingButton } from "@/components/ui/loading-button";
import { ONBOARDING_PATHS } from "@/components/features/onboarding/onboarding-steps";

export function ProfileStepForm({ defaultName }: { defaultName: string }) {
  const router = useRouter();
  const [name, setName] = useState(defaultName);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const formData = new FormData();
      formData.set("name", name.trim());
      const result = await updateProfile({}, formData);
      if (result.error) {
        setError(result.error);
        return;
      }
      router.push(ONBOARDING_PATHS.labels);
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
          {error}
        </div>
      )}
      <div className="space-y-1.5">
        <Label htmlFor="onboarding-name">表示名</Label>
        <Input
          id="onboarding-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="山田 太郎"
          autoComplete="name"
          maxLength={20}
          disabled={isPending}
          autoFocus
        />
      </div>
      <LoadingButton
        type="submit"
        className="w-full"
        loading={isPending}
        loadingText="保存中..."
        disabled={!name.trim()}
      >
        次へ
      </LoadingButton>
    </form>
  );
}
