"use client";

import { useState, useTransition, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { createPartnerNote, updatePartnerNote } from "@/actions/partner-note";
import type { PartnerNote } from "@/actions/partner";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{note ? "メモを編集" : "メモを追加"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="relative">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="例: 5/15に2万円返済の約束"
              className="w-full min-h-24 text-sm rounded-md border border-input bg-background px-3 py-2 ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
              disabled={isPending}
            />
            <span
              className={cn(
                "absolute bottom-2 right-3 text-xs",
                isOver ? "text-destructive" : "text-muted-foreground",
              )}
            >
              {content.length} / 100
            </span>
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
              className="flex-1"
            >
              キャンセル
            </Button>
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={!isValid || isPending}
              className="flex-1"
            >
              {isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  保存中...
                </>
              ) : (
                "保存"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
