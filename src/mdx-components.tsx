import type { MDXComponents } from "mdx/types";

// @next/mdx が App Router で必須とするファイル。
// 使い方ガイドの見た目は記事側（components/features/help/guide-article.tsx）で渡すので、ここでは何も足さない。
const components: MDXComponents = {};

export function useMDXComponents(): MDXComponents {
  return components;
}
