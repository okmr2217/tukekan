"use client";

import { parseAsArrayOf, parseAsString, parseAsBoolean, useQueryStates } from "nuqs";
import { cn } from "@/lib/utils";
import type { PartnerWithBalance } from "@/actions/partner";

type Props = {
  partners: PartnerWithBalance[];
};

export const transactionFilterParsers = {
  partnerIds: parseAsArrayOf(parseAsString).withDefault([]),
  showArchived: parseAsBoolean.withDefault(false),
  showArchivedPartners: parseAsBoolean.withDefault(false),
};

export function TransactionFilters({ partners }: Props) {
  const [filters, setFilters] = useQueryStates(transactionFilterParsers, {
    shallow: false,
  });

  const activePartners = partners.filter((p) => !p.isArchived);

  const togglePartner = (id: string) => {
    const newIds = filters.partnerIds.includes(id)
      ? filters.partnerIds.filter((pid) => pid !== id)
      : [...filters.partnerIds, id];
    setFilters({ partnerIds: newIds });
  };

  return (
    <div className="space-y-2">
      {/* Partner filter buttons */}
      {activePartners.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {activePartners.map((partner) => {
            const selected = filters.partnerIds.includes(partner.id);
            return (
              <button
                key={partner.id}
                type="button"
                onClick={() => togglePartner(partner.id)}
                className={cn(
                  "inline-flex items-center gap-1 rounded-full border px-3 py-1 text-sm transition-colors",
                  selected
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background text-foreground hover:bg-muted",
                )}
              >
                {partner.name}
                <span
                  className={cn(
                    "text-xs",
                    selected ? "text-primary-foreground/70" : "text-muted-foreground",
                  )}
                >
                  ({partner.transactionCount})
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Archive toggles */}
      <div className="flex flex-wrap gap-3">
        <label className="flex items-center gap-1.5 cursor-pointer select-none">
          <button
            role="switch"
            aria-checked={filters.showArchived}
            onClick={() => setFilters({ showArchived: !filters.showArchived })}
            className={cn(
              "relative inline-flex h-4 w-8 shrink-0 rounded-full border-2 border-transparent transition-colors",
              filters.showArchived ? "bg-primary" : "bg-input",
            )}
          >
            <span
              className={cn(
                "pointer-events-none inline-block h-3 w-3 rounded-full bg-background shadow-lg ring-0 transition-transform",
                filters.showArchived ? "translate-x-4" : "translate-x-0",
              )}
            />
          </button>
          <span className="text-xs text-muted-foreground">アーカイブ済み取引を表示</span>
        </label>

        <label className="flex items-center gap-1.5 cursor-pointer select-none">
          <button
            role="switch"
            aria-checked={filters.showArchivedPartners}
            onClick={() =>
              setFilters({ showArchivedPartners: !filters.showArchivedPartners })
            }
            className={cn(
              "relative inline-flex h-4 w-8 shrink-0 rounded-full border-2 border-transparent transition-colors",
              filters.showArchivedPartners ? "bg-primary" : "bg-input",
            )}
          >
            <span
              className={cn(
                "pointer-events-none inline-block h-3 w-3 rounded-full bg-background shadow-lg ring-0 transition-transform",
                filters.showArchivedPartners ? "translate-x-4" : "translate-x-0",
              )}
            />
          </button>
          <span className="text-xs text-muted-foreground">アーカイブ済み相手を表示</span>
        </label>
      </div>
    </div>
  );
}
