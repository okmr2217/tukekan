import { CalendarClock, EyeOff, UserRoundX } from "lucide-react";
import { LpBody, LpHeading, LpSection } from "./lp-section";
import { ShareScreens } from "./share-screens";
import {
  LP_OWNER_NAME,
  LP_PARTNER_IDS,
  LP_TAKUMI_SHARE_NOTE,
  lpPartner,
  type LpDemo,
} from "./demo-data";

const NOTES = [
  { icon: UserRoundX, text: "相手はアカウントもログインもいりません" },
  { icon: CalendarClock, text: "有効期限は90日。いつでも無効にできます" },
  { icon: EyeOff, text: "ほかの相手の記録や、あなたのメールアドレスは見えません" },
] as const;

/**
 * 共有リンク。「リンクを送るだけ」と「相手の立場の言葉で表示される」の2点を見せる。
 * 利子のない拓海さんで見せると、内訳が出ずに反転だけが目に入る（docs/14-lp-visual-assets.md 7章）。
 */
export function LpShare({ demo }: { demo: LpDemo }) {
  const takumi = lpPartner(demo, LP_PARTNER_IDS.takumi);

  return (
    <LpSection tinted>
      <div className="mx-auto mb-12 max-w-[640px] md:text-center">
        <LpHeading
          lines={["リンクを送るだけで、", "同じ数字を見られる。"]}
          align="center"
          className="text-left md:text-center"
        />
        <LpBody className="mt-6 text-left">
          相手のページで共有リンクを発行して、LINEやメールで送るだけ。相手はアカウントもログインもなしで、あなたとの残高と取引の記録を開けます。公開ページは相手が読むためのページなので、言葉も色も相手の立場に入れ替わります。あなたの「貸した」は、相手の画面では「借りた」に。「{takumi.name}さんから受け取ります」は「{takumi.name}さんは{LP_OWNER_NAME}さんに返します」に。「{LP_TAKUMI_SHARE_NOTE}」のような共有メモも添えられます。
        </LpBody>
      </div>

      <ShareScreens
        partner={takumi}
        ownerName={LP_OWNER_NAME}
        shareNote={LP_TAKUMI_SHARE_NOTE}
        now={demo.now}
      />

      <ul className="mx-auto mt-10 grid max-w-[1040px] grid-cols-1 gap-3 md:grid-cols-3">
        {NOTES.map(({ icon: Icon, text }) => (
          <li
            key={text}
            className="flex items-center gap-2.5 rounded-2xl border bg-card px-4 py-3 text-[13px] leading-snug text-foreground"
          >
            <Icon className="size-4 shrink-0 text-primary" />
            {text}
          </li>
        ))}
      </ul>
    </LpSection>
  );
}
