import { CalendarClock, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDateForDisplay } from "@/lib/date-utils";
import { ownerBalanceStatement } from "@/lib/balance-wording";
import { shouldShowBreakdown } from "@/lib/ledger-balance";
import {
  INTEREST_REPAYMENT_RULE_TEXT,
  WEEKDAY_LABELS,
  describeInterestRule,
} from "@/lib/ledger-interest";
import { BalanceCard } from "@/components/features/partner/balance-card";
import { LpBody, LpHeading, LpSection } from "./lp-section";
import {
  LP_PARTNER_IDS,
  LP_SHOTA_INTEREST,
  lpPartner,
  type LpDemo,
} from "./demo-data";

/**
 * 利子。前面に出しすぎず、ルールが文章で見えることを伝える（docs/14-lp-visual-assets.md 9章）。
 * 年利の入力欄と「週3%」「週5%」のプリセットは載せない。年156%・260%で、
 * LPで見せると高い利率を勧めているように見えるため（docs/13-lp-draft.md 要相談 2）。
 */
export function LpInterest({ demo }: { demo: LpDemo }) {
  const shota = lpPartner(demo, LP_PARTNER_IDS.shota);
  const interestLedger = shota.ledgers.find((l) => l.annualInterestRate > 0)!;
  const preview = interestLedger.nextInterest;
  const maxRate = Math.max(0, ...shota.ledgers.map((l) => l.annualInterestRate));
  const { breakdown } = shota.summary;

  return (
    <LpSection tinted>
      <div className="max-w-[640px]">
        <LpHeading lines={["利子の約束も、", "ルールどおり自動で。"]} />
        <LpBody className="mt-6">
          口座に年利を設定すると、決めた曜日に週1回、利息が自動で記録されます。利息は元本と分けて「未払利息」としてたまり、返済はまず利息から充てられます。設定画面には「毎週{WEEKDAY_LABELS[LP_SHOTA_INTEREST.interestAccrualWeekday]}曜日に、元本に対して年利◯%の利息が発生します」とルールが文章で出て、次回の発生日と見込み額もその場で確かめられます。共有リンクのページにも同じルールが出るので、あとから「聞いてない」になりません。
        </LpBody>
      </div>

      <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-8">
        <div>
          <p className="mb-3 text-sm font-bold text-foreground">{shota.name}さんの残高</p>
          <BalanceCard
            balance={breakdown.total}
            statement={ownerBalanceStatement(breakdown.total, shota.name)}
            breakdown={shouldShowBreakdown(breakdown, maxRate) ? breakdown : undefined}
            ledgers={shota.ledgers}
          />
        </div>

        <div>
          <p className="mb-3 text-sm font-bold text-foreground">口座の設定（{interestLedger.title}）</p>
          <div className="space-y-3">
            {/* 利子のルール説明。文言と次回の見込みはアプリの設定画面と同じ関数で出す */}
            <div className="space-y-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3.5 dark:border-amber-900 dark:bg-amber-950/40">
              <p className="text-sm leading-relaxed font-medium">
                {describeInterestRule(LP_SHOTA_INTEREST)}
              </p>
              <p className="text-xs leading-relaxed text-muted-foreground">
                {INTEREST_REPAYMENT_RULE_TEXT}
              </p>
              <div className="space-y-1 rounded-lg bg-background/70 px-3 py-2 text-xs">
                <p className="flex items-center justify-between gap-2">
                  <span className="text-muted-foreground">
                    {preview.compounding ? "元本＋未払利息" : "元本"}
                  </span>
                  <span className="font-medium tabular-nums">
                    ¥{preview.base.toLocaleString()}
                  </span>
                </p>
                <p className="flex items-center justify-between gap-2">
                  <span className="text-muted-foreground">
                    次回（{formatDateForDisplay(preview.nextDate)}）
                  </span>
                  <span className="font-semibold text-amber-600 tabular-nums dark:text-amber-400">
                    +¥{preview.amount.toLocaleString()}
                  </span>
                </p>
              </div>
            </div>

            {/* 発生曜日（設定画面と同じ見た目。押しても変わらない） */}
            <div className="space-y-3 rounded-xl border bg-card px-4 py-4 shadow-sm">
              <div className="flex items-center gap-1.5">
                <CalendarClock className="size-3.5 text-muted-foreground" />
                <p className="text-sm font-medium">利息が発生する曜日</p>
              </div>
              <div className="grid grid-cols-7 gap-1">
                {WEEKDAY_LABELS.map((label, index) => (
                  <span
                    key={label}
                    className={cn(
                      "rounded-lg border py-2 text-center text-sm",
                      index === LP_SHOTA_INTEREST.interestAccrualWeekday
                        ? "border-foreground bg-foreground font-semibold text-background"
                        : "border-border",
                    )}
                  >
                    {label}
                  </span>
                ))}
              </div>
            </div>

            {/* 利息のかかり方 */}
            <div className="space-y-3 rounded-xl border bg-card px-4 py-4 shadow-sm">
              <div className="flex items-center gap-1.5">
                <TrendingUp className="size-3.5 text-muted-foreground" />
                <p className="text-sm font-medium">利息のかかり方</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: false, title: "単利", hint: "元本にだけ利息がつく" },
                  { value: true, title: "複利", hint: "元本＋未払利息に利息がつく" },
                ].map((option) => (
                  <div
                    key={option.title}
                    className={cn(
                      "rounded-lg border px-3 py-2.5",
                      LP_SHOTA_INTEREST.interestCompounding === option.value
                        ? "border-foreground bg-muted"
                        : "border-border",
                    )}
                  >
                    <p className="text-sm font-medium">{option.title}</p>
                    <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">
                      {option.hint}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <p className="mt-8 text-sm text-muted-foreground">
        共有リンクのページにも、同じルールが表示されます。
      </p>
    </LpSection>
  );
}
