import { ChevronRight, CircleHelp, UserPlus } from "lucide-react";
import { BalanceSummaryCard } from "@/components/features/home/balance-summary-card";
import { PartnerCard } from "@/components/features/partner/partner-card";
import { TransactionCard } from "@/components/features/transaction/transaction-card";
import { LpBody, LpHeading, LpSection } from "./lp-section";
import { MockAppHeader, MockHeaderIcon, PhoneFrame } from "./phone-frame";
import type { LpDemo } from "./demo-data";

/** ホームの「最近の取引」に出す件数（モックでは3件にとどめる） */
const RECENT_COUNT = 3;

/**
 * ホーム。機能の説明より、ホーム画面そのものを主役にする（docs/14-lp-visual-assets.md 5章）。
 * 最初に見えている範囲に、全体の残高と相手カードの4〜5件目までが入り、緑・赤・グレーがすべて目に入る。
 */
export function LpHome({ demo }: { demo: LpDemo }) {
  return (
    <LpSection tinted>
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_410px] lg:grid-rows-[auto_1fr] lg:gap-x-16 lg:gap-y-8">
        <div className="lg:self-end">
          <LpHeading lines={["誰に、いくら。", "ホームでぜんぶわかる。"]} />
          <LpBody className="mt-6">
            ホームを開くと、すべての相手をまとめた差し引きの残高と、「貸している」「借りている」の合計、そして相手ごとの残高が並びます。緑はあなたが受け取る側、赤は返す側、グレーは精算済み。この色の決まりは、取引・残高・統計のどの画面でも同じです。
          </LpBody>
          <p className="mt-4 text-sm leading-[1.8] text-muted-foreground">
            最近の取引もホームでそのまま確かめられます。やり取りが一段落した相手は、アーカイブすれば一覧からすっきり片付きます。
          </p>
        </div>

        <div className="lg:col-start-2 lg:row-span-2 lg:row-start-1">
          <PhoneFrame
            label="ホーム画面の例（スクロールできます）"
            screenClassName="h-[700px] md:h-[820px]"
            scrollable
            bottomBar="home"
            fab
          >
            <HomeScreen demo={demo} />
          </PhoneFrame>
          <p className="mt-3 text-center text-[11px] text-muted-foreground">
            画面の中はスクロールできます
          </p>
        </div>

        <ColorLegend />
      </div>
    </LpSection>
  );
}

function HomeScreen({ demo }: { demo: LpDemo }) {
  const partners = demo.partners.map((p) => p.summary);

  return (
    <>
      <MockAppHeader
        title="ホーム"
        actions={
          <MockHeaderIcon>
            <CircleHelp />
          </MockHeaderIcon>
        }
      />
      <div className="space-y-6 px-4 pt-3 pb-20">
        <BalanceSummaryCard partners={partners} />

        <section>
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-xs text-muted-foreground">相手ごとの残高</h3>
            <span className="-mr-2 inline-flex h-7 items-center px-3 text-xs font-medium">
              <UserPlus className="mr-1 size-3.5" />
              相手を追加
            </span>
          </div>
          <div className="space-y-2">
            {partners.map((partner) => (
              <PartnerCard key={partner.id} partner={partner} linked={false} />
            ))}
          </div>
        </section>

        <section>
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-xs text-muted-foreground">最近の取引</h3>
            <span className="inline-flex items-center text-xs text-primary">
              すべて見る
              <ChevronRight className="size-3.5" />
            </span>
          </div>
          <div className="space-y-2">
            {demo.transactions.slice(0, RECENT_COUNT).map((t) => (
              <TransactionCard
                key={t.id}
                transaction={t}
                runningBalance={t.runningBalance}
                viewpoint="owner"
                partnerName={t.partnerName}
              />
            ))}
          </div>
        </section>
      </div>
    </>
  );
}

const LEGEND = [
  { dot: "bg-emerald-500", label: "緑", meaning: "あなたが受け取る" },
  { dot: "bg-red-500", label: "赤", meaning: "あなたが返す" },
  { dot: "bg-muted-foreground/50", label: "グレー", meaning: "精算済み" },
] as const;

function ColorLegend() {
  return (
    <ul className="flex flex-wrap gap-x-5 gap-y-2 rounded-2xl border bg-card px-4 py-3 text-[13px] lg:self-start">
      {LEGEND.map(({ dot, label, meaning }) => (
        <li key={label} className="flex items-center gap-1.5">
          <span className={`size-2 rounded-full ${dot}`} />
          <span className="font-semibold text-foreground">{label}</span>
          <span className="text-muted-foreground">＝{meaning}</span>
        </li>
      ))}
    </ul>
  );
}
