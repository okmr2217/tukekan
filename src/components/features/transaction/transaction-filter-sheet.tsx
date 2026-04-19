"use client";

import { useState, useEffect } from "react";
import {
  parseAsString,
  parseAsArrayOf,
  parseAsStringLiteral,
  useQueryStates,
} from "nuqs";
import { SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { Partner } from "@/actions/partner";
import type { SortOrder } from "@/actions/transaction";

const SORT_OPTIONS: { value: SortOrder; label: string }[] = [
  { value: "date_desc", label: "日時：新しい順" },
  { value: "date_asc", label: "日時：古い順" },
  { value: "amount_desc", label: "金額：高い順" },
  { value: "amount_asc", label: "金額：低い順" },
];

export const transactionFilterParsers = {
  q: parseAsString.withDefault(""),
  partnerIds: parseAsArrayOf(parseAsString).withDefault([]),
  sortOrder: parseAsStringLiteral([
    "date_desc",
    "date_asc",
    "amount_desc",
    "amount_asc",
  ] as const).withDefault("date_desc"),
};

type Props = {
  partners: Partner[];
};

function FilterForm({
  partners,
  onApply,
  onClose,
}: {
  partners: Partner[];
  onApply: () => void;
  onClose: () => void;
}) {
  const [committed, setCommitted] = useQueryStates(transactionFilterParsers, {
    shallow: false,
  });

  const [draft, setDraft] = useState(committed);

  useEffect(() => {
    setDraft(committed);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const activePartners = partners;

  const togglePartner = (id: string) => {
    setDraft((prev) => ({
      ...prev,
      partnerIds: prev.partnerIds.includes(id)
        ? prev.partnerIds.filter((pid) => pid !== id)
        : [...prev.partnerIds, id],
    }));
  };

  const handleApply = () => {
    setCommitted(draft);
    onApply();
  };

  const handleReset = () => {
    const defaults = { q: "", partnerIds: [], sortOrder: "date_desc" as const };
    setDraft(defaults);
    setCommitted(defaults);
    onClose();
  };

  return (
    <div className="flex flex-col gap-5 pt-2">
      {/* テキスト検索 */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">メモで検索</Label>
        <Input
          placeholder="キーワードを入力"
          value={draft.q}
          onChange={(e) => setDraft((prev) => ({ ...prev, q: e.target.value }))}
        />
      </div>

      {/* 相手フィルター */}
      {activePartners.length > 0 && (
        <div className="space-y-2">
          <Label className="text-sm font-medium">相手で絞り込む</Label>
          <div className="flex flex-wrap gap-1.5">
            {activePartners.map((partner) => {
              const selected = draft.partnerIds.includes(partner.id);
              return (
                <button
                  key={partner.id}
                  type="button"
                  onClick={() => togglePartner(partner.id)}
                  className={cn(
                    "inline-flex items-center rounded-full border px-3 py-1 text-sm transition-colors",
                    selected
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-background text-foreground hover:bg-muted",
                  )}
                >
                  {partner.name}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 並び替え */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">並び替え</Label>
        <div className="grid grid-cols-2 gap-2">
          {SORT_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() =>
                setDraft((prev) => ({ ...prev, sortOrder: opt.value }))
              }
              className={cn(
                "rounded-lg border px-3 py-2 text-sm transition-colors text-left",
                draft.sortOrder === opt.value
                  ? "border-primary bg-primary/10 text-primary font-medium"
                  : "border-border bg-background hover:bg-muted",
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* ボタン */}
      <div className="flex gap-2 pt-1">
        <Button variant="outline" className="flex-1" onClick={handleReset}>
          リセット
        </Button>
        <Button className="flex-1" onClick={handleApply}>
          絞り込む
        </Button>
      </div>
    </div>
  );
}

export function TransactionFilterSheet({ partners }: Props) {
  const [open, setOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(true);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    setIsMobile(!mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(!e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const [filters] = useQueryStates(transactionFilterParsers);
  const activeCount = [
    filters.q !== "",
    filters.partnerIds.length > 0,
    filters.sortOrder !== "date_desc",
  ].filter(Boolean).length;

  if (isMobile) {
    return (
      <>
        <FilterButton activeCount={activeCount} onClick={() => setOpen(true)} />
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetContent
            side="bottom"
            className="max-h-[85vh] overflow-y-auto rounded-t-2xl"
          >
            <SheetHeader>
              <SheetTitle>検索・絞り込み</SheetTitle>
            </SheetHeader>
            <FilterForm
              partners={partners}
              onApply={() => setOpen(false)}
              onClose={() => setOpen(false)}
            />
          </SheetContent>
        </Sheet>
      </>
    );
  }

  return (
    <>
      <FilterButton activeCount={activeCount} onClick={() => setOpen(true)} />
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>検索・絞り込み</DialogTitle>
          </DialogHeader>
          <FilterForm
            partners={partners}
            onApply={() => setOpen(false)}
            onClose={() => setOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}

function FilterButton({
  activeCount,
  onClick,
}: {
  activeCount: number;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="検索・絞り込み"
      className="fixed bottom-37 right-4 z-50 flex h-12 w-12 items-center justify-center rounded-full border bg-background shadow-md transition-colors hover:bg-muted"
    >
      <SlidersHorizontal className="h-5 w-5" />
      {activeCount > 0 && (
        <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
          {activeCount}
        </span>
      )}
    </button>
  );
}
