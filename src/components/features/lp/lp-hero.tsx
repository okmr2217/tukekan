import { ArrowDown, Plus } from "lucide-react";
import { BalanceSummaryCard } from "@/components/features/home/balance-summary-card";
import { PartnerCard } from "@/components/features/partner/partner-card";
import { TransactionCard } from "@/components/features/transaction/transaction-card";
import { getTransactionLabelOption } from "@/lib/transaction-labels";
import { formatYen } from "@/lib/transaction-wording";
import { cn } from "@/lib/utils";
import { LpCtaButton } from "./lp-nav";
import { MockPartnerChip, MockSideButtons } from "./mock-transaction-form";
import { LP_PARTNER_IDS, lpPartner, type LpDemo } from "./demo-data";

/** 表示時に 1 → 2 → 3 の順にふわっと出す。動きを減らす設定のときは出さない */
const REVEAL =
  "animate-in fade-in slide-in-from-bottom-3 duration-700 fill-mode-both motion-reduce:animate-none";

/**
 * HERO。見出しとCTAの横（スマホでは下）に「記録 → 取引 → ホームの残高」の流れを縦に見せる。
 * 1で記録した健太さんの残高が、3の一覧の先頭にそのまま出ていることで、記録がすぐ反映されるのを伝える。
 */
export function LpHero({ demo, isLoggedIn }: { demo: LpDemo; isLoggedIn: boolean }) {
  const kenta = lpPartner(demo, LP_PARTNER_IDS.kenta);
  const latest = kenta.transactions[0];
  const option = getTransactionLabelOption("BOTH");

  return (
    <section className="mx-auto grid max-w-[1160px] grid-cols-1 gap-12 px-4 py-14 md:grid-cols-2 md:items-center md:gap-16 md:px-8 md:py-24">
      <div>
        <h1 className="text-[30px] leading-[1.35] font-extrabold tracking-tight text-foreground sm:text-[38px] md:text-[50px]">
          友だちとの貸し借り、
          <br />
          ひとめでわかる。
        </h1>
        <p className="mt-4 text-[15px] font-bold text-primary md:text-base">
          相手と金額を入れるだけ。残高は自動で出る。
        </p>
        <p className="mt-6 max-w-[460px] text-[15px] leading-[1.9] text-muted-foreground md:text-[17px]">
          友だちや家族との立て替え・貸し借りは、何人もと続くうちに「誰に、いくら」がわからなくなりがち。ツケカンは、相手を選んで金額を入れるだけで、相手ごとの残高と全体の差し引きを自動で出す、貸し借り専用の記録アプリです。記録するのはあなただけ。相手にアプリを入れてもらう必要はありません。
        </p>
        <div className="mt-8">
          <LpCtaButton isLoggedIn={isLoggedIn} />
        </div>
      </div>

      <div className="rounded-3xl border bg-muted/50 p-3 shadow-sm sm:p-4 md:p-6">
        <div className="flex flex-col items-stretch gap-2">
          {/* 1. 記録する */}
          <div className={cn(REVEAL, "rounded-2xl border bg-card p-3.5 shadow-sm sm:p-4")}>
            <p className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
              <Plus className="size-3.5" />
              新しい取引
            </p>
            <div className="mt-3 space-y-2.5">
              <div className="flex items-center gap-3">
                <p className="w-8 shrink-0 text-xs text-muted-foreground">相手</p>
                <div>
                  <MockPartnerChip name={kenta.name} selected />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <p className="w-8 shrink-0 text-xs text-muted-foreground">金額</p>
                <div className="text-lg font-bold tabular-nums">{formatYen(latest.amount)}</div>
              </div>
              <MockSideButtons option={option} isLending className="px-2 text-[13px] sm:text-sm" />
              <div className="flex items-center gap-3">
                <p className="w-8 shrink-0 text-xs text-muted-foreground">用途</p>
                <div className="text-sm font-medium">{latest.purpose}</div>
              </div>
            </div>
          </div>

          <FlowArrow label="記録すると" className={cn(REVEAL, "delay-300")} />

          {/* 2. 取引になる */}
          <div className={cn(REVEAL, "delay-300")}>
            <TransactionCard
              transaction={latest}
              runningBalance={latest.runningBalance}
              viewpoint="owner"
              partnerName={kenta.name}
            />
          </div>

          <FlowArrow label="ホームの残高にすぐ反映" className={cn(REVEAL, "delay-600")} />

          {/* 3. ホームの残高に出る */}
          <div className={cn(REVEAL, "delay-600 space-y-2")}>
            <BalanceSummaryCard partners={demo.partners.map((p) => p.summary)} />
            {demo.partners.slice(0, 3).map((p) => (
              <PartnerCard
                key={p.id}
                partner={p.summary}
                linked={false}
                className={p.id === kenta.id ? "border-primary/50 ring-2 ring-primary/40" : undefined}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function FlowArrow({ label, className }: { label: string; className?: string }) {
  return (
    <div
      className={cn(
        "flex items-center justify-center gap-1.5 text-[11px] font-medium text-muted-foreground",
        className,
      )}
    >
      <ArrowDown className="size-4 shrink-0" />
      {label}
    </div>
  );
}
