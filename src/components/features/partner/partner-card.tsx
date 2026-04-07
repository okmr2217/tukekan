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
          "flex items-center justify-between px-4 py-3",
          partner.isArchived && "opacity-60",
        )}
      >
        <div className="flex items-center gap-3">
          <div className="size-8 rounded-full bg-muted flex items-center justify-center text-sm font-medium shrink-0">
            {partner.name[0]}
          </div>
          <div>
            <span className="font-medium">{partner.name}</span>
            {partner.isArchived && (
              <span className="ml-2 text-xs text-muted-foreground">
                アーカイブ済み
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1">
          <span
            className={cn(
              "font-semibold tabular-nums text-sm mr-1",
              partner.balance < 0 ? "text-destructive" : "text-foreground",
            )}
          >
            {partner.balance < 0 ? "-" : ""}¥
            {Math.abs(partner.balance).toLocaleString()}
          </span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-8"
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
