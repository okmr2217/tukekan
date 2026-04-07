"use client";

import { useState, useTransition } from "react";
import { MoreVertical, Pencil, Archive, RefreshCw, ArrowLeftRight } from "lucide-react";
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

  const isPending = isArchivePending || isSettlePending;

  return (
    <>
      <div
        className={cn(
          "rounded-lg border bg-card p-4 shadow-sm",
          partner.isArchived && "opacity-60",
        )}
      >
        <div className="flex items-center justify-between gap-3">
          {/* Left: avatar + name */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="size-10 rounded-full bg-muted flex items-center justify-center text-sm font-semibold shrink-0">
              {partner.name[0]}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-sm">{partner.name}</span>
                {partner.isArchived && (
                  <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                    アーカイブ済み
                  </span>
                )}
              </div>
              <span
                className={cn(
                  "font-bold text-base tabular-nums",
                  partner.balance < 0 ? "text-destructive" : "text-foreground",
                )}
              >
                {partner.balance < 0 ? "-" : ""}¥
                {Math.abs(partner.balance).toLocaleString()}
              </span>
            </div>
          </div>

          {/* Right: action menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-8 shrink-0"
                disabled={isPending}
              >
                <MoreVertical className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setIsEditOpen(true)}>
                <Pencil className="size-4 mr-2" />
                名前を変更
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleSettle}
                disabled={partner.balance === 0}
              >
                <ArrowLeftRight className="size-4 mr-2" />
                精算
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {partner.isArchived ? (
                <DropdownMenuItem onClick={handleUnarchive}>
                  <RefreshCw className="size-4 mr-2" />
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

      <EditPartnerDialog
        partner={partner}
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
      />
    </>
  );
}
