import type { NextConfig } from "next";
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

export default nextConfig;

// `next dev` でも getCloudflareContext() から wrangler.jsonc のバインディング（D1 の env.DB など）を
// 使えるようにする。D1 はローカルの .wrangler/state に作られる（docs/11-cloudflare-workers.md）
initOpenNextCloudflareForDev();
