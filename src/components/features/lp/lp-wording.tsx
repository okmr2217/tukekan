import { LpBody, LpHeading, LpSection } from "./lp-section";
import { WordingDemo } from "./wording-demo";
import { LP_OWNER_NAME } from "./demo-data";

/**
 * ことばの設計。お金の向きのややこしさを「ことば」で解決していることを、触れるデモで体感させる
 * （docs/13-lp-draft.md 9章）。機能紹介のあと・最終CTAの手前に置く。
 */
export function LpWording({ now }: { now: Date }) {
  return (
    <LpSection id="wording" tinted>
      <div className="mx-auto mb-10 max-w-[640px] md:text-center">
        <LpHeading
          lines={["「貸方・借方」は、", "出てきません。"]}
          className="md:text-center"
        />
        <LpBody className="mt-6 text-left">
          お金のやり取りの記録は、意外とややこしいもの。「返済された」はプラス？ マイナス？ ツケカンで押すボタンは、お金を「渡した」か「受け取った」かの2つだけ。ボタンの言い方は、貸すことが多い人・借りることが多い人・両方の人に合わせて3種類から選べます。記録したあとは、それまでの残高を見て「貸した」「返済された」「借りた」「返済した」をツケカンが自動で言い分けます。
        </LpBody>
        <p className="mt-4 text-left text-sm font-bold text-foreground md:text-center">
          ボタンを押して、試してみてください。
        </p>
      </div>

      <WordingDemo ownerName={LP_OWNER_NAME} partnerName="健太" initialNow={now.getTime()} />
    </LpSection>
  );
}
