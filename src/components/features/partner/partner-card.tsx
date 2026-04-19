"use client";

import { useState, useTransition } from "react";
import { MoreVertical, Pencil, Archive, ArchiveRestore } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import {
  archivePartner,
  unarchivePartner,
  type PartnerWithBalance,
} from "@/actions/partner";
import { toast } from "sonner";
import { EditPartnerDialog } from "./edit-partner-dialog";

type Props = {
  partner: PartnerWithBalance;
};

export function PartnerCard({ partner }: Props) {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleArchive = () => {
    startTransition(async () => {
      const result = await archivePartner(partner.id);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(`${partner.name}をアーカイブしました`);
      }
    });
  };

  const handleUnarchive = () => {
    startTransition(async () => {
      const result = await unarchivePartner(partner.id);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(`${partner.name}のアーカイブを解除しました`);
      }
    });
  };

  return (
    <>
      <div
        className={cn(
          "rounded-lg border bg-card px-4 py-2.5 shadow-sm",
          partner.isArchived && "opacity-60",
        )}
      >
        <div className="flex items-center gap-2">
          <div className="size-9 rounded-full bg-muted flex items-center justify-center text-sm font-semibold shrink-0">
            {partner.name[0]}
          </div>

          <div className="flex items-center gap-1.5 min-w-0 flex-1 flex-wrap">
            <span className="font-semibold text-sm">{partner.name}</span>
            {partner.isArchived && (
              <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                アーカイブ済み
              </span>
            )}
          </div>

          <span
            className={cn(
              "font-bold text-base tabular-nums shrink-0",
              partner.balance < 0 ? "text-destructive" : "text-foreground",
            )}
          >
            {partner.balance < 0 ? "-" : ""}¥
            {Math.abs(partner.balance).toLocaleString()}
          </span>

          <div className="flex items-center gap-1 shrink-0 -mr-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 shrink-0 text-muted-foreground hover:text-foreground"
              onClick={() => setIsEditOpen(true)}
              aria-label="名前を変更"
            >
              <Pencil className="h-3 w-3" />
            </Button>

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
