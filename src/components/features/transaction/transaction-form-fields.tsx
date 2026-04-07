"use client";

import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TIME_OPTIONS, type DateMode } from "@/lib/date-picker-utils";

type Props = {
  amount: string;
  setAmount: (v: string) => void;
  isLending: boolean;
  setIsLending: (v: boolean) => void;
  description: string;
  setDescription: (v: string) => void;
  dateMode: DateMode;
  setDateMode: (v: DateMode) => void;
  otherDate: string;
  setOtherDate: (v: string) => void;
  selectedTime: string;
  setSelectedTime: (v: string) => void;
  suggestions: string[];
  isPending: boolean;
  maxDate: string;
};

const DATE_MODE_LABELS: Record<DateMode, string> = {
  today: "今日",
  yesterday: "昨日",
  other: "他の日",
};

export function TransactionFormFields({
  amount,
  setAmount,
  isLending,
  setIsLending,
  description,
  setDescription,
  dateMode,
  setDateMode,
  otherDate,
  setOtherDate,
  selectedTime,
  setSelectedTime,
  suggestions,
  isPending,
  maxDate,
}: Props) {
  return (
    <div className="space-y-5">
      {/* Amount */}
      <div className="space-y-2">
        <Label>金額</Label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            ¥
          </span>
          <Input
            type="number"
            inputMode="numeric"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="pl-7"
            placeholder="0"
            min={1}
            max={10000000}
            required
            disabled={isPending}
          />
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            variant={isLending ? "default" : "outline"}
            onClick={() => setIsLending(true)}
            className="flex-1"
            disabled={isPending}
          >
            貸した
          </Button>
          <Button
            type="button"
            variant={!isLending ? "default" : "outline"}
            onClick={() => setIsLending(false)}
            className="flex-1"
            disabled={isPending}
          >
            借りた・返済
          </Button>
        </div>
      </div>

      {/* Memo */}
      <div className="space-y-2">
        <Label>メモ（任意）</Label>
        <Input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="例: 麻雀、ランチ、返済"
          maxLength={100}
          disabled={isPending}
        />
        <div className="flex justify-end">
          <span className="text-xs text-muted-foreground/60">
            {description.length}/100
          </span>
        </div>
        {suggestions.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {suggestions.map((s) => (
              <Button
                key={s}
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setDescription(s)}
                className="h-7 text-xs"
                disabled={isPending}
              >
                {s}
              </Button>
            ))}
          </div>
        )}
      </div>

      {/* Date + Time */}
      <div className="space-y-2">
        <Label>日時</Label>

        {/* Date mode pills */}
        <div className="flex gap-2">
          {(["today", "yesterday", "other"] as DateMode[]).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setDateMode(mode)}
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

        {/* Date input for "other" */}
        {dateMode === "other" && (
          <Input
            type="date"
            value={otherDate}
            onChange={(e) => setOtherDate(e.target.value)}
            max={maxDate}
            disabled={isPending}
          />
        )}

        {/* Time picker */}
        <div className="relative">
          <select
            value={selectedTime}
            onChange={(e) => setSelectedTime(e.target.value)}
            disabled={isPending}
            className="w-full appearance-none bg-muted rounded-lg px-3 py-2.5 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 cursor-pointer border border-border"
          >
            {TIME_OPTIONS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        </div>
      </div>
    </div>
  );
}
