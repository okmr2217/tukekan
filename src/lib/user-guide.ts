import type { MDXContent } from "mdx/types";
import type { UserGuideSlug } from "./user-guide-links";
import GettingStarted, { frontmatter as gettingStarted } from "../../docs/user-guide/01-getting-started.md";
import Transactions, { frontmatter as transactions } from "../../docs/user-guide/02-transactions.md";
import Partners, { frontmatter as partners } from "../../docs/user-guide/03-partners.md";
import Interest, { frontmatter as interest } from "../../docs/user-guide/04-interest.md";
import Share, { frontmatter as share } from "../../docs/user-guide/05-share.md";
import Statistics, { frontmatter as statistics } from "../../docs/user-guide/06-statistics.md";

/**
 * 使い方ガイドの記事（docs/12-user-guide.md）。
 *
 * 原稿は docs/user-guide/{NN}-{slug}.md が唯一の原本で、ここではビルド時に変換された
 * コンポーネントを slug に結びつけるだけ。並び順はこの配列の順（= ファイル名の NN）。
 * タイトルは原稿の front matter から取り、目次の説明文だけをここに持つ。
 */
export const USER_GUIDE_ARTICLES = [
  {
    slug: "getting-started",
    title: gettingStarted.title,
    summary: "ツケカンの考え方、最初の設定、画面の見取り図",
    Content: GettingStarted,
  },
  {
    slug: "transactions",
    title: transactions.title,
    summary: "色の見かた、取引の記録・修正・検索、精算のしかた",
    Content: Transactions,
  },
  {
    slug: "partners",
    title: partners.title,
    summary: "相手の追加・アーカイブ・削除と、口座の使い分け",
    Content: Partners,
  },
  {
    slug: "interest",
    title: interest.title,
    summary: "年利の設定、未払利息と元本、返済の充て方",
    Content: Interest,
  },
  {
    slug: "share",
    title: share.title,
    summary: "相手に残高を見せるリンクと、相手に見えるもの",
    Content: Share,
  },
  {
    slug: "statistics",
    title: statistics.title,
    summary: "貸し借りの流れと、返済の傾向の読み方",
    Content: Statistics,
  },
] as const satisfies readonly {
  slug: UserGuideSlug;
  title: string;
  summary: string;
  Content: MDXContent;
}[];

export type UserGuideArticle = (typeof USER_GUIDE_ARTICLES)[number];

export function findUserGuideArticle(slug: string): UserGuideArticle | undefined {
  return USER_GUIDE_ARTICLES.find((article) => article.slug === slug);
}
