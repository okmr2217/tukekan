import type { Metadata } from "next";
import Link from "next/link";
import { getPartnerByShareToken } from "@/actions/partner";
import { SharedBalanceCard } from "@/components/features/partner/balance-card";
import { formatDateTimeForDisplay } from "@/lib/dateUtils";
import { cn } from "@/lib/utils";

type Props = {
  params: Promise<{ token: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { token } = await params;
  const result = await getPartnerByShareToken(token);
  if (result.data) {
    return {
      title: `${result.data.partnerName}さんとの取引状況 - ツケカン`,
    };
  }
  return { title: "ツケカン" };
}

export default async function SharePage({ params }: Props) {
  const { token } = await params;
  const result = await getPartnerByShareToken(token);

  if (result.error) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="text-center">
          <p className="text-4xl mb-4">🔗</p>
          <h1 className="text-xl font-semibold mb-2">
            このリンクは無効または期限切れです
          </h1>
          <p className="text-sm text-muted-foreground">
            リンクの発行者に新しいリンクを依頼してください。
          </p>
        </div>
      </div>
    );
  }

  const { partnerName, ownerName, balance, transactions } = result.data!;

  return (
    <div className="min-h-screen">
      {/* Page header */}
      <div className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
        <div className="mx-auto flex min-h-14 max-w-lg flex-col justify-center px-4 py-2">
          <h1 className="font-medium leading-tight mb-1.5">
            {partnerName}さんとの取引
          </h1>
          <p className="text-xs text-muted-foreground">
            読み取り専用 · アクセス時点のデータを表示しています
          </p>
        </div>
      </div>

      <main className="mx-auto w-full max-w-lg px-4 py-6 space-y-6">
        {/* Balance card */}
        <div>
          <p className="text-xs font-medium tracking-widest text-emerald-600 uppercase mb-2">
            現在の残高
          </p>
          <SharedBalanceCard
            balance={balance}
            ownerName={ownerName}
            partnerName={partnerName}
          />
        </div>

        {/* Transaction list */}
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground mb-3">
            取引履歴（{transactions.length}件）
          </h2>
          {transactions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              取引履歴はありません
            </p>
          ) : (
            <div className="space-y-2">
              {transactions.map((tx) => {
                const isLending = tx.amount > 0;
                const absAmount = Math.abs(tx.amount);
                const absBalance = Math.abs(tx.runningBalance);
                return (
                  <div
                    key={tx.id}
                    className="rounded-xl border bg-card px-3 py-2 shadow-sm"
                  >
                    {/* 上段: タイプバッジ・日時 */}
                    <div className="flex items-center gap-1.5">
                      <span
                        className={cn(
                          "shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold leading-none",
                          isLending
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-red-100 text-red-600",
                        )}
                      >
                        {isLending ? "貸し" : "借り"}
                      </span>
                      <span className="text-xs font-medium text-muted-foreground">
                        {formatDateTimeForDisplay(new Date(tx.date))}
                      </span>
                    </div>
                    {/* 中段: メモ ／ 金額 */}
                    <div className="flex items-baseline justify-between gap-3 mt-0.5">
                      <span className="font-medium text-sm text-foreground truncate min-w-0">
                        {tx.description ?? (
                          <span className="text-muted-foreground/60 text-xs">
                            メモなし
                          </span>
                        )}
                      </span>
                      <span
                        className={cn(
                          "font-bold text-base tabular-nums shrink-0",
                          isLending ? "text-emerald-600" : "text-destructive",
                        )}
                      >
                        {isLending ? "+" : "-"}¥{absAmount.toLocaleString()}
                      </span>
                    </div>
                    {/* 下段: 残高 */}
                    <div className="flex justify-end mt-0.75">
                      <span className="text-xs text-muted-foreground mr-1">
                        残高
                      </span>
                      <span
                        className={cn(
                          "text-xs tabular-nums",
                          tx.runningBalance > 0
                            ? "text-emerald-600"
                            : tx.runningBalance < 0
                              ? "text-destructive"
                              : "text-muted-foreground",
                        )}
                      >
                        {tx.runningBalance < 0 ? "-" : ""}¥
                        {absBalance.toLocaleString()}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Promotion */}
        <div className="rounded-lg border bg-card p-5 shadow-sm text-center space-y-3">
          <p className="text-sm text-muted-foreground">
            友人間の貸し借りをかんたん管理
          </p>
          <Link
            href="/register"
            className="inline-flex w-full items-center justify-center rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow hover:bg-primary/90 transition-colors"
          >
            ツケカンに無料登録する
          </Link>
          <a
            href="https://paritto-dev-diary.vercel.app/products/tukekan"
            target="_blank"
            rel="noopener noreferrer"
            className="block text-xs text-muted-foreground hover:text-foreground underline underline-offset-4 transition-colors"
          >
            ツケカンについて詳しく見る
          </a>
        </div>

        {/* Footer note */}
        <p className="text-center text-xs text-muted-foreground pb-4">
          ツケカン — 友人間の貸し借り管理アプリ
        </p>
      </main>
    </div>
  );
}
