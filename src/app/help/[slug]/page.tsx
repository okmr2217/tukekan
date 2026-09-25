import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { MobileHeader } from "@/components/layouts/mobile-header";
import { GuideArticle } from "@/components/features/help/guide-article";
import { USER_GUIDE_ARTICLES, findUserGuideArticle } from "@/lib/user-guide";
import { userGuideHref } from "@/lib/user-guide-links";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const article = findUserGuideArticle(slug);
  if (!article) return { title: "ツケカン" };
  return {
    title: `${article.title} - ツケカン 使い方ガイド`,
    description: article.summary,
  };
}

export default async function HelpArticlePage({ params }: Props) {
  const { slug } = await params;
  // 記事は原稿の6本だけ。それ以外の slug は 404 にする。
  // generateStaticParams で静的に書き出すと、インクリメンタルキャッシュを持たない
  // この OpenNext の構成（open-next.config.ts）では Workers 上で 404 になるため、毎回描画する
  const article = findUserGuideArticle(slug);
  if (!article) notFound();

  const index = USER_GUIDE_ARTICLES.findIndex((a) => a.slug === article.slug);
  const prev = USER_GUIDE_ARTICLES[index - 1];
  const next = USER_GUIDE_ARTICLES[index + 1];

  return (
    <div className="flex min-h-screen flex-col">
      <MobileHeader title="使い方ガイド" backHref={userGuideHref()} />

      <main className="px-4 pt-5 pb-10 max-w-lg mx-auto w-full">
        <GuideArticle article={article} />

        <nav className="mt-10 grid grid-cols-2 gap-2" aria-label="前後の記事">
          {prev ? (
            <Link
              href={userGuideHref(prev.slug)}
              className="flex items-center gap-1 rounded-xl border bg-card px-3 py-3 shadow-sm hover:bg-muted transition-colors"
            >
              <ChevronLeft className="h-4 w-4 shrink-0 text-muted-foreground" />
              <span className="min-w-0">
                <span className="block text-[11px] text-muted-foreground">前の記事</span>
                <span className="block text-sm font-medium truncate">{prev.title}</span>
              </span>
            </Link>
          ) : (
            <div />
          )}
          {next && (
            <Link
              href={userGuideHref(next.slug)}
              className="flex items-center justify-end gap-1 rounded-xl border bg-card px-3 py-3 text-right shadow-sm hover:bg-muted transition-colors"
            >
              <span className="min-w-0">
                <span className="block text-[11px] text-muted-foreground">次の記事</span>
                <span className="block text-sm font-medium truncate">{next.title}</span>
              </span>
              <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
            </Link>
          )}
        </nav>

        <p className="mt-6 text-center">
          <Link
            href={userGuideHref()}
            className="text-sm text-primary underline-offset-4 hover:underline"
          >
            目次に戻る
          </Link>
        </p>
      </main>
    </div>
  );
}
