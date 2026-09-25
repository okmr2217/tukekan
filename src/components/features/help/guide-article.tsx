import type { ComponentPropsWithoutRef } from "react";
import type { MDXComponents } from "mdx/types";
import Link from "next/link";
import type { UserGuideArticle } from "@/lib/user-guide";

/**
 * 使い方ガイドの記事本文。原稿の Markdown が出す要素ごとに見た目を当てる。
 * スマホで読む前提なので、表は横にスクロールできるようにしておく。
 */
const components: MDXComponents = {
  h1: (props) => <h1 className="text-xl font-bold leading-snug mb-4" {...props} />,
  h2: (props) => (
    <h2 className="text-base font-bold mt-8 mb-3 pb-1.5 border-b border-border" {...props} />
  ),
  h3: (props) => <h3 className="text-sm font-bold mt-6 mb-2" {...props} />,
  p: (props) => <p className="text-sm leading-relaxed my-3" {...props} />,
  ul: (props) => <ul className="list-disc pl-5 my-3 space-y-1.5 text-sm leading-relaxed" {...props} />,
  ol: (props) => <ol className="list-decimal pl-5 my-3 space-y-1.5 text-sm leading-relaxed" {...props} />,
  strong: (props) => <strong className="font-semibold" {...props} />,
  a: GuideLink,
  blockquote: (props) => (
    <blockquote
      className="my-4 rounded-lg border bg-muted/50 px-4 py-1 text-muted-foreground [&_p]:my-2 [&_p]:whitespace-pre-line"
      {...props}
    />
  ),
  pre: (props) => (
    <pre className="my-4 overflow-x-auto rounded-lg border bg-muted/50 px-4 py-3 text-sm" {...props} />
  ),
  table: (props) => (
    <div className="my-4 overflow-x-auto rounded-lg border">
      <table className="w-full text-left text-sm [&_td]:min-w-28" {...props} />
    </div>
  ),
  th: (props) => (
    <th className="bg-muted/50 px-3 py-2 text-xs font-medium text-muted-foreground whitespace-nowrap" {...props} />
  ),
  td: (props) => <td className="border-t px-3 py-2 align-top leading-relaxed" {...props} />,
};

/** ガイド内のリンクはアプリ内の遷移にし、外へ出るリンクだけ別タブで開く */
function GuideLink({ href = "", ...props }: ComponentPropsWithoutRef<"a">) {
  const className = "text-primary underline underline-offset-4";
  if (href.startsWith("/")) {
    return <Link href={href} className={className} {...props} />;
  }
  return <a href={href} className={className} target="_blank" rel="noopener noreferrer" {...props} />;
}

export function GuideArticle({ article }: { article: UserGuideArticle }) {
  const { Content } = article;
  return (
    <article>
      <Content components={components} />
    </article>
  );
}
