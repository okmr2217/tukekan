import type { NextConfig } from "next";
import { version } from "./package.json";

const nextConfig: NextConfig = {
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
