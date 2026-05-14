"use client";

import { useState, useTransition } from "react";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  ResponsiveDialogBody,
} from "@/components/ui/responsive-dialog";
import { Button } from "@/components/ui/button";
import { LoadingButton } from "@/components/ui/loading-button";
import { deletePartnerNote } from "@/actions/partner-note";
import type { PartnerNote } from "@/actions/partner";
import { PartnerNoteFormDialog } from "./partner-note-form-dialog";
import { formatDateTimeForDisplay } from "@/lib/date-utils";
import { toast } from "sonner";

type Props = {
  note: PartnerNote;
  readOnly?: boolean;
};

export function PartnerNoteCard({ note, readOnly = false }: Props) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isDeletePending, startDeleteTransition] = useTransition();

  const isEdited =
    new Date(note.updatedAt).getTime() - new Date(note.createdAt).getTime() >
    5000;

  const handleDeleteConfirm = () => {
    startDeleteTransition(async () => {
      const result = await deletePartnerNote({ id: note.id });
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("メモを削除しました");
      setDeleteOpen(false);
    });
  };

  return (
    <>
      <div className="rounded-xl border bg-card px-3 py-2.5 shadow-sm">
        <div className="flex items-start gap-2">
          <p className="text-sm text-foreground whitespace-pre-wrap break-words flex-1">
            {note.content}
          </p>
          {!readOnly && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="shrink-0 mt-0.5 p-0.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  aria-label="メニュー"
                >
                  <MoreHorizontal className="size-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setEditOpen(true)}>
                  <Pencil className="size-3.5 mr-2" />
                  編集
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => setDeleteOpen(true)}
                >
                  <Trash2 className="size-3.5 mr-2" />
                  削除
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
        <div className="flex items-center gap-1.5 mt-1.5">
          <span className="text-xs text-muted-foreground">
            {formatDateTimeForDisplay(new Date(note.createdAt))}
          </span>
          {isEdited && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-muted text-muted-foreground">
              編集済み
            </span>
          )}
        </div>
      </div>

      {!readOnly && (
        <>
          <PartnerNoteFormDialog
            partnerId={note.partnerId}
            note={note}
            open={editOpen}
            onOpenChange={setEditOpen}
          />
          <ResponsiveDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
            <ResponsiveDialogContent>
              <ResponsiveDialogHeader>
                <ResponsiveDialogTitle>メモを削除</ResponsiveDialogTitle>
                <ResponsiveDialogDescription>
                  このメモを削除しますか？この操作は取り消せません。
                </ResponsiveDialogDescription>
              </ResponsiveDialogHeader>
              <ResponsiveDialogBody>
                <div className="py-1" />
              </ResponsiveDialogBody>
              <ResponsiveDialogFooter>
                <div className="flex gap-2 w-full">
                  <Button
                    variant="outline"
                    onClick={() => setDeleteOpen(false)}
                    disabled={isDeletePending}
                    className="flex-1"
                  >
                    キャンセル
                  </Button>
                  <LoadingButton
                    variant="destructive"
                    onClick={handleDeleteConfirm}
                    loading={isDeletePending}
                    loadingText="削除中..."
                    className="flex-1"
                  >
                    削除
                  </LoadingButton>
                </div>
              </ResponsiveDialogFooter>
            </ResponsiveDialogContent>
          </ResponsiveDialog>
        </>
      )}
    </>
  );
}
