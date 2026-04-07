"use client";

import { useState } from "react";
import { UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import type { PartnerWithBalance } from "@/actions/partner";
import { PartnerCard } from "./partner-card";
import { AddPartnerDialog } from "./add-partner-dialog";

type Props = {
  partners: PartnerWithBalance[];
};

export function PartnersPageClient({ partners }: Props) {
  const [showArchived, setShowArchived] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);

  const activePartners = partners.filter((p) => !p.isArchived);
  const archivedPartners = partners.filter((p) => p.isArchived);
  const displayedPartners = showArchived ? partners : activePartners;

  return (
    <>
      <div className="flex items-center justify-between px-4 py-3">
        <h1 className="text-lg font-semibold">相手</h1>
        <Button size="sm" onClick={() => setIsAddOpen(true)}>
          <UserPlus className="size-4 mr-1" />
          追加
        </Button>
      </div>

      {displayedPartners.length === 0 ? (
        <div className="py-12 text-center text-muted-foreground">
          {showArchived
            ? "相手がいません"
            : "相手がまだ登録されていません"}
        </div>
      ) : (
        <div className="divide-y">
          {displayedPartners.map((partner) => (
            <PartnerCard key={partner.id} partner={partner} />
          ))}
        </div>
      )}

      {archivedPartners.length > 0 && (
        <div className="flex items-center gap-2 px-4 py-3 mt-2">
          <input
            id="show-archived"
            type="checkbox"
            checked={showArchived}
            onChange={(e) => setShowArchived(e.target.checked)}
            className="size-4 rounded accent-primary cursor-pointer"
          />
          <Label htmlFor="show-archived" className="text-sm text-muted-foreground cursor-pointer">
            アーカイブ済みを表示（{archivedPartners.length}件）
          </Label>
        </div>
      )}

      <AddPartnerDialog open={isAddOpen} onOpenChange={setIsAddOpen} />
    </>
  );
}
