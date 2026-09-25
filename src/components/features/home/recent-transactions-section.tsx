import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { TransactionWithPartner } from "@/actions/transaction";
import type { Partner } from "@/actions/partner";
import { TransactionCardList } from "@/components/features/transaction/transaction-card-list";

/** ホームに出す最近の取引の件数 */
const RECENT_TRANSACTION_COUNT = 5;

type Props = {
  /** 全相手の取引（新しい順）。残高の計算に全件使うので、絞らずに渡す */
  transactions: TransactionWithPartner[];
  suggestions: string[];
  partners: Partner[];
};

/** ホームの「最近の取引」。記録した直後にその場で確かめられるようにする */
export function RecentTransactionsSection({
  transactions,
  suggestions,
  partners,
}: Props) {
  if (transactions.length === 0) return null;

  return (
    <section>
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-xs text-muted-foreground">最近の取引</h2>
        {transactions.length > RECENT_TRANSACTION_COUNT && (
          <Link
            href="/transactions"
            className="inline-flex items-center text-xs text-primary hover:underline"
          >
            すべて見る
            <ChevronRight className="size-3.5" />
          </Link>
        )}
      </div>
      <TransactionCardList
        transactions={transactions}
        suggestions={suggestions}
        partners={partners}
        showPartnerName
        limit={RECENT_TRANSACTION_COUNT}
      />
    </section>
  );
}
