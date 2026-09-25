import { redirect } from "next/navigation";
import { getCurrentUser } from "@/actions/auth";
import { MobileHeader } from "@/components/layouts/mobile-header";
import {
  BookOpen,
  ArrowLeftRight,
  Archive,
  Users,
  HandCoins,
  Percent,
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
      { label: "相手を登録する", body: "ホームの「相手を追加」から貸し借りをする相手を追加します。" },
      { label: "取引を記録する", body: "右下の＋ボタンから貸した・借りたを入力します。相手のページで押すと、その相手が選ばれた状態で開きます。" },
      { label: "残高を確認する", body: "ホームで全体の残高と相手ごとの残高、最近の取引を確認できます。貸し借りの流れや返済の傾向は「統計」ページで見られます。" },
    ],
  },
  {
    icon: ArrowLeftRight,
    heading: "取引について",
    items: [
      { title: "貸し・借りの考え方", body: "金額の向きは2択です。「貸した・返済した」は相手にお金を貸したときと、借りていたぶんを返したとき。「借りた・返済された」は相手からお金を借りたときと、貸していたぶんを返してもらったときに選びます。ボタンに出す言い方は設定ページで切り替えられます。" },
      { title: "色の見かた", body: "緑はあなたが受け取る側（債権）、赤はあなたが返す側（債務）を表します。共有リンクのページでは相手から見た向きで表示されるので、色も逆になります。" },
      { title: "用途", body: "任意で100文字以内の用途を残せます（例:「ランチ代」「映画チケット」）。過去に入力した用途がサジェストされるので入力が楽になります。" },
      { title: "メモ", body: "任意で1000文字以内のメモを残せます。改行を含む複数行のテキストが書けるので、割り勘の内訳や返済の約束など詳しい内容を記録できます。" },
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
      { title: "追加・編集", body: "ホームで貸し借りの相手を追加し、相手のページで名前の変更などができます。" },
      { title: "相手のアーカイブ", body: "やり取りが一段落した相手をアーカイブすると、ホームの相手一覧と取引フォームの相手の候補に出なくなります。貸し借りの記録と残高はそのまま残り、ホームの合計・取引の一覧・統計にも含まれます。アーカイブ中は利息が付きません。" },
      { title: "アーカイブ済みの相手を見る", body: "ホームの相手一覧の下にある「アーカイブ済みの相手」から一覧を開けます。解除は相手の設定ページから行います。" },
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
    icon: Percent,
    heading: "口座と利子",
    items: [
      { title: "口座とは", body: "相手ごとに複数の「口座」を作れます。口座は貸し借りのまとまりで、利率や利息の発生タイミングは口座ごとに設定します。口座を分けなければ「通常」口座に記録されます。多くの場合は相手ごとに1口座のままで十分です。" },
      { title: "口座ごとに見る", body: "相手ページには、その相手のすべての口座の取引がまとめて並びます。口座カードには残高（利子ありの口座は元本と未払利息の内訳）が出ていて、タップするとその口座だけに絞り込めます。" },
      { title: "利率は年利で指定", body: "口座の設定ページで年利（%）を指定します。1週間ぶんの利息は「年利 ÷ 52週」で計算します。例えば年利260%なら週5%です。0%にすると無利子になります。" },
      { title: "利息が発生するタイミング", body: "口座ごとに選んだ曜日の0時（日本時間）に、週1回だけ利息が発生します。残高がプラス（相手に貸している状態）の口座だけが対象です。" },
      { title: "利息は元本と分けて管理", body: "発生した利息は元本には足さず「未払利息」としてたまります。残高カードには合計と、その内訳（元本／未払利息）が表示されます。" },
      { title: "返済はまず利息から", body: "返済を記録すると、まず未払利息に充当されます。未払利息が0になってから元本が減ります。" },
      { title: "単利と複利", body: "単利なら元本にだけ利息がつきます。複利にすると、元本と未払利息の合計に対して利息がつきます。口座ごとに選べます。" },
    ],
  },
  {
    icon: BarChart2,
    heading: "統計の見方",
    items: [
      { title: "全体の統計", body: "ボトムバーの「統計」から開きます。期間（直近12ヶ月・今年・全期間）を選んで、貸し借りの流れ、月ごとの推移、返済の傾向、相手ごとの集計、利息を確認できます。" },
      { title: "相手ごとの統計", body: "相手ページのヘッダー右の統計アイコンから開きます。残高の推移や、その相手がどれくらいで返してくれているか（返済の傾向）を確認できます。口座が複数ある相手は口座ごとに絞り込めます。" },
      { title: "名目の分け方", body: "取引は「貸した」「返済された」「借りた」「返済した」「利息」に分けて集計します。残高をまたぐ取引は分けて数えます（例: 3,000円貸している相手から5,000円受け取ったら、返済された3,000円と借りた2,000円）。" },
      { title: "返済の傾向", body: "貸し借りは古いものから順に返済で埋まるとみなして、返ってくるまでの平均日数・1ヶ月以内に返ってきた割合・まだ返っていない金額を出します。" },
      { title: "集計対象", body: "アーカイブ済みの取引は含みません。アーカイブ済みの相手は含みます。" },
    ],
  },
  {
    icon: Share2,
    heading: "共有リンク",
    items: [
      { title: "共有リンクとは", body: "「相手」ページから共有リンクを発行できます。リンクを知っている人はログインなしで、その相手とのすべての口座の残高と取引履歴を見ることができます。公開ページでも口座ごとに絞り込めます。" },
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
      <MobileHeader title="ヘルプ" backHref="/menu" />
      <main className="px-4 pt-4 pb-20 md:pb-4 space-y-4 max-w-lg mx-auto w-full">
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
