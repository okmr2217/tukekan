import { redirect } from "next/navigation";
import { getCurrentUser } from "@/actions/auth";
import { PageHeader } from "@/components/layouts/page-header";
import {
  BookOpen,
  ArrowLeftRight,
  Archive,
  Users,
  HandCoins,
  BarChart2,
  Share2,
  Settings,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

type HelpItem = { title: string; body: string };

type HelpSection = {
  icon: LucideIcon;
  heading: string;
  intro?: string;
  introSub?: string;
  steps?: { label: string; body: string }[];
  items?: HelpItem[];
  plain?: string;
};

const SECTIONS: HelpSection[] = [
  {
    icon: BookOpen,
    heading: "ツケカンとは",
    intro: "友人や家族との間のお金の貸し借りを、自分ひとりで記録・管理するアプリです。",
    introSub: "誰にいくら貸したか・借りたかをサクッとメモして、残高をいつでも確認できます。",
  },
  {
    icon: ArrowLeftRight,
    heading: "基本的な使い方",
    steps: [
      { label: "相手を登録する", body: "「相手」ページで貸し借りをする相手を追加します。" },
      { label: "取引を記録する", body: "「取引」ページで貸した・借りたを入力します。" },
      { label: "残高を確認する", body: "「統計」ページで残高や累計金額をチェックします。" },
    ],
  },
  {
    icon: ArrowLeftRight,
    heading: "取引について",
    items: [
      { title: "貸し・借りの考え方", body: "「貸し」は相手にお金を貸したとき、「借り」は相手からお金を借りたときに選びます。" },
      { title: "メモ", body: "任意で100文字以内のメモを残せます（例:「ランチ代」「映画チケット」）。過去に入力したメモがサジェストされるので入力が楽になります。" },
      { title: "日時", body: "取引が発生した日時を記録できます。入力しない場合は現在の日時が使われます。" },
    ],
  },
  {
    icon: Archive,
    heading: "取引のアーカイブ",
    items: [
      { title: "アーカイブとは", body: "アーカイブすると残高の計算対象から外れます。取引一覧にはグレーで表示され、フィルタで非表示にもできます。" },
      { title: "削除との違い", body: "削除すると完全に消えますが、アーカイブは記録として残ります。アーカイブ解除すると再び計算対象に戻ります。" },
    ],
  },
  {
    icon: Users,
    heading: "相手の管理",
    items: [
      { title: "追加・編集", body: "「相手」ページで貸し借りの相手を追加・編集できます。" },
      { title: "相手のアーカイブ", body: "相手をアーカイブすると、その相手との取引がすべて一覧・統計から非表示になります。「もうこの人とのやり取りは終わった」というときに使うと便利です。アーカイブ解除で元に戻ります。" },
    ],
  },
  {
    icon: HandCoins,
    heading: "精算",
    items: [
      { title: "精算のやり方", body: "「相手」ページから精算できます。精算すると、現在の残高をゼロにする取引が自動で作成されます。" },
      { title: "精算後の取引", body: "例えば相手に500円貸している状態で精算すると、500円借りた取引が自動で作られて残高がゼロになります。作られた取引は通常の取引と同じなので、後から編集やアーカイブもできます。" },
    ],
  },
  {
    icon: BarChart2,
    heading: "統計の見方",
    items: [
      { title: "相手タブ", body: "相手ごとの現在残高・累計の貸した金額・累計の借りた金額・取引回数を確認できます。" },
      { title: "全体タブ", body: "すべての相手を合計した現在残高・累計の貸した金額・累計の借りた金額を確認できます。" },
      { title: "集計対象", body: "アーカイブ済みの取引・相手は統計に含まれません。" },
    ],
  },
  {
    icon: Share2,
    heading: "共有リンク",
    items: [
      { title: "共有リンクとは", body: "「相手」ページから共有リンクを発行できます。リンクを知っている人はログインなしでその相手との残高と取引履歴を見ることができます。" },
      { title: "有効期限・再生成", body: "有効期限は90日間です。リンクを再生成すると古いリンクは無効になります。" },
      { title: "プライバシー", body: "共有ページにはアカウント名やメールアドレスは表示されません。" },
    ],
  },
  {
    icon: Settings,
    heading: "アカウント設定",
    plain: "設定ページで表示名・パスワード・テーマ（ダーク/ライト）を変更できます。",
  },
];

export default async function HelpPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <div className="flex flex-col">
      <PageHeader title="ヘルプ" description="ツケカンの使い方" />
      <main className="px-4 pt-4 pb-20 md:pb-4 space-y-4">
        {SECTIONS.map((section) => (
          <section key={section.heading}>
            <h2 className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1.5">
              <section.icon className="h-3.5 w-3.5" />
              {section.heading}
            </h2>

            {section.intro && (
              <div className="bg-card rounded-lg border border-border p-4 space-y-1.5">
                <p className="text-sm">{section.intro}</p>
                {section.introSub && (
                  <p className="text-sm text-muted-foreground">{section.introSub}</p>
                )}
              </div>
            )}

            {section.steps && (
              <div className="bg-card rounded-lg border border-border overflow-hidden">
                {section.steps.map((step, i) => (
                  <div
                    key={step.label}
                    className={`flex items-start gap-3 p-4${i < section.steps!.length - 1 ? " border-b border-border" : ""}`}
                  >
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold">
                      {i + 1}
                    </span>
                    <div>
                      <div className="text-sm font-medium">{step.label}</div>
                      <div className="text-sm text-muted-foreground">{step.body}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {section.items && (
              <div className="bg-card rounded-lg border border-border overflow-hidden">
                {section.items.map((item, i) => (
                  <div
                    key={item.title}
                    className={`p-4 space-y-0.5${i < section.items!.length - 1 ? " border-b border-border" : ""}`}
                  >
                    <div className="text-sm font-medium">{item.title}</div>
                    <div className="text-sm text-muted-foreground">{item.body}</div>
                  </div>
                ))}
              </div>
            )}

            {section.plain && (
              <div className="bg-card rounded-lg border border-border p-4 space-y-0.5">
                <div className="text-sm text-muted-foreground">{section.plain}</div>
              </div>
            )}
          </section>
        ))}
      </main>
    </div>
  );
}
