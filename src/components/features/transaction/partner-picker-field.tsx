"use client";

import { useFormContext } from "react-hook-form";
import { FieldLabel } from "@/components/ui/field-label";
import { cn } from "@/lib/utils";
import type { TransactionFormValues } from "./transaction-form-schema";

type PartnerOption = { id: string; name: string };

type Props = {
  partners: PartnerOption[];
  selectedId: string;
  onSelect: (id: string) => void;
  disabled?: boolean;
};

export function PartnerPickerField({
  partners,
  selectedId,
  onSelect,
  disabled = false,
}: Props) {
  const {
    formState: { errors },
  } = useFormContext<TransactionFormValues>();
  const error = errors.partnerId?.message;

  return (
    <div className="space-y-1.5">
      <FieldLabel required error={error}>
        相手
      </FieldLabel>
      {partners.length === 0 && (
        <p className="rounded-xl bg-muted px-3 py-2 text-sm text-muted-foreground">
          相手がまだいません。先にホームの「相手を追加」から登録してください。
        </p>
      )}
      <div
        className={cn(
          "grid gap-1.5 rounded-xl",
          partners.length > 4 ? "grid-cols-3" : "grid-cols-2",
          error && "ring-2 ring-destructive/40 ring-offset-2 ring-offset-background",
        )}
      >
        {partners.map((p) => {
          const isSelected = selectedId === p.id;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => onSelect(p.id)}
              disabled={disabled}
              className={cn(
                "px-3 py-2 rounded-xl border transition-all duration-150 active:scale-[0.98] text-sm font-medium truncate",
                isSelected
                  ? "bg-primary/10 border-primary/40 text-primary"
                  : "bg-muted border-transparent text-foreground/80 hover:bg-muted/80",
              )}
            >
              {p.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}
