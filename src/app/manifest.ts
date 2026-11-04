import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "ツケカン",
    short_name: "ツケカン",
    description: "友人間の貸し借りを簡単に管理するアプリ",
    start_url: "/home",
    scope: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#5ea500",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
