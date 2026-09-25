"use client";

import { useState } from "react";
import Link from "next/link";
import { Archive, ChevronRight, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { PartnerWithBalance } from "@/actions/partner";
import { PartnerCard } from "./partner-card";
import { PartnerBalanceSummary } from "./partner-balance-summary";
import { AddPartnerDialog } from "./add-partner-dialog";
import { MobileHeader } from "@/components/layouts/mobile-header";

type Props = {
  partners: PartnerWithBalance[];
};

/**
 * ホーム（相手の一覧）。貸し借りの合計と、相手ごとの合計残高・直近の取引を出す。
 *
 * アーカイブ済みの相手は一覧に出さず、末尾の小さなリンクから専用ページ
 * （/partners/archived）で見る。貸し借りは残っているので、上の合計には含める。
 */
export function PartnerListClient({ partners }: Props) {
  const [isAddOpen, setIsAddOpen] = useState(false);

  const activePartners = partners.filter((p) => !p.isArchived);
  const archivedCount = partners.length - activePartners.length;

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

        {activePartners.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <p className="text-muted-foreground text-sm">
              {archivedCount > 0
                ? "アーカイブしていない相手はいません"
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
            {activePartners.map((partner) => (
              <PartnerCard key={partner.id} partner={partner} />
            ))}
          </div>
        )}

        {archivedCount > 0 && (
          <Link
            href="/partners/archived"
            className="mt-3 flex items-center justify-center gap-1 py-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <Archive className="size-3.5" />
            アーカイブ済みの相手（{archivedCount}人）
            <ChevronRight className="size-3.5" />
          </Link>
        )}
      </div>

      <AddPartnerDialog open={isAddOpen} onOpenChange={setIsAddOpen} />
    </>
  );
}
