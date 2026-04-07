import type { Metadata } from "next";
import { getPartnerByShareToken } from "@/actions/partner";
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

  const { partnerName, balance, transactions } = result.data!;

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
        <div className="mx-auto flex h-14 max-w-lg items-center px-4">
          <span className="text-2xl font-logo text-primary tracking-tight">
            <span className="text-[#e07326]">ツケ</span>カン
          </span>
        </div>
      </header>

      <main className="mx-auto w-full max-w-lg px-4 py-6 space-y-6">
        {/* Title */}
        <div>
          <h1 className="text-lg font-bold">
            {partnerName}さんとの取引状況
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            読み取り専用 · アクセス時点のデータを表示しています
          </p>
        </div>

        {/* Balance card */}
        <div className="rounded-lg border bg-card p-5 shadow-sm">
          <p className="text-sm text-muted-foreground mb-1">現在の残高</p>
          <p
            className={cn(
              "text-3xl font-bold tabular-nums",
              balance < 0 ? "text-destructive" : "text-foreground",
            )}
          >
            {balance < 0 ? "-" : ""}¥{Math.abs(balance).toLocaleString()}
          </p>
          {balance > 0 && (
            <p className="text-xs text-muted-foreground mt-1">貸している金額</p>
          )}
          {balance < 0 && (
            <p className="text-xs text-muted-foreground mt-1">借りている金額</p>
          )}
          {balance === 0 && (
            <p className="text-xs text-muted-foreground mt-1">精算済み</p>
          )}
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
              {transactions.map((tx) => (
                <div
                  key={tx.id}
                  className="rounded-lg border bg-card px-4 py-3 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-muted-foreground truncate">
                        {tx.description ?? "（メモなし）"}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {formatDateTimeForDisplay(new Date(tx.date))}
                      </p>
                    </div>
                    <span
                      className={cn(
                        "text-base font-bold tabular-nums shrink-0",
                        tx.amount < 0 ? "text-destructive" : "text-foreground",
                      )}
                    >
                      {tx.amount < 0 ? "-" : "+"}¥
                      {Math.abs(tx.amount).toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer note */}
        <p className="text-center text-xs text-muted-foreground pb-4">
          ツケカン — 友人間の貸し借り管理アプリ
        </p>
      </main>
    </div>
  );
}
