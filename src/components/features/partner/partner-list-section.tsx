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

/** ホームの相手の一覧。相手ごとの合計残高と、直近の取引を出す */
export function PartnerListSection({ partners }: Props) {
  const [showArchived, setShowArchived] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);

  const activePartners = partners.filter((p) => !p.isArchived);
  const archivedPartners = partners.filter((p) => p.isArchived);
  const displayedPartners = showArchived ? partners : activePartners;

  return (
    <section>
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-xs text-muted-foreground">相手ごとの残高</h2>
        <Button
          size="sm"
          variant="ghost"
          className="h-7 -mr-2 text-xs"
          onClick={() => setIsAddOpen(true)}
        >
          <UserPlus className="size-3.5 mr-1" />
          相手を追加
        </Button>
      </div>

      {displayedPartners.length === 0 ? (
        <div className="py-16 text-center space-y-3">
          <p className="text-muted-foreground text-sm">
            {showArchived ? "相手がいません" : "相手がまだ登録されていません"}
          </p>
          <button
            onClick={() => setIsAddOpen(true)}
            className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
          >
            <UserPlus className="h-4 w-4" />
            相手を追加する
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {displayedPartners.map((partner) => (
            <PartnerCard key={partner.id} partner={partner} />
          ))}
        </div>
      )}

      {archivedPartners.length > 0 && (
        <div className="flex items-center gap-2 py-3 mt-2">
          <input
            id="show-archived"
            type="checkbox"
            checked={showArchived}
            onChange={(e) => setShowArchived(e.target.checked)}
            className="size-4 rounded accent-primary cursor-pointer"
          />
          <Label
            htmlFor="show-archived"
            className="text-sm text-muted-foreground cursor-pointer"
          >
            アーカイブ済みを表示（{archivedPartners.length}件）
          </Label>
        </div>
      )}

      <AddPartnerDialog open={isAddOpen} onOpenChange={setIsAddOpen} />
    </section>
  );
}
