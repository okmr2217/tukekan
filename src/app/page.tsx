import type { Metadata } from "next";
import { headers } from "next/headers";
import { getSession } from "@/lib/auth";
import { buildLpDemo } from "@/components/features/lp/demo-data";
import { LpNav } from "@/components/features/lp/lp-nav";
import { LpHero } from "@/components/features/lp/lp-hero";
import { LpPrinciples } from "@/components/features/lp/lp-principles";
import { LpHome } from "@/components/features/lp/lp-home";
import { LpRecord } from "@/components/features/lp/lp-record";
import { LpShare } from "@/components/features/lp/lp-share";
import { LpStats } from "@/components/features/lp/lp-stats";
import { LpInterest } from "@/components/features/lp/lp-interest";
import { LpFeatures } from "@/components/features/lp/lp-features";
import { LpWording } from "@/components/features/lp/lp-wording";
import { LpMaker } from "@/components/features/lp/lp-maker";
import { LpFinalCta, LpFooter } from "@/components/features/lp/lp-footer";

// モックアップの日付（「2分前」「次回の利子」など）は表示した時点を基準に組み立てるので、
// ビルド時に静的に書き出さず、リクエストごとに描画する（docs/14-lp-visual-assets.md 1-2）。
// ログインの有無でナビとCTAも変わる。
export const dynamic = "force-dynamic";

const TITLE = "ツケカン - 友だちとの貸し借り、ひとめでわかる。";
const DESCRIPTION =
  "友だちや家族との立て替え・貸し借りを、相手と金額を入れるだけで記録。相手ごとの残高と全体の差し引きを自動で出し、共有リンクを送れば相手も同じ数字を見られる、無料の貸し借り記録アプリ。";

/** og:image などに使う絶対URLの起点。リクエストのホストから組み立てる */
async function siteOrigin(): Promise<string> {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "tukekan.paritto.dev";
  const proto =
    h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

export async function generateMetadata(): Promise<Metadata> {
  const origin = await siteOrigin();
  const image = { url: `${origin}/og-image.png`, width: 1200, height: 630 };

  return {
    title: TITLE,
    description: DESCRIPTION,
    alternates: { canonical: origin },
    openGraph: {
      title: TITLE,
      description: DESCRIPTION,
      url: origin,
      siteName: "ツケカン",
      locale: "ja_JP",
      type: "website",
      images: [image],
    },
    twitter: {
      card: "summary_large_image",
      title: TITLE,
      description: DESCRIPTION,
      images: [image.url],
    },
  };
}

/**
 * LP（docs/13-lp-draft.md・docs/14-lp-visual-assets.md）。ログインの有無にかかわらず表示し、
 * ログイン中はナビとCTAを「アプリを開く」（/home）にする。
 * モックアップはアプリの実コンポーネントにダミーデータを渡して組んでいる。
 */
export default async function LandingPage() {
  const session = await getSession();
  const isLoggedIn = session !== null;
  const demo = buildLpDemo(new Date());

  return (
    <div className="flex min-h-screen flex-col">
      <LpNav isLoggedIn={isLoggedIn} />
      <main className="flex-1">
        <LpHero demo={demo} isLoggedIn={isLoggedIn} />
        <LpPrinciples />
        <LpHome demo={demo} />
        <LpRecord demo={demo} />
        <LpShare demo={demo} />
        <LpStats demo={demo} />
        <LpInterest demo={demo} />
        <LpFeatures />
        <LpWording now={demo.now} />
        <LpMaker />
        <LpFinalCta isLoggedIn={isLoggedIn} />
      </main>
      <LpFooter />
    </div>
  );
}
