"use client";

import { Label } from "@/components/ui/label";

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
  return (
    <div className="space-y-1.5">
      <Label>相手</Label>
      <div
        className={`grid gap-1.5 ${partners.length > 4 ? "grid-cols-3" : "grid-cols-2"}`}
      >
        {partners.map((p) => {
          const isSelected = selectedId === p.id;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => onSelect(p.id)}
              disabled={disabled}
              className={`px-3 py-2 rounded-xl border transition-all duration-150 active:scale-[0.98] text-sm font-medium truncate ${
                isSelected
                  ? "bg-primary/10 border-primary/40 text-primary"
                  : "bg-muted border-transparent text-foreground/80 hover:bg-muted/80"
              }`}
            >
              {p.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}
