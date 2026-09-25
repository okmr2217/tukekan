import type { NextConfig } from "next";
import { version } from "./package.json";

const nextConfig: NextConfig = {
  // ロゴアイコン程度しか next/image を使っていないので、Workers 上では画像最適化を使わない
  images: {
    unoptimized: true,
  },
  // pg は Workers 上では pg-cloudflare（"workerd" 条件の export）でTCP接続する。
  // Next のファイルトレースは既定の空実装しか拾わないので、本体を明示的に含める。
  // Prisma の生成クライアント（node_modules/.prisma/client）も同様に、Workers 用の edge 版と
  // WASM がトレースから漏れるので丸ごと含める。
  outputFileTracingIncludes: {
    "/*": [
      "./node_modules/pg-cloudflare/**/*",
      "./node_modules/.prisma/client/**/*",
    ],
  },
  // Next にはバンドルさせず、OpenNext 側で "workerd" 条件つきで解決させる（src/lib/prisma.ts）
  serverExternalPackages: ["@prisma/client", ".prisma/client"],
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
