"use client";

import { useTransition } from "react";
import { Share2, Link2Off, RefreshCw, Copy, ExternalLink } from "lucide-react";
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

  const shareUrl =
    hasActiveToken && partner.shareToken
      ? `${typeof window !== "undefined" ? window.location.origin : ""}/share/${partner.shareToken}`
      : null;

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
    if (!shareUrl) return;
    await navigator.clipboard.writeText(shareUrl);
    toast.success("共有リンクをコピーしました");
  };

  const handleOpen = () => {
    if (!shareUrl) return;
    window.open(shareUrl, "_blank");
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
    <div className="bg-card border border-border rounded-2xl p-4">
      {/* ヘッダー */}
      <div className="flex items-center gap-2.5 mb-3">
        <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center shrink-0">
          <Share2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
        </div>
        <p className="text-sm font-medium">{partner.name}との取引を共有</p>
      </div>

      {hasActiveToken && expiresAt && shareUrl ? (
        <>
          {/* URL表示 + コピーボタン */}
          <div className="flex items-center gap-2 mb-3">
            <div className="flex-1 text-xs font-mono bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800 rounded-lg px-2.5 py-2 text-emerald-900 dark:text-emerald-100 truncate">
              {shareUrl}
            </div>
            <button
              onClick={handleCopy}
              disabled={isPending}
              className="shrink-0 inline-flex items-center gap-1.5 text-xs font-medium bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg px-3 py-2 transition-colors"
            >
              <Copy className="w-3.5 h-3.5" />
              コピー
            </button>
          </div>

          {/* 有効期限 + サブアクション */}
          <div className="flex items-center justify-between">
            <p className="text-xs text-emerald-600 dark:text-emerald-400">
              有効期限：{formatExpiry(expiresAt)}まで
            </p>
            <div className="flex items-center gap-1.5">
              <button
                onClick={handleOpen}
                disabled={isPending}
                aria-label="リンクを開く"
                className="text-xs text-emerald-600 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-700 rounded-md p-1.5 hover:bg-emerald-50 dark:hover:bg-emerald-950 transition-colors disabled:opacity-50"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleGenerate}
                disabled={isPending}
                aria-label="再発行"
                className="text-xs text-emerald-600 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-700 rounded-md p-1.5 hover:bg-emerald-50 dark:hover:bg-emerald-950 transition-colors disabled:opacity-50"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleRevoke}
                disabled={isPending}
                aria-label="停止"
                className="text-xs text-emerald-600 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-700 rounded-md p-1.5 hover:bg-emerald-50 dark:hover:bg-emerald-950 transition-colors disabled:opacity-50"
              >
                <Link2Off className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </>
      ) : (
        <button
          onClick={handleGenerate}
          disabled={isPending}
          className="w-full inline-flex items-center justify-center gap-1.5 text-sm font-medium bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg px-3.5 py-2 transition-colors"
        >
          <Share2 className="w-3.5 h-3.5" />
          共有リンクを発行
        </button>
      )}
    </div>
  );
}
