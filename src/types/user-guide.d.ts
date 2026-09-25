// 使い方ガイドの原稿（docs/user-guide/*.md）。本体のコンポーネントの型は @types/mdx が持ち、
// ここでは remark-mdx-frontmatter が書き出す front matter の型だけを足す。
declare module "*.md" {
  export const frontmatter: { title: string };
}
