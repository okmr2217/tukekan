"use client";

import { useState, useRef, useEffect } from "react";
import { useFormContext, Controller } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TIME_OPTIONS, type DateMode } from "@/lib/date-picker-utils";
import type { TransactionFormValues } from "./transaction-form-schema";

type Props = {
  suggestions: string[];
  isPending: boolean;
  maxDate: string;
};

const DATE_MODE_LABELS: Record<DateMode, string> = {
  today: "今日",
  yesterday: "昨日",
  other: "他の日",
};

export function TransactionFormFields({ suggestions, isPending, maxDate }: Props) {
  const { register, watch, control } = useFormContext<TransactionFormValues>();
  const [showDropdown, setShowDropdown] = useState(false);
  const memoWrapperRef = useRef<HTMLDivElement>(null);

  const description = watch("description");
  const isLending = watch("isLending");
  const dateMode = watch("dateMode");

  const filteredSuggestions =
    description.trim() === ""
      ? suggestions
      : suggestions.filter((s) =>
          s.toLowerCase().startsWith(description.toLowerCase()),
        );
  const visibleSuggestions = showDropdown ? filteredSuggestions : [];

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        memoWrapperRef.current &&
        !memoWrapperRef.current.contains(e.target as Node)
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
        <Label>金額</Label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            ¥
          </span>
          <Input
            type="number"
            inputMode="numeric"
            className="pl-7"
            placeholder="0"
            min={1}
            max={10000000}
            required
            disabled={isPending}
            {...register("amount")}
          />
        </div>
        <div className="flex gap-2">
          <Controller
            name="isLending"
            control={control}
            render={({ field }) => (
              <>
                <Button
                  type="button"
                  variant={isLending ? "default" : "outline"}
                  onClick={() => field.onChange(true)}
                  className="flex-1"
                  disabled={isPending}
                >
                  貸した
                </Button>
                <Button
                  type="button"
                  variant={!isLending ? "default" : "outline"}
                  onClick={() => field.onChange(false)}
                  className="flex-1"
                  disabled={isPending}
                >
                  借りた・返済
                </Button>
              </>
            )}
          />
        </div>
      </div>

      {/* Memo */}
      <div className="space-y-1.5">
        <Label>メモ（任意）</Label>
        <div ref={memoWrapperRef} className="relative">
          <Input
            placeholder="例: 麻雀、ランチ、返済"
            maxLength={100}
            disabled={isPending}
            {...register("description", {
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
                      register("description").onChange(event);
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
            {description.length}/100
          </span>
        </div>
      </div>

      {/* Date + Time */}
      <div className="space-y-1.5">
        <Label>日時</Label>

        {/* Date mode pills */}
        <Controller
          name="dateMode"
          control={control}
          render={({ field }) => (
            <div className="flex gap-2">
              {(["today", "yesterday", "other"] as DateMode[]).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => field.onChange(mode)}
                  disabled={isPending}
                  className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all active:scale-95 ${
                    dateMode === mode
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-secondary"
                  }`}
                >
                  {DATE_MODE_LABELS[mode]}
                </button>
              ))}
            </div>
          )}
        />

        {/* Date input for "other" */}
        {dateMode === "other" && (
          <Input
            type="date"
            max={maxDate}
            disabled={isPending}
            {...register("otherDate")}
          />
        )}

        {/* Time picker */}
        <Controller
          name="selectedTime"
          control={control}
          render={({ field }) => (
            <Select
              value={field.value}
              onValueChange={field.onChange}
              disabled={isPending}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TIME_OPTIONS.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      </div>
    </div>
  );
}
