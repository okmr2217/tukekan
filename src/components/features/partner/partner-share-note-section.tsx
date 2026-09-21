"use client";

import { useEffect, useState, useTransition } from "react";
import { NotebookPen, Pencil } from "lucide-react";
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
};

/**
 * 公開ページ（/share/[token]）に表示するメモ。
 *
 * メモは相手ごとに1つだけで、ここで書き換える。空にすると公開ページから消える。
 */
export function PartnerShareNoteSection({ partner }: Props) {
  const [open, setOpen] = useState(false);
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
      setOpen(false);
    });
  };

  return (
    <>
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-medium tracking-widest text-muted-foreground uppercase">
            公開ページのメモ
          </p>
          {partner.shareNote && (
            <button
              onClick={() => setOpen(true)}
              className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-md border border-border bg-transparent hover:bg-muted transition-colors"
            >
              <Pencil className="size-3.5" />
              編集
            </button>
          )}
        </div>

        {partner.shareNote ? (
          <div className="rounded-xl border bg-card px-3 py-2.5 shadow-sm">
            <p className="text-sm text-foreground whitespace-pre-wrap break-words">
              {partner.shareNote}
            </p>
            <p className="mt-1.5 text-[11px] text-muted-foreground">
              共有リンクを開いた相手にも表示されます
            </p>
          </div>
        ) : (
          <div className="border border-dashed border-border rounded-xl px-4 py-5 flex flex-col items-center gap-2">
            <p className="text-xs text-muted-foreground text-center">
              公開ページに表示するメモはまだありません
            </p>
            <button
              onClick={() => setOpen(true)}
              className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-md border border-border bg-transparent hover:bg-muted transition-colors"
            >
              <NotebookPen className="size-3.5" />
              メモを書く
            </button>
          </div>
        )}
      </div>

      <ResponsiveDialog open={open} onOpenChange={setOpen}>
        <ResponsiveDialogContent>
          <ResponsiveDialogHeader>
            <ResponsiveDialogTitle>公開ページのメモ</ResponsiveDialogTitle>
          </ResponsiveDialogHeader>
          <ResponsiveDialogBody>
            <div className="pb-2 space-y-2">
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
                onClick={() => setOpen(false)}
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
    </>
  );
}
