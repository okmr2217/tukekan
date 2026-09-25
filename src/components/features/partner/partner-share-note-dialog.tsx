"use client";

import { useEffect, useState, useTransition } from "react";
import {
  ResponsiveDialog,
  ResponsiveDialogBody,
  ResponsiveDialogContent,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@/components/ui/responsive-dialog";
import { Button } from "@/components/ui/button";
import { LoadingButton } from "@/components/ui/loading-button";
import { Textarea } from "@/components/ui/textarea";
import { updatePartnerShareNote, type PartnerById } from "@/actions/partner";
import { SHARE_NOTE_MAX_LENGTH } from "@/lib/share-note";
import { toast } from "sonner";

type Props = {
  partner: PartnerById;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

/**
 * 公開ページ（/share/[token]）に表示するメモの編集ダイアログ。
 *
 * メモは相手ごとに1つだけで、ここで書き換える。空にすると公開ページから消える。
 */
export function PartnerShareNoteDialog({ partner, open, onOpenChange }: Props) {
  const [content, setContent] = useState(partner.shareNote ?? "");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (open) setContent(partner.shareNote ?? "");
  }, [open, partner.shareNote]);

  const isOver = content.length > SHARE_NOTE_MAX_LENGTH;

  const handleSubmit = () => {
    if (isOver || isPending) return;
    startTransition(async () => {
      const result = await updatePartnerShareNote(partner.id, content);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success(
        content.trim().length === 0 ? "メモを削除しました" : "メモを保存しました",
      );
      onOpenChange(false);
    });
  };

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent>
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>共有メモ</ResponsiveDialogTitle>
        </ResponsiveDialogHeader>
        <ResponsiveDialogBody>
          <div className="pb-2 space-y-2">
            <div className="relative">
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="共有ページに表示されるメモを記入"
                className="min-h-24 resize-none pb-6"
                disabled={isPending}
              />
              <span
                className={`absolute bottom-2 right-3 text-xs ${isOver ? "text-destructive" : "text-muted-foreground"}`}
              >
                {content.length} / {SHARE_NOTE_MAX_LENGTH}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              共有リンクの公開ページに表示されます。空にすると表示されません。
            </p>
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
              disabled={isOver}
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
