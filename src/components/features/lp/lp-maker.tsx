import { LpBody, LpHeading, LpSection } from "./lp-section";

/** 時期は git の履歴から（docs/14-lp-visual-assets.md 11章）。9月は2〜3項目に絞る */
const TIMELINE = [
  { when: "2025年12月", what: "つくりはじめる（スプレッドシートでの管理からの乗り換え）" },
  { when: "2026年3月", what: "最初のリリース" },
  { when: "2026年4月", what: "共有リンクで、相手に記録を見せられるように" },
  { when: "2026年8月", what: "相手ごとに口座を分けて、毎週の利子を自動で記録できるように" },
  {
    when: "2026年9月",
    what: "「貸した」「返済された」を残高から言い分ける／ボタンの言い方を選べるように／返済の傾向がわかる統計",
  },
] as const;

/** つくった人のこと。当事者が作って、いまも使い続けていることを短く伝える */
export function LpMaker() {
  return (
    <LpSection>
      <div className="grid grid-cols-1 gap-10 md:grid-cols-2 md:gap-16">
        <div>
          <LpHeading lines={["貸し借りの多い開発者が、", "自分のために作りました。"]} />
          <LpBody className="mt-6">
            ツケカンは、友だちとの貸し借りが多い開発者が、スプレッドシートでの管理に限界を感じて作ったアプリです。約1年、自分の貸し借りを実際に記録しながら、気になったところを直し続けてきました。
          </LpBody>
        </div>

        <ol className="relative space-y-6 border-l border-border pl-6 md:mt-2">
          {TIMELINE.map(({ when, what }) => (
            <li key={when} className="relative">
              <span className="absolute top-1.5 -left-[29px] size-2.5 rounded-full border-2 border-background bg-primary ring-1 ring-primary/40" />
              <p className="text-xs font-bold text-primary tabular-nums">{when}</p>
              <p className="mt-1 text-sm leading-relaxed text-foreground">{what}</p>
            </li>
          ))}
        </ol>
      </div>
    </LpSection>
  );
}
