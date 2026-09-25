"use client";

import { useState } from "react";
import { UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import type { PartnerWithBalance } from "@/actions/partner";
import { PartnerCard } from "./partner-card";
import { PartnerBalanceSummary } from "./partner-balance-summary";
import { AddPartnerDialog } from "./add-partner-dialog";
import { MobileHeader } from "@/components/layouts/mobile-header";

type Props = {
  partners: PartnerWithBalance[];
};

/** ホーム（相手の一覧）。貸し借りの合計と、相手ごとの合計残高・直近の取引を出す */
export function PartnerListClient({ partners }: Props) {
  const [showArchived, setShowArchived] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);

  const activePartners = partners.filter((p) => !p.isArchived);
  const archivedPartners = partners.filter((p) => p.isArchived);
  const displayedPartners = showArchived ? partners : activePartners;

  return (
    <>
      <MobileHeader
        title="相手"
        action={
          <Button size="sm" onClick={() => setIsAddOpen(true)}>
            <UserPlus className="size-4 mr-1" />
            追加
          </Button>
        }
      />

      <div className="max-w-lg mx-auto w-full px-4 pt-3 pb-4">
        {partners.length > 0 && (
          <div className="mb-4">
            <PartnerBalanceSummary partners={partners} />
          </div>
        )}

        <p className="text-xs text-muted-foreground mb-3">相手ごとの残高</p>

        {displayedPartners.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <p className="text-muted-foreground text-sm">
              {showArchived
                ? "相手がいません"
                : "相手がまだ登録されていません"}
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
      </div>

      <AddPartnerDialog open={isAddOpen} onOpenChange={setIsAddOpen} />
    </>
  );
}
