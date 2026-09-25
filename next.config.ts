import type { NextConfig } from "next";
import createMDX from "@next/mdx";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
import { version } from "./package.json";

const nextConfig: NextConfig = {
  // ロゴアイコン程度しか next/image を使っていないので、Workers 上では画像最適化を使わない
  images: {
    unoptimized: true,
  },
  env: {
    NEXT_PUBLIC_APP_VERSION: version,
  },
  async redirects() {
    return [
      {
        source: "/stats",
        destination: "/statistics",
        permanent: true,
      },
    ];
  },
};

// 使い方ガイドの原稿（docs/user-guide/*.md）をビルド時にコンポーネントへ変換する（docs/12-user-guide.md）。
// Workers では実行時にファイルを読めないため、原稿はバンドルに取り込む。
// Turbopack にはプラグインを関数ではなく名前（文字列）で渡す必要がある。
const withMDX = createMDX({
  extension: /\.md$/,
  options: {
    remarkPlugins: ["remark-frontmatter", "remark-mdx-frontmatter", "remark-gfm"],
  },
});

export default withMDX(nextConfig);

// `next dev` でも getCloudflareContext() から wrangler.jsonc のバインディング（D1 の env.DB など）を
// 使えるようにする。D1 はローカルの .wrangler/state に作られる（docs/11-cloudflare-workers.md）
initOpenNextCloudflareForDev();
