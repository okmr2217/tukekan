"use client";

import { useTransition, useState, useEffect } from "react";
import {
  Share2,
  Link2Off,
  RefreshCw,
  Copy,
  Eye,
  MoreHorizontal,
  CircleHelp,
} from "lucide-react";
import {
  generatePartnerShareToken,
  revokePartnerShareToken,
  type PartnerById,
} from "@/actions/partner";
import Link from "next/link";
import { PartnerShareNoteDialog } from "./partner-share-note-dialog";
import { userGuideHref } from "@/lib/user-guide-links";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DeleteConfirmDialog } from "@/components/ui/delete-confirm-dialog";
import { toast } from "sonner";
import { toJST } from "@/lib/date-utils";

type Props = {
  partner: PartnerById;
};

/** 確認してから実行する操作。どちらも相手に送ったリンクが開けなくなる */
type ConfirmAction = "reissue" | "revoke";

const formatExpiry = (date: Date) => {
  const jst = toJST(date);
  return `${jst.getFullYear()}年${jst.getMonth() + 1}月${jst.getDate()}日`;
};

/**
 * 相手ごとの共有（公開リンクと、公開ページに出す共有メモ）。
 * リンクを開くと、その相手のすべての口座がまとめて見られる。
 */
export function PartnerShareCard({ partner }: Props) {
  const [isPending, startTransition] = useTransition();
  const [origin, setOrigin] = useState("");
  const [noteOpen, setNoteOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(
    null,
  );

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const hasActiveToken =
    partner.shareToken !== null &&
    partner.shareTokenExpiresAt !== null &&
    new Date(partner.shareTokenExpiresAt) > new Date();

  const shareUrl =
    hasActiveToken && partner.shareToken
      ? `${origin}/share/${partner.shareToken}`
      : null;

  const expiresAt = partner.shareTokenExpiresAt
    ? new Date(partner.shareTokenExpiresAt)
    : null;

  /** 発行と再発行は同じ処理（新しいトークンに差し替えてコピーする） */
  const issueToken = (successMessage: string) => {
    startTransition(async () => {
      const result = await generatePartnerShareToken(partner.id);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      setConfirmAction(null);
      if (!result.token) return;
      const url = `${window.location.origin}/share/${result.token}`;
      try {
        await navigator.clipboard.writeText(url);
        toast.success(`${successMessage}（クリップボードにコピー済み）`);
      } catch {
        // サーバーの応答を待つあいだにユーザー操作の扱いが切れて、
        // コピーが拒否されるブラウザがある。発行はできているので案内だけ出す
        toast.success(`${successMessage}。「リンクをコピー」から送れます`);
      }
    });
  };

  const handleCopy = async () => {
    if (!shareUrl) return;
    await navigator.clipboard.writeText(shareUrl);
    toast.success("共有リンクをコピーしました");
  };

  const handlePreview = () => {
    if (!shareUrl) return;
    window.open(shareUrl, "_blank");
  };

  const handleRevoke = () => {
    startTransition(async () => {
      const result = await revokePartnerShareToken(partner.id);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("共有リンクを無効にしました");
      setConfirmAction(null);
    });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-medium tracking-widest text-muted-foreground uppercase">
          共有
        </p>
        <Link
          href={userGuideHref("share")}
          className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
        >
          <CircleHelp className="size-3.5" />
          共有リンクの使い方
        </Link>
      </div>

      <div className="rounded-2xl border bg-card p-4">
        {hasActiveToken && shareUrl ? (
          <>
            <div className="flex items-center gap-2">
              <Button
                onClick={handleCopy}
                disabled={isPending}
                className="flex-1"
              >
                <Copy />
                リンクをコピー
              </Button>
              <Button
                variant="outline"
                onClick={handlePreview}
                disabled={isPending}
                className="flex-1"
              >
                <Eye />
                プレビュー
              </Button>
              {/* modal={false}: メニューから確認ダイアログを開いたあとに、画面の操作が効かなくなるのを防ぐ */}
              <DropdownMenu modal={false}>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    disabled={isPending}
                    aria-label="共有リンクのメニュー"
                  >
                    <MoreHorizontal />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onSelect={() => setConfirmAction("reissue")}
                  >
                    <RefreshCw />
                    リンクを再発行
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    variant="destructive"
                    onSelect={() => setConfirmAction("revoke")}
                  >
                    <Link2Off />
                    リンクを無効にする
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            {expiresAt && (
              <p className="mt-2 text-[11px] text-muted-foreground">
                有効期限：{formatExpiry(expiresAt)}まで
              </p>
            )}

            {/* 共有メモ（公開ページがあるときだけ） */}
            <div className="mt-4">
              <p className="text-xs font-medium text-muted-foreground mb-1.5">
                共有メモ
              </p>
              <button
                onClick={() => setNoteOpen(true)}
                className="w-full text-left rounded-lg border px-3 py-2 text-sm hover:bg-muted/50 transition-colors"
              >
                {partner.shareNote ? (
                  <span className="text-foreground whitespace-pre-wrap break-words line-clamp-3">
                    {partner.shareNote}
                  </span>
                ) : (
                  <span className="text-muted-foreground">
                    共有ページに表示されるメモを記入
                  </span>
                )}
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="text-xs text-muted-foreground mb-3">
              リンクを知っている人は、ログインなしでこの相手との残高と取引履歴を見られます。
            </p>
            <Button
              onClick={() => issueToken("共有リンクを発行しました")}
              disabled={isPending}
              className="w-full"
            >
              <Share2 />
              共有リンクを発行
            </Button>
          </>
        )}
      </div>

      <PartnerShareNoteDialog
        partner={partner}
        open={noteOpen}
        onOpenChange={setNoteOpen}
      />

      <DeleteConfirmDialog
        open={confirmAction === "reissue"}
        onOpenChange={(open) => !open && setConfirmAction(null)}
        title="共有リンクを再発行しますか？"
        description="新しいリンクを発行します。これまでのリンクは開けなくなるので、相手には新しいリンクを送り直してください。"
        onConfirm={() => issueToken("新しい共有リンクを発行しました")}
        isPending={isPending}
        confirmLabel="再発行"
        loadingLabel="発行中..."
      />

      <DeleteConfirmDialog
        open={confirmAction === "revoke"}
        onOpenChange={(open) => !open && setConfirmAction(null)}
        title="共有リンクを無効にしますか？"
        description="これまでのリンクは開けなくなります。共有メモは残ります。"
        onConfirm={handleRevoke}
        isPending={isPending}
        confirmLabel="無効にする"
        loadingLabel="無効にしています..."
      />
    </div>
  );
}
