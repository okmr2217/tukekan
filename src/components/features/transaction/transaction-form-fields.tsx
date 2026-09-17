"use client";

import { useState, useRef, useEffect } from "react";
import { useFormContext, Controller } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { FieldLabel } from "@/components/ui/field-label";
import {
  formatHoursMinutes,
  toDateTimeLocalValue,
  type DateMode,
} from "@/lib/date-picker-utils";
import { cn } from "@/lib/utils";
import { useTransactionLabels } from "./transaction-label-preset-context";
import {
  MAX_AMOUNT,
  MAX_PURPOSE_LENGTH,
  MAX_DESCRIPTION_LENGTH,
  type TransactionFormValues,
} from "./transaction-form-schema";

type Props = {
  suggestions: string[];
  isPending: boolean;
  /**
   * 「現在 / 日時を指定」の切り替えピルを出すか。
   * 編集では既存の日時を直接直したいだけなので false にして input だけを出す。
   */
  showDateModeToggle?: boolean;
};

/**
 * 金額ボタンの色はアプリ共通の債権軸に揃える。
 *   + （自分の債権が増える / 貸した・返済した）= 緑
 *   - （自分の債務が増える / 借りた・返済された）= 赤
 * 取引カードや残高表示と同じ意味になるので、登録時と一覧で色が反転しない。
 */
const AMOUNT_SIDE_CLASSES = {
  lending: {
    selected:
      "bg-emerald-600 text-white border-emerald-600 dark:bg-emerald-600 dark:border-emerald-600",
    unselected:
      "bg-transparent border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-400 dark:hover:bg-emerald-950",
  },
  borrowing: {
    selected: "bg-red-600 text-white border-red-600 dark:bg-red-700 dark:border-red-700",
    unselected:
      "bg-transparent border-red-300 text-red-600 hover:bg-red-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950",
  },
} as const;

const AMOUNT_SIDE_BASE =
  "flex-1 rounded-md border px-3 py-2 text-sm font-medium transition-colors active:scale-95 disabled:pointer-events-none disabled:opacity-50";

export function TransactionFormFields({
  suggestions,
  isPending,
  showDateModeToggle = true,
}: Props) {
  const {
    register,
    watch,
    control,
    setValue,
    formState: { errors },
  } = useFormContext<TransactionFormValues>();
  const labels = useTransactionLabels();
  const [showDropdown, setShowDropdown] = useState(false);
  const purposeWrapperRef = useRef<HTMLDivElement>(null);

  const purpose = watch("purpose");
  const description = watch("description");
  const isLending = watch("isLending");
  const dateMode = watch("dateMode");
  const customDateTime = watch("customDateTime");

  // 「現在(HH:MM)」の表示と datetime-local の上限を実時間に追従させる
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 15_000);
    return () => clearInterval(timer);
  }, []);

  const showDateTimeInput = !showDateModeToggle || dateMode === "custom";

  const filteredSuggestions =
    purpose.trim() === ""
      ? suggestions
      : suggestions.filter((s) =>
          s.toLowerCase().startsWith(purpose.toLowerCase()),
        );
  const visibleSuggestions = showDropdown ? filteredSuggestions : [];

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        purposeWrapperRef.current &&
        !purposeWrapperRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="space-y-5">
      {/* Amount */}
      <div className="space-y-1.5">
        <FieldLabel htmlFor="transaction-amount" required error={errors.amount?.message}>
          金額
        </FieldLabel>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            ¥
          </span>
          <Input
            id="transaction-amount"
            type="number"
            inputMode="numeric"
            className="pl-7"
            placeholder="0"
            min={1}
            max={MAX_AMOUNT}
            disabled={isPending}
            aria-invalid={!!errors.amount}
            {...register("amount")}
          />
        </div>
        <div className="flex gap-2">
          <Controller
            name="isLending"
            control={control}
            render={({ field }) => (
              <>
                <button
                  type="button"
                  onClick={() => field.onChange(true)}
                  aria-pressed={isLending}
                  className={cn(
                    AMOUNT_SIDE_BASE,
                    isLending
                      ? AMOUNT_SIDE_CLASSES.lending.selected
                      : AMOUNT_SIDE_CLASSES.lending.unselected,
                  )}
                  disabled={isPending}
                >
                  {labels.lendingLabel}
                </button>
                <button
                  type="button"
                  onClick={() => field.onChange(false)}
                  aria-pressed={!isLending}
                  className={cn(
                    AMOUNT_SIDE_BASE,
                    !isLending
                      ? AMOUNT_SIDE_CLASSES.borrowing.selected
                      : AMOUNT_SIDE_CLASSES.borrowing.unselected,
                  )}
                  disabled={isPending}
                >
                  {labels.borrowingLabel}
                </button>
              </>
            )}
          />
        </div>
      </div>

      {/* Purpose */}
      <div className="space-y-1.5">
        <Label htmlFor="transaction-purpose">用途</Label>
        <div ref={purposeWrapperRef} className="relative">
          <Input
            id="transaction-purpose"
            placeholder="例: 麻雀、ランチ、返済"
            maxLength={MAX_PURPOSE_LENGTH}
            disabled={isPending}
            {...register("purpose", {
              onChange: () => setShowDropdown(true),
            })}
            onFocus={() => setShowDropdown(true)}
          />
          {visibleSuggestions.length > 0 && (
            <ul className="absolute left-0 right-0 top-full mt-1 z-50 bg-popover border border-border rounded-md shadow-md max-h-48 overflow-y-auto">
              {visibleSuggestions.map((s) => (
                <li key={s}>
                  <button
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      const event = { target: { value: s } } as React.ChangeEvent<HTMLInputElement>;
                      register("purpose").onChange(event);
                      setShowDropdown(false);
                    }}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors"
                  >
                    {s}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="flex justify-end">
          <span className="text-xs text-muted-foreground/60">
            {purpose.length}/{MAX_PURPOSE_LENGTH}
          </span>
        </div>
      </div>

      {/* Memo（詳細・複数行） */}
      <div className="space-y-1.5">
        <Label htmlFor="transaction-description">メモ</Label>
        <Textarea
          id="transaction-description"
          placeholder="詳細な内容を自由に記録できます（改行可）"
          rows={4}
          maxLength={MAX_DESCRIPTION_LENGTH}
          disabled={isPending}
          aria-invalid={!!errors.description}
          className="min-h-24 resize-y"
          {...register("description")}
        />
        <div className="flex justify-end">
          <span className="text-xs text-muted-foreground/60">
            {description.length}/{MAX_DESCRIPTION_LENGTH}
          </span>
        </div>
      </div>

      {/* Date + Time */}
      <div className="space-y-1.5">
        <FieldLabel error={errors.customDateTime?.message}>日時</FieldLabel>

        {showDateModeToggle && (
          <Controller
            name="dateMode"
            control={control}
            render={({ field }) => (
              <div className="flex gap-2">
                {(
                  [
                    ["now", `現在 (${formatHoursMinutes(now)})`],
                    ["custom", "日時を指定"],
                  ] as [DateMode, string][]
                ).map(([mode, label]) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => {
                      field.onChange(mode);
                      if (mode === "custom" && customDateTime === "") {
                        setValue("customDateTime", toDateTimeLocalValue(new Date()));
                      }
                    }}
                    disabled={isPending}
                    className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all active:scale-95 ${
                      dateMode === mode
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:bg-secondary"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}
          />
        )}

        {showDateTimeInput && (
          <Input
            type="datetime-local"
            max={toDateTimeLocalValue(now)}
            disabled={isPending}
            aria-invalid={!!errors.customDateTime}
            {...register("customDateTime")}
          />
        )}
      </div>
    </div>
  );
}
