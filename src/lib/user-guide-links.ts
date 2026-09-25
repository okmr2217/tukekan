/**
 * 使い方ガイドへのリンク（docs/12-user-guide.md 12.5）。
 *
 * 記事本体（src/lib/user-guide.ts）は原稿をまるごと取り込むので、クライアントコンポーネントから
 * リンクを張るだけのときはこちらを使う（記事がブラウザ向けのバンドルに入らないようにするため）。
 */
export const USER_GUIDE_SLUGS = [
  "getting-started",
  "transactions",
  "partners",
  "interest",
  "share",
  "statistics",
] as const;

export type UserGuideSlug = (typeof USER_GUIDE_SLUGS)[number];

export function userGuideHref(slug?: UserGuideSlug): string {
  return slug ? `/help/${slug}` : "/help";
}
