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
import { INTEREST_TIER_THRESHOLD } from "@/lib/ledger-interest";
import { toast } from "sonner";

type LedgerEditable = {
  id: string;
  title: string;
  weeklyInterestRateUnder5000: number;
  weeklyInterestRateFrom5000: number;
};

type Props = {
  partnerId: string;
  ledger?: LedgerEditable;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const RATE_PRESETS = [
  { label: "無利子", under5000: 0, from5000: 0 },
  {
    label: "標準（5,000円未満は週5%・5,000円以上は週4%）",
    under5000: 5,
    from5000: 4,
  },
] as const;

export function LedgerFormDialog({ partnerId, ledger, open, onOpenChange }: Props) {
  const [title, setTitle] = useState(ledger?.title ?? "");
  const [rateUnder5000, setRateUnder5000] = useState(
    String(ledger?.weeklyInterestRateUnder5000 ?? 0),
  );
  const [rateFrom5000, setRateFrom5000] = useState(
    String(ledger?.weeklyInterestRateFrom5000 ?? 0),
  );
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (open) {
      setTitle(ledger?.title ?? "");
      setRateUnder5000(String(ledger?.weeklyInterestRateUnder5000 ?? 0));
      setRateFrom5000(String(ledger?.weeklyInterestRateFrom5000 ?? 0));
    }
  }, [open, ledger]);

  const trimmedTitle = title.trim();
  const parsedRateUnder5000 = Number(rateUnder5000);
  const parsedRateFrom5000 = Number(rateFrom5000);
  const isRateValid = (v: number) => !Number.isNaN(v) && v >= 0 && v <= 100;
  const isValid =
    trimmedTitle.length >= 1 &&
    trimmedTitle.length <= 30 &&
    isRateValid(parsedRateUnder5000) &&
    isRateValid(parsedRateFrom5000);

  const handleSubmit = () => {
    if (!isValid || isPending) return;
    startTransition(async () => {
      const input = {
        title: trimmedTitle,
        weeklyInterestRateUnder5000: parsedRateUnder5000,
        weeklyInterestRateFrom5000: parsedRateFrom5000,
      };
      const result = ledger
        ? await updateLedger(ledger.id, input)
        : await createLedger(partnerId, input);

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

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="ledger-rate-under">
                  週利率（%）
                  <span className="block text-[11px] font-normal text-muted-foreground">
                    残高{INTEREST_TIER_THRESHOLD.toLocaleString()}円未満
                  </span>
                </Label>
                <Input
                  id="ledger-rate-under"
                  type="number"
                  inputMode="decimal"
                  min={0}
                  max={100}
                  step={0.1}
                  value={rateUnder5000}
                  onChange={(e) => setRateUnder5000(e.target.value)}
                  disabled={isPending}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ledger-rate-from">
                  週利率（%）
                  <span className="block text-[11px] font-normal text-muted-foreground">
                    残高{INTEREST_TIER_THRESHOLD.toLocaleString()}円以上
                  </span>
                </Label>
                <Input
                  id="ledger-rate-from"
                  type="number"
                  inputMode="decimal"
                  min={0}
                  max={100}
                  step={0.1}
                  value={rateFrom5000}
                  onChange={(e) => setRateFrom5000(e.target.value)}
                  disabled={isPending}
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground -mt-2">
              いずれも0 = 無利子。残高帯に応じて自動で切り替わり、毎週水曜日に計算される。
            </p>

            <div className="flex flex-wrap gap-1.5">
              {RATE_PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => {
                    setRateUnder5000(String(preset.under5000));
                    setRateFrom5000(String(preset.from5000));
                  }}
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
