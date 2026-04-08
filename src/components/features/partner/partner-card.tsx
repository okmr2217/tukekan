"use client";

import { useState, useTransition } from "react";
import {
  MoreVertical,
  Pencil,
  Archive,
  ArchiveRestore,
  RefreshCw,
  ArrowLeftRight,
  Link,
  Link2Off,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import {
  archivePartner,
  unarchivePartner,
  settlePartner,
  generateShareToken,
  revokeShareToken,
  type PartnerWithBalance,
} from "@/actions/partner";
import { toast } from "sonner";
import { EditPartnerDialog } from "./edit-partner-dialog";

type Props = {
  partner: PartnerWithBalance;
};

export function PartnerCard({ partner }: Props) {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isArchivePending, startArchiveTransition] = useTransition();
  const [isSettlePending, startSettleTransition] = useTransition();
  const [isSharePending, startShareTransition] = useTransition();

  const hasActiveToken =
    partner.shareToken !== null &&
    partner.shareTokenExpiresAt !== null &&
    new Date(partner.shareTokenExpiresAt) > new Date();

  const handleArchive = () => {
    startArchiveTransition(async () => {
      const result = await archivePartner(partner.id);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(`${partner.name}をアーカイブしました`);
      }
    });
  };

  const handleUnarchive = () => {
    startArchiveTransition(async () => {
      const result = await unarchivePartner(partner.id);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(`${partner.name}のアーカイブを解除しました`);
      }
    });
  };

  const handleSettle = () => {
    startSettleTransition(async () => {
      const result = await settlePartner(partner.id);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(`${partner.name}との精算を登録しました`);
      }
    });
  };

  const handleGenerateShareLink = () => {
    startShareTransition(async () => {
      const result = await generateShareToken(partner.id);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      if (result.token) {
        const url = `${window.location.origin}/share/${result.token}`;
        await navigator.clipboard.writeText(url);
        toast.success("共有リンクをクリップボードにコピーしました");
      }
    });
  };

  const handleCopyShareLink = async () => {
    if (!partner.shareToken) return;
    const url = `${window.location.origin}/share/${partner.shareToken}`;
    await navigator.clipboard.writeText(url);
    toast.success("共有リンクをクリップボードにコピーしました");
  };

  const handleRevokeShareLink = () => {
    startShareTransition(async () => {
      const result = await revokeShareToken(partner.id);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("共有リンクを無効にしました");
      }
    });
  };

  const isPending = isArchivePending || isSettlePending || isSharePending;

  return (
    <>
      <div
        className={cn(
          "rounded-lg border bg-card px-4 py-2.5 shadow-sm",
          partner.isArchived && "opacity-60",
        )}
      >
        <div className="flex items-center gap-2">
          {/* Avatar */}
          <div className="size-9 rounded-full bg-muted flex items-center justify-center text-sm font-semibold shrink-0">
            {partner.name[0]}
          </div>

          {/* Name + badges */}
          <div className="flex items-center gap-1.5 min-w-0 flex-1 flex-wrap">
            <span className="font-semibold text-sm">{partner.name}</span>
            {partner.isArchived && (
              <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                アーカイブ済み
              </span>
            )}
            {hasActiveToken && (
              <span className="text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950 px-1.5 py-0.5 rounded">
                共有中
              </span>
            )}
          </div>

          {/* Balance */}
          <span
            className={cn(
              "font-bold text-base tabular-nums shrink-0",
              partner.balance < 0 ? "text-destructive" : "text-foreground",
            )}
          >
            {partner.balance < 0 ? "-" : ""}¥
            {Math.abs(partner.balance).toLocaleString()}
          </span>

          {/* Buttons */}
          <div className="flex items-center gap-1 shrink-0 -mr-1">
            {/* Settle button (invisible when balance is 0 to keep layout stable) */}
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "h-6 w-6 shrink-0 text-muted-foreground hover:text-foreground",
                partner.balance === 0 && "invisible pointer-events-none",
              )}
              onClick={handleSettle}
              disabled={isSettlePending || partner.balance === 0}
              aria-label="精算"
            >
              <ArrowLeftRight className="h-3 w-3" />
            </Button>

            {/* Edit button */}
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 shrink-0 text-muted-foreground hover:text-foreground"
              onClick={() => setIsEditOpen(true)}
              aria-label="名前を変更"
            >
              <Pencil className="h-3 w-3" />
            </Button>

            {/* More menu: share link + archive only */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 shrink-0 text-muted-foreground hover:text-foreground"
                  disabled={isPending}
                  aria-label="その他の操作"
                >
                  <MoreVertical className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {hasActiveToken ? (
                  <>
                    <DropdownMenuItem onClick={handleCopyShareLink}>
                      <Link className="size-4 mr-2" />
                      リンクをコピー
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleGenerateShareLink}>
                      <RefreshCw className="size-4 mr-2" />
                      リンクを再生成
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={handleRevokeShareLink}
                      className="text-muted-foreground"
                    >
                      <Link2Off className="size-4 mr-2" />
                      共有を停止
                    </DropdownMenuItem>
                  </>
                ) : (
                  <DropdownMenuItem onClick={handleGenerateShareLink}>
                    <Link className="size-4 mr-2" />
                    共有リンクを発行
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                {partner.isArchived ? (
                  <DropdownMenuItem onClick={handleUnarchive}>
                    <ArchiveRestore className="size-4 mr-2" />
                    アーカイブ解除
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem
                    onClick={handleArchive}
                    className="text-muted-foreground"
                  >
                    <Archive className="size-4 mr-2" />
                    アーカイブ
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      <EditPartnerDialog
        partner={partner}
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
      />
    </>
  );
}
