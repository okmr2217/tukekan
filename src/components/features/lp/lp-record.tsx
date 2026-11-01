import { topPurposes } from "@/lib/movement-stats";
import { getTransactionLabelOption } from "@/lib/transaction-labels";
import { LpBody, LpHeading, LpSection } from "./lp-section";
import { PhoneFrame } from "./phone-frame";
import { AnnotationMark, MockTransactionSheet } from "./mock-transaction-form";
import type { LpDemo } from "./demo-data";

const NOTES = [
  {
    n: 1,
    title: "相手",
    body: "最近記録した相手から順に並びます。",
  },
  {
    n: 2,
    title: "金額とボタン",
    body: "押すのは、お金を「渡した」か「受け取った」かの2つだけ。ボタンの言い方は、使い方に合わせて3種類から選べます。",
  },
  {
    n: 3,
    title: "用途",
    body: "これまでの用途が、よく使う順に候補に出ます。「麻雀」「ランチ」はタップで入ります。",
  },
] as const;

/** 記録フォーム。「迷わず入れられる」「必須は少ない」を見せる（docs/14-lp-visual-assets.md 6章） */
export function LpRecord({ demo }: { demo: LpDemo }) {
  const suggestions = topPurposes(demo.transactions, 4).map((p) => p.purpose);

  return (
    <LpSection>
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[410px_minmax(0,1fr)] lg:grid-rows-[auto_1fr] lg:gap-x-16 lg:gap-y-10">
        <div className="lg:col-start-2 lg:row-start-1 lg:self-end">
          <LpHeading lines={["相手、金額、用途。", "それだけ。"]} />
          <LpBody className="mt-6">
            右下の「＋」から、相手を選んで、金額を入れて、用途をひとこと。必ず入れるのは相手と金額だけです。相手は最近記録した順に並び、用途はこれまで使ったものがよく使う順に候補に出るので、「麻雀」「ランチ」はタップで入ります。日時はふつう「現在」のまま。あとから思い出した貸し借りは、日時を指定して記録できます。
          </LpBody>
        </div>

        <div className="lg:col-start-1 lg:row-span-2 lg:row-start-1">
          <PhoneFrame label="新しい取引の画面" screenClassName="h-[720px]">
            <MockTransactionSheet
              partners={demo.partners.map((p) => p.name)}
              option={getTransactionLabelOption("BOTH")}
              suggestions={suggestions}
              now={demo.now}
            />
          </PhoneFrame>
        </div>

        <ol className="space-y-4 lg:col-start-2 lg:row-start-2">
          {NOTES.map(({ n, title, body }) => (
            <li key={n} className="flex gap-3 rounded-2xl border bg-card px-4 py-3.5 shadow-sm">
              <AnnotationMark n={n} className="mt-0.5" />
              <div className="min-w-0">
                <p className="text-sm font-bold text-foreground">{title}</p>
                <p className="mt-0.5 text-[13px] leading-relaxed text-muted-foreground">
                  {body}
                </p>
              </div>
            </li>
          ))}
          <li className="px-1 text-[13px] leading-relaxed text-muted-foreground">
            ボタンの言い方と、記録したあとの「貸した」「返済された」の言い分けは、
            <a href="#wording" className="font-medium text-primary underline-offset-4 hover:underline">
              下のデモ
            </a>
            で試せます。
          </li>
        </ol>
      </div>
    </LpSection>
  );
}
