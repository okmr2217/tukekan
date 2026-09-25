"use client";

import { cn } from "@/lib/utils";

type Props = {
  ledgers: { id: string; title: string }[];
  /** 絞り込み中の口座ID。空文字なら「すべて」 */
  activeLedgerId: string;
  /** null は「すべて」 */
  onChange: (ledgerId: string | null) => void;
};

/** 取引一覧の上に置く、口座で絞り込むチップ（相手ページ・公開ページで共通） */
export function LedgerFilterChips({
  ledgers,
  activeLedgerId,
  onChange,
}: Props) {
  return (
    <div className="-mx-4 px-4 flex gap-1.5 overflow-x-auto [scrollbar-width:none]">
      <Chip
        label="すべて"
        active={activeLedgerId === ""}
        onClick={() => onChange(null)}
      />
      {ledgers.map((ledger) => (
        <Chip
          key={ledger.id}
          label={ledger.title}
          active={ledger.id === activeLedgerId}
          onClick={() => onChange(ledger.id)}
        />
      ))}
    </div>
  );
}

function Chip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "shrink-0 max-w-40 truncate text-xs px-3 py-1.5 rounded-full border transition-colors",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-transparent text-muted-foreground hover:bg-muted hover:text-foreground",
      )}
    >
      {label}
    </button>
  );
}
