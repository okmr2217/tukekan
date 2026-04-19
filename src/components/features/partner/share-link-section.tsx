"use client";

import { useTransition } from "react";
import { Link, Link2Off, RefreshCw, Copy, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { generateShareToken, revokeShareToken } from "@/actions/partner";
import { toast } from "sonner";
import type { PartnerById } from "@/actions/partner";

type Props = {
  partner: PartnerById;
};

export function ShareLinkSection({ partner }: Props) {
  const [isPending, startTransition] = useTransition();

  const hasActiveToken =
    partner.shareToken !== null &&
    partner.shareTokenExpiresAt !== null &&
    new Date(partner.shareTokenExpiresAt) > new Date();

  const handleGenerate = () => {
    startTransition(async () => {
      const result = await generateShareToken(partner.id);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      if (result.token) {
        const url = `${window.location.origin}/share/${result.token}`;
        await navigator.clipboard.writeText(url);
        toast.success("共有リンクを発行しました（クリップボードにコピー済み）");
      }
    });
  };

  const handleCopy = async () => {
    if (!partner.shareToken) return;
    const url = `${window.location.origin}/share/${partner.shareToken}`;
    await navigator.clipboard.writeText(url);
    toast.success("共有リンクをコピーしました");
  };

  const handleOpen = () => {
    if (!partner.shareToken) return;
    const url = `${window.location.origin}/share/${partner.shareToken}`;
    window.open(url, "_blank");
  };

  const handleRevoke = () => {
    startTransition(async () => {
      const result = await revokeShareToken(partner.id);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("共有リンクを無効にしました");
      }
    });
  };

  const expiresAt = partner.shareTokenExpiresAt
    ? new Date(partner.shareTokenExpiresAt)
    : null;

  const formatExpiry = (date: Date) => {
    const jst = new Date(date.toLocaleString("en-US", { timeZone: "Asia/Tokyo" }));
    return `${jst.getFullYear()}年${jst.getMonth() + 1}月${jst.getDate()}日`;
  };

  return (
    <div className="rounded-xl border bg-card px-4 py-3 shadow-sm space-y-2.5">
      <div className="flex items-center gap-2">
        <Link className="h-4 w-4 text-muted-foreground shrink-0" />
        <span className="text-sm font-medium">共有リンク</span>
      </div>

      {hasActiveToken && expiresAt ? (
        <>
          <p className="text-xs text-muted-foreground">
            有効期限：{formatExpiry(expiresAt)}まで
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={handleCopy}
              disabled={isPending}
            >
              <Copy className="h-3.5 w-3.5 mr-1.5" />
              リンクをコピー
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleOpen}
              disabled={isPending}
              aria-label="リンクを開く"
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleGenerate}
              disabled={isPending}
              aria-label="再発行"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRevoke}
              disabled={isPending}
              aria-label="停止"
            >
              <Link2Off className="h-3.5 w-3.5" />
            </Button>
          </div>
        </>
      ) : (
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={handleGenerate}
          disabled={isPending}
        >
          <Link className="h-3.5 w-3.5 mr-1.5" />
          共有リンクを発行
        </Button>
      )}
    </div>
  );
}
