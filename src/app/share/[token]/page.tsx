import type { Metadata } from "next";
import Link from "next/link";
import { getPartnerByShareToken } from "@/actions/partner";
import { SharedBalanceCard } from "@/components/features/partner/balance-card";
import { PartnerNoteSection } from "@/components/features/partner/partner-note-section";
import { SharedTransactionCard } from "@/components/features/transaction/shared-transaction-card";

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

  const { partnerName, ownerName, balance, transactions, notes } = result.data!;

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

        {/* Notes */}
        {notes.length > 0 && (
          <PartnerNoteSection
            partnerId=""
            notes={notes}
            readOnly
          />
        )}

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
                <SharedTransactionCard key={tx.id} transaction={tx} />
              ))}
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
