"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Settings2 } from "lucide-react";
import { BalanceCard, buildLatestSummary } from "./balance-card";
import { LedgerFormDialog } from "./ledger-form-dialog";
import { ownerBalanceStatement } from "@/lib/balance-wording";
import { shouldShowBreakdown } from "@/lib/ledger-balance";
import type { LedgerBalanceBreakdown } from "@/lib/ledger-balance";
import type { LedgerWithBalance } from "@/actions/ledger";
import type { PartnerById } from "@/actions/partner";
import type { TransactionWithPartner } from "@/actions/transaction";

type Props = {
  partner: PartnerById;
  ledgers: LedgerWithBalance[];
  /** 全口座を合算した残高の内訳 */
  breakdown: LedgerBalanceBreakdown;
  /** いちばん新しい取引（残高の下に一言そえる） */
  latestTransaction?: TransactionWithPartner;
};

/** 相手ページの残高。口座の追加と、口座ごとの設定への入り口をそえる */
export function PartnerBalanceSection({
  partner,
  ledgers,
  breakdown,
  latestTransaction,
}: Props) {
  const [addLedgerOpen, setAddLedgerOpen] = useState(false);

  const maxRate = Math.max(0, ...ledgers.map((l) => l.annualInterestRate));

  return (
    <div>
      <BalanceCard
        balance={breakdown.total}
        statement={ownerBalanceStatement(breakdown.total, partner.name)}
        latestSummary={
          latestTransaction ? buildLatestSummary(latestTransaction) : undefined
        }
        breakdown={
          shouldShowBreakdown(breakdown, maxRate) ? breakdown : undefined
        }
        ledgers={ledgers}
        ledgersAction={
          <button
            onClick={() => setAddLedgerOpen(true)}
            className="flex items-center gap-1 text-[11px] px-2 py-1 -mr-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <Plus className="size-3.5" />
            追加
          </button>
        }
        renderLedgerAction={(ledger) => (
          <Link
            href={`/ledgers/${ledger.id}/settings`}
            aria-label={`${ledger.title}の設定`}
            className="shrink-0 p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <Settings2 className="size-4" />
          </Link>
        )}
      />

      <LedgerFormDialog
        partnerId={partner.id}
        open={addLedgerOpen}
        onOpenChange={setAddLedgerOpen}
      />
    </div>
  );
}
