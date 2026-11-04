import type { Metadata } from "next";
import { getSession } from "@/lib/auth";
import { MobileHeader } from "@/components/layouts/mobile-header";
import { PwaInstallGuide } from "@/components/features/app-install/pwa-install-guide";
import { Smartphone, Maximize2, BadgeCheck } from "lucide-react";

export const metadata: Metadata = {
  title: "アプリとして使う - ツケカン",
  description: "ツケカンをスマートフォンのホーム画面に追加して、アプリのように使う手順です。",
};

const BENEFITS = [
  { icon: Smartphone, title: "ホーム画面から1タップ", text: "アイコンから開くと、すぐにホームの残高一覧が出ます。" },
  { icon: Maximize2, title: "画面を広く使える", text: "アドレスバーのない全画面で表示されます。" },
  { icon: BadgeCheck, title: "ストア不要・無料", text: "アプリストアからのダウンロードはいりません。" },
] as const;

const NOTES = [
  "ホーム画面のアプリを開くと、ホームから始まります。ログインしていなければログイン画面が出ます。",
  "iPhone・iPad では、ホーム画面のアプリと Safari・Chrome でログイン状態が共有されません。はじめて開いたときは、アプリの中でログインし直してください。",
  "やめるときはアイコンを長押しして削除します。アプリを削除しても、記録した取引は消えません。",
  "PC の Chrome・Edge でも、アドレスバー右端のインストールのアイコンから追加できます。",
] as const;

/**
 * ホーム画面に追加する案内。ログイン前のスマホからも見られるように、使い方ガイドと同じく
 * (main) の外に置く。メニューの「アプリとして使う」と LP のフッターからリンクする。
 * オンボーディングの最初のステップも同じ手順（PwaPlatformSteps）を使う。
 */
export default async function AppInstallPage() {
  const session = await getSession();

  return (
    <div className="flex min-h-screen flex-col">
      <MobileHeader title="アプリとして使う" backHref={session ? "/menu" : "/"} />

      <main className="px-4 pt-4 pb-10 max-w-lg mx-auto w-full space-y-8">
        <section className="space-y-2">
          <h2 className="text-xl font-bold">ツケカンをホーム画面に追加する</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            ホーム画面に追加すると、ツケカンをアプリのように使えます。
          </p>
        </section>

        <ul className="space-y-2">
          {BENEFITS.map(({ icon: Icon, title, text }) => (
            <li
              key={title}
              className="flex items-start gap-3 rounded-xl border bg-card px-4 py-3.5 shadow-sm"
            >
              <div className="size-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <Icon className="h-4 w-4 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium">{title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{text}</p>
              </div>
            </li>
          ))}
        </ul>

        <section className="space-y-3">
          <h2 className="text-base font-bold">設定手順</h2>
          <PwaInstallGuide />
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-bold">補足</h2>
          <ul className="list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-muted-foreground">
            {NOTES.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        </section>
      </main>
    </div>
  );
}
