import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowLeftRight,
  BarChart2,
  ChevronRight,
  Percent,
  Share2,
  Sparkles,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { getSession } from "@/lib/auth";
import { MobileHeader } from "@/components/layouts/mobile-header";
import { USER_GUIDE_ARTICLES } from "@/lib/user-guide";
import { userGuideHref, type UserGuideSlug } from "@/lib/user-guide-links";

export const metadata: Metadata = {
  title: "使い方ガイド - ツケカン",
  description: "ツケカンの使い方。取引の記録、相手と口座、利子、共有リンク、統計の見かたをまとめています。",
};

const ARTICLE_ICONS: Record<UserGuideSlug, LucideIcon> = {
  "getting-started": Sparkles,
  transactions: ArrowLeftRight,
  partners: Users,
  interest: Percent,
  share: Share2,
  statistics: BarChart2,
};

/**
 * 使い方ガイドの目次。ログイン前（ログイン画面・新規登録画面から）でも読めるように
 * (main) の外に置いている（(main) は未ログインを弾き、オンボーディング中なら送り返すため）。
 */
export default async function HelpPage() {
  const session = await getSession();

  return (
    <div className="flex min-h-screen flex-col">
      <MobileHeader title="使い方ガイド" backHref={session ? "/menu" : "/login"} />

      <main className="px-4 pt-3 pb-10 max-w-lg mx-auto w-full">
        <p className="text-xs text-muted-foreground mb-3">
          ツケカンの使い方を、機能ごとにまとめています
        </p>

        <nav className="space-y-2">
          {USER_GUIDE_ARTICLES.map((article, index) => {
            const Icon = ARTICLE_ICONS[article.slug];
            return (
              <Link
                key={article.slug}
                href={userGuideHref(article.slug)}
                className="flex items-center gap-3 rounded-xl border bg-card px-4 py-3.5 shadow-sm hover:bg-muted transition-colors"
              >
                <div className="size-9 rounded-full bg-muted flex items-center justify-center shrink-0">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">
                    <span className="text-muted-foreground tabular-nums mr-1.5">{index + 1}.</span>
                    {article.title}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">{article.summary}</p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
              </Link>
            );
          })}
        </nav>
      </main>
    </div>
  );
}
