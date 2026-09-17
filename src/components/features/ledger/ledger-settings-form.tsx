"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CalendarClock, Percent, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { LoadingButton } from "@/components/ui/loading-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DeleteConfirmDialog } from "@/components/ui/delete-confirm-dialog";
import { updateLedger, deleteLedger, type LedgerById } from "@/actions/ledger";
import {
  describeInterestRule,
  formatRate,
  formatWeeklyRate,
  getNextInterestPreview,
  INTEREST_REPAYMENT_RULE_TEXT,
  MAX_ANNUAL_INTEREST_RATE,
  WEEKDAY_LABELS,
  WEEKS_PER_YEAR,
} from "@/lib/ledger-interest";
import { formatDateForDisplay } from "@/lib/date-utils";

type Props = {
  ledger: LedgerById;
};

/** よく使う年利のプリセット（週利に直したときにキリのいい値） */
const RATE_PRESETS = [
  { label: "無利子", annual: 0 },
  { label: "週1%", annual: 1 * WEEKS_PER_YEAR },
  { label: "週3%", annual: 3 * WEEKS_PER_YEAR },
  { label: "週5%", annual: 5 * WEEKS_PER_YEAR },
] as const;

export function LedgerSettingsForm({ ledger }: Props) {
  const router = useRouter();

  const [title, setTitle] = useState(ledger.title);
  const [rate, setRate] = useState(String(ledger.annualInterestRate));
  const [weekday, setWeekday] = useState(ledger.interestAccrualWeekday);
  const [compounding, setCompounding] = useState(ledger.interestCompounding);
  const [isPending, startTransition] = useTransition();

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isDeletePending, startDeleteTransition] = useTransition();

  const trimmedTitle = title.trim();
  const parsedRate = Number(rate);
  const isRateValid =
    !Number.isNaN(parsedRate) &&
    parsedRate >= 0 &&
    parsedRate <= MAX_ANNUAL_INTEREST_RATE;
  const isValid =
    trimmedTitle.length >= 1 && trimmedTitle.length <= 30 && isRateValid;

  // 入力中の値でそのままプレビューする
  const draftSettings = {
    annualInterestRate: isRateValid ? parsedRate : 0,
    interestAccrualWeekday: weekday,
    interestCompounding: compounding,
  };
  const preview = getNextInterestPreview(ledger.breakdown, draftSettings);
  const hasInterest = draftSettings.annualInterestRate > 0;

  const handleSubmit = () => {
    if (!isValid || isPending) return;
    startTransition(async () => {
      const result = await updateLedger(ledger.id, {
        title: trimmedTitle,
        annualInterestRate: parsedRate,
        interestAccrualWeekday: weekday,
        interestCompounding: compounding,
      });
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("口座の設定を保存しました");
      router.refresh();
    });
  };

  const handleDelete = () => {
    startDeleteTransition(async () => {
      const result = await deleteLedger(ledger.id);
      if (result.error) {
        toast.error(result.error);
        setDeleteOpen(false);
        return;
      }
      toast.success("口座を削除しました");
      router.push(`/partners/${ledger.partnerId}`);
    });
  };

  return (
    <div className="space-y-4">
      {/* 利子のルール説明 */}
      <div
        className={cn(
          "rounded-xl border px-4 py-3.5 space-y-2",
          hasInterest
            ? "border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/40"
            : "border-border bg-muted/40",
        )}
      >
        <p className="text-sm font-medium leading-relaxed">
          {describeInterestRule(draftSettings)}
        </p>
        {hasInterest && (
          <>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {INTEREST_REPAYMENT_RULE_TEXT}
            </p>
            <div className="rounded-lg bg-background/70 px-3 py-2 text-xs space-y-1">
              <p className="flex items-center justify-between gap-2">
                <span className="text-muted-foreground">
                  {compounding ? "元本＋未払利息" : "元本"}
                </span>
                <span className="tabular-nums font-medium">
                  ¥{preview.base.toLocaleString()}
                </span>
              </p>
              <p className="flex items-center justify-between gap-2">
                <span className="text-muted-foreground">
                  次回（{formatDateForDisplay(preview.nextDate)}）
                </span>
                <span
                  className={cn(
                    "tabular-nums font-semibold",
                    preview.isEligible
                      ? "text-amber-600 dark:text-amber-400"
                      : "text-muted-foreground",
                  )}
                >
                  {preview.isEligible
                    ? `+¥${preview.amount.toLocaleString()}`
                    : "発生なし"}
                </span>
              </p>
            </div>
            {!preview.isEligible && (
              <p className="text-xs text-muted-foreground">
                残高がプラス（相手に貸している状態）のときだけ利息が発生します。
              </p>
            )}
          </>
        )}
      </div>

      {/* 口座名 */}
      <div className="rounded-xl border bg-card px-4 py-4 shadow-sm space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="ledger-title">口座名</Label>
          <Input
            id="ledger-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="例: 通常"
            maxLength={30}
            disabled={isPending}
          />
        </div>
      </div>

      {/* 年利 */}
      <div className="rounded-xl border bg-card px-4 py-4 shadow-sm space-y-3">
        <div className="flex items-center gap-1.5">
          <Percent className="size-3.5 text-muted-foreground" />
          <p className="text-sm font-medium">年利</p>
        </div>
        <div className="space-y-1.5">
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
            {isRateValid
              ? parsedRate > 0
                ? `週に直すと ${formatWeeklyRate(parsedRate)}%（年利 ÷ ${WEEKS_PER_YEAR}週）`
                : "0 = 無利子"
              : `0〜${MAX_ANNUAL_INTEREST_RATE.toLocaleString()}% の範囲で入力してください`}
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
                <span className="opacity-70">（年{formatRate(preset.annual)}%）</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* 発生曜日 */}
      <div className="rounded-xl border bg-card px-4 py-4 shadow-sm space-y-3">
        <div className="flex items-center gap-1.5">
          <CalendarClock className="size-3.5 text-muted-foreground" />
          <p className="text-sm font-medium">利息が発生する曜日</p>
        </div>
        <div className="grid grid-cols-7 gap-1">
          {WEEKDAY_LABELS.map((label, index) => (
            <button
              key={label}
              type="button"
              onClick={() => setWeekday(index)}
              disabled={isPending}
              aria-pressed={weekday === index}
              className={cn(
                "py-2 rounded-lg border text-sm transition-colors",
                weekday === index
                  ? "border-foreground bg-foreground text-background font-semibold"
                  : "border-border hover:bg-muted",
              )}
            >
              {label}
            </button>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          毎週この曜日の朝9時（日本時間）に、その時点の残高から利息を計算します。
        </p>
      </div>

      {/* 単利 / 複利 */}
      <div className="rounded-xl border bg-card px-4 py-4 shadow-sm space-y-3">
        <div className="flex items-center gap-1.5">
          <TrendingUp className="size-3.5 text-muted-foreground" />
          <p className="text-sm font-medium">利息のかかり方</p>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {[
            {
              value: false,
              title: "単利",
              hint: "元本にだけ利息がつく",
            },
            {
              value: true,
              title: "複利",
              hint: "元本＋未払利息に利息がつく",
            },
          ].map((option) => (
            <button
              key={option.title}
              type="button"
              onClick={() => setCompounding(option.value)}
              disabled={isPending}
              aria-pressed={compounding === option.value}
              className={cn(
                "rounded-lg border px-3 py-2.5 text-left transition-colors",
                compounding === option.value
                  ? "border-foreground bg-muted"
                  : "border-border hover:bg-muted/50",
              )}
            >
              <p className="text-sm font-medium">{option.title}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
                {option.hint}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* 現在の内訳 */}
      <div className="rounded-xl border bg-card px-4 py-4 shadow-sm space-y-2">
        <p className="text-sm font-medium">現在の残高の内訳</p>
        <dl className="text-sm space-y-1">
          <div className="flex items-center justify-between gap-2">
            <dt className="text-muted-foreground">元本</dt>
            <dd className="tabular-nums">
              ¥{ledger.breakdown.principal.toLocaleString()}
            </dd>
          </div>
          <div className="flex items-center justify-between gap-2">
            <dt className="text-muted-foreground">未払利息</dt>
            <dd className="tabular-nums">
              ¥{ledger.breakdown.unpaidInterest.toLocaleString()}
            </dd>
          </div>
          <div className="flex items-center justify-between gap-2 border-t pt-1 font-medium">
            <dt>合計</dt>
            <dd className="tabular-nums">¥{ledger.breakdown.total.toLocaleString()}</dd>
          </div>
        </dl>
        <p className="text-xs text-muted-foreground leading-relaxed">
          返済を記録すると、まず「未払利息」から減っていきます。未払利息が0になってから、
          元本が減ります。
        </p>
      </div>

      <LoadingButton
        type="button"
        onClick={handleSubmit}
        disabled={!isValid}
        loading={isPending}
        loadingText="保存中..."
        className="w-full"
      >
        保存
      </LoadingButton>

      {/* 削除 */}
      <div className="rounded-xl border border-destructive/30 bg-card px-4 py-4 shadow-sm space-y-2">
        <p className="text-sm font-medium text-destructive">削除</p>
        <p className="text-xs text-muted-foreground">
          取引が1件でも記録されている口座、および最後の1つの口座は削除できません。
        </p>
        <Button
          variant="destructive"
          size="sm"
          className="w-full"
          onClick={() => setDeleteOpen(true)}
        >
          この口座を削除
        </Button>
      </div>

      <DeleteConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="口座を削除しますか？"
        description="この操作は取り消せません。"
        onConfirm={handleDelete}
        isPending={isDeletePending}
      />
    </div>
  );
}
