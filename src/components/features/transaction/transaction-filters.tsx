"use client";

import { parseAsArrayOf, parseAsString, parseAsBoolean, useQueryStates } from "nuqs";
import { Filter } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import type { PartnerOption } from "@/actions/partner";

type Props = {
  partners: PartnerOption[];
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

  const selectedCount = filters.partnerIds.length;

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Partner filter */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-1.5">
            <Filter className="h-3.5 w-3.5" />
            相手で絞り込み
            {selectedCount > 0 && (
              <span className="ml-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-medium text-primary-foreground">
                {selectedCount}
              </span>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-52">
          {partners.length === 0 ? (
            <p className="px-2 py-1.5 text-sm text-muted-foreground">相手がいません</p>
          ) : (
            <>
              <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
                相手を選択（複数可）
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {partners.map((partner) => {
                const checked = filters.partnerIds.includes(partner.id);
                return (
                  <DropdownMenuCheckboxItem
                    key={partner.id}
                    checked={checked}
                    onCheckedChange={(value) => {
                      const newIds = value
                        ? [...filters.partnerIds, partner.id]
                        : filters.partnerIds.filter((id) => id !== partner.id);
                      setFilters({ partnerIds: newIds });
                    }}
                    onSelect={(e) => e.preventDefault()}
                    className={cn(partner.isArchived && "text-muted-foreground")}
                  >
                    {partner.name}
                    {partner.isArchived && (
                      <span className="ml-1 text-xs">(アーカイブ)</span>
                    )}
                  </DropdownMenuCheckboxItem>
                );
              })}
              {selectedCount > 0 && (
                <>
                  <DropdownMenuSeparator />
                  <button
                    className="w-full px-2 py-1.5 text-xs text-muted-foreground hover:text-foreground text-center transition-colors"
                    onClick={() => setFilters({ partnerIds: [] })}
                  >
                    選択解除
                  </button>
                </>
              )}
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Toggle: show archived transactions */}
      <label className="flex items-center gap-2 cursor-pointer select-none">
        <button
          role="switch"
          aria-checked={filters.showArchived}
          onClick={() => setFilters({ showArchived: !filters.showArchived })}
          className={cn(
            "relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            filters.showArchived ? "bg-primary" : "bg-input",
          )}
        >
          <span
            className={cn(
              "pointer-events-none inline-block h-4 w-4 rounded-full bg-background shadow-lg ring-0 transition-transform",
              filters.showArchived ? "translate-x-4" : "translate-x-0",
            )}
          />
        </button>
        <span className="text-sm">アーカイブ済み取引を表示</span>
      </label>

      {/* Toggle: show archived partners' transactions */}
      <label className="flex items-center gap-2 cursor-pointer select-none">
        <button
          role="switch"
          aria-checked={filters.showArchivedPartners}
          onClick={() =>
            setFilters({ showArchivedPartners: !filters.showArchivedPartners })
          }
          className={cn(
            "relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            filters.showArchivedPartners ? "bg-primary" : "bg-input",
          )}
        >
          <span
            className={cn(
              "pointer-events-none inline-block h-4 w-4 rounded-full bg-background shadow-lg ring-0 transition-transform",
              filters.showArchivedPartners ? "translate-x-4" : "translate-x-0",
            )}
          />
        </button>
        <span className="text-sm">アーカイブ済み相手を表示</span>
      </label>
    </div>
  );
}
