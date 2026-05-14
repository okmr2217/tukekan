"use client";

import { useState, useTransition, useEffect } from "react";
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  ResponsiveDialogBody,
  ResponsiveDialogFooter,
} from "@/components/ui/responsive-dialog";
import { Button } from "@/components/ui/button";
import { LoadingButton } from "@/components/ui/loading-button";
import { createPartnerNote, updatePartnerNote } from "@/actions/partner-note";
import type { PartnerNote } from "@/actions/partner";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";

type Props = {
  partnerId: string;
  note?: PartnerNote;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function PartnerNoteFormDialog({
  partnerId,
  note,
  open,
  onOpenChange,
}: Props) {
  const [content, setContent] = useState(note?.content ?? "");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (open) {
      setContent(note?.content ?? "");
    }
  }, [open, note]);

  const trimmed = content.trim();
  const isValid = trimmed.length >= 1 && trimmed.length <= 100;
  const isOver = content.length > 100;

  const handleSubmit = () => {
    if (!isValid || isPending) return;
    startTransition(async () => {
      const result = note
        ? await updatePartnerNote({ id: note.id, content })
        : await createPartnerNote({ partnerId, content });

      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success(note ? "メモを更新しました" : "メモを追加しました");
      onOpenChange(false);
    });
  };

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent>
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>{note ? "メモを編集" : "メモを追加"}</ResponsiveDialogTitle>
        </ResponsiveDialogHeader>
        <ResponsiveDialogBody>
          <div className="pb-2">
            <div className="relative">
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="例: 5/15に2万円返済の約束"
                className="min-h-24 resize-none pb-6"
                disabled={isPending}
              />
              <span
                className={`absolute bottom-2 right-3 text-xs ${isOver ? "text-destructive" : "text-muted-foreground"}`}
              >
                {content.length} / 100
              </span>
            </div>
          </div>
        </ResponsiveDialogBody>
        <ResponsiveDialogFooter>
          <div className="flex gap-2 w-full">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
              className="flex-1"
            >
              キャンセル
            </Button>
            <LoadingButton
              type="button"
              onClick={handleSubmit}
              disabled={!isValid}
              loading={isPending}
              loadingText="保存中..."
              className="flex-1"
            >
              保存
            </LoadingButton>
          </div>
        </ResponsiveDialogFooter>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
