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
import { cn } from "@/lib/utils";
import { createLedger } from "@/actions/ledger";
import {
  formatRate,
  formatWeeklyRate,
  MAX_ANNUAL_INTEREST_RATE,
  WEEKS_PER_YEAR,
} from "@/lib/ledger-interest";
import { toast } from "sonner";

type Props = {
  partnerId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

/** よく使う年利のプリセット（週利に直したときにキリのいい値） */
const RATE_PRESETS = [
  { label: "無利子", annual: 0 },
  { label: "週1%", annual: 1 * WEEKS_PER_YEAR },
  { label: "週3%", annual: 3 * WEEKS_PER_YEAR },
  { label: "週5%", annual: 5 * WEEKS_PER_YEAR },
] as const;

/**
 * 口座の追加ダイアログ。
 * 発生曜日や単利／複利などの細かい設定は、作成後に口座の設定ページで行う。
 */
export function LedgerFormDialog({ partnerId, open, onOpenChange }: Props) {
  const [title, setTitle] = useState("");
  const [rate, setRate] = useState("0");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (open) {
      setTitle("");
      setRate("0");
    }
  }, [open]);

  const trimmedTitle = title.trim();
  const parsedRate = Number(rate);
  const isRateValid =
    !Number.isNaN(parsedRate) &&
    parsedRate >= 0 &&
    parsedRate <= MAX_ANNUAL_INTEREST_RATE;
  const isValid =
    trimmedTitle.length >= 1 && trimmedTitle.length <= 30 && isRateValid;

  const handleSubmit = () => {
    if (!isValid || isPending) return;
    startTransition(async () => {
      const result = await createLedger(partnerId, {
        title: trimmedTitle,
        annualInterestRate: parsedRate,
      });

      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("口座を追加しました");
      onOpenChange(false);
    });
  };

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent>
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>口座を追加</ResponsiveDialogTitle>
        </ResponsiveDialogHeader>
        <ResponsiveDialogBody>
          <div className="space-y-4 pb-2">
            <div className="space-y-1.5">
              <Label htmlFor="ledger-title">口座名</Label>
              <Input
                id="ledger-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="例: 利子つき"
                maxLength={30}
                disabled={isPending}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="ledger-rate">年利（%）</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="ledger-rate"
                  type="number"
                  inputMode="decimal"
                  min={0}
                  max={MAX_ANNUAL_INTEREST_RATE}
                  step={1}
                  value={rate}
                  onChange={(e) => setRate(e.target.value)}
                  disabled={isPending}
                  className="flex-1"
                />
                <span className="text-sm text-muted-foreground shrink-0">％／年</span>
              </div>
              <p className="text-xs text-muted-foreground">
                {isRateValid && parsedRate > 0
                  ? `週に直すと ${formatWeeklyRate(parsedRate)}%。利息は毎週水曜日に発生します（作成後に変更できます）`
                  : "0 = 無利子"}
              </p>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {RATE_PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => setRate(String(preset.annual))}
                  disabled={isPending}
                  className={cn(
                    "text-xs px-2.5 py-1 rounded-full border transition-colors",
                    parsedRate === preset.annual
                      ? "border-foreground bg-foreground text-background"
                      : "border-border hover:bg-muted",
                  )}
                >
                  {preset.label}
                  {preset.annual > 0 && (
                    <span className="opacity-70">
                      （年{formatRate(preset.annual)}%）
                    </span>
                  )}
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
              追加
            </LoadingButton>
          </div>
        </ResponsiveDialogFooter>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
