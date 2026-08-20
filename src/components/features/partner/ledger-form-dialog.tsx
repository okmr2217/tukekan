"use client";

import { useState, useTransition, useEffect } from "react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createLedger, updateLedger } from "@/actions/ledger";
import { toast } from "sonner";

type LedgerEditable = {
  id: string;
  title: string;
  weeklyInterestRate: number;
};

type Props = {
  partnerId: string;
  ledger?: LedgerEditable;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const RATE_PRESETS = [
  { label: "無利子", value: 0 },
  { label: "週4%（5,000円/7日=200円相当）", value: 4 },
  { label: "週5%（1,000円/7日=50円相当）", value: 5 },
] as const;

export function LedgerFormDialog({ partnerId, ledger, open, onOpenChange }: Props) {
  const [title, setTitle] = useState(ledger?.title ?? "");
  const [rate, setRate] = useState(String(ledger?.weeklyInterestRate ?? 0));
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (open) {
      setTitle(ledger?.title ?? "");
      setRate(String(ledger?.weeklyInterestRate ?? 0));
    }
  }, [open, ledger]);

  const trimmedTitle = title.trim();
  const parsedRate = Number(rate);
  const isValid =
    trimmedTitle.length >= 1 &&
    trimmedTitle.length <= 30 &&
    !Number.isNaN(parsedRate) &&
    parsedRate >= 0 &&
    parsedRate <= 100;

  const handleSubmit = () => {
    if (!isValid || isPending) return;
    startTransition(async () => {
      const result = ledger
        ? await updateLedger(ledger.id, { title: trimmedTitle, weeklyInterestRate: parsedRate })
        : await createLedger(partnerId, { title: trimmedTitle, weeklyInterestRate: parsedRate });

      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success(ledger ? "口座を更新しました" : "口座を追加しました");
      onOpenChange(false);
    });
  };

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent>
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>{ledger ? "口座を編集" : "口座を追加"}</ResponsiveDialogTitle>
        </ResponsiveDialogHeader>
        <ResponsiveDialogBody>
          <div className="space-y-4 pb-2">
            <div className="space-y-1.5">
              <Label htmlFor="ledger-title">口座名</Label>
              <Input
                id="ledger-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="例: 5000円貸しパターン"
                maxLength={30}
                disabled={isPending}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="ledger-rate">週利率（%）</Label>
              <Input
                id="ledger-rate"
                type="number"
                inputMode="decimal"
                min={0}
                max={100}
                step={0.1}
                value={rate}
                onChange={(e) => setRate(e.target.value)}
                disabled={isPending}
              />
              <p className="text-xs text-muted-foreground">
                0 = 無利子。残高に対して毎週水曜日に自動計算される。
              </p>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {RATE_PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => setRate(String(preset.value))}
                  className="text-xs px-2.5 py-1 rounded-full border border-border hover:bg-muted transition-colors"
                  disabled={isPending}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>
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
              onClick={handleSubmit}
              disabled={!isValid}
              loading={isPending}
              loadingText="保存中..."
              className="flex-1"
            >
              保存
            </LoadingButton>
          </div>
        </ResponsiveDialogFooter>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
