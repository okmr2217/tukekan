/**
 * 管理画面の口座テーブル。
 * 口座ページ・アカウント詳細・ジョブページで共用する。
 *
 * 利子つきの口座の監視が主な用途なので、年利・発生曜日・最終発生日時・
 * 次回の見込み額を並べ、ジョブが止まっていそうな口座には印を付ける。
 */

import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import type { AdminLedgerRow } from "@/actions/admin/types";
import {
  Balance,
  EmptyRow,
  TableWrap,
  Td,
  Th,
  formatYen,
} from "@/components/features/admin/admin-ui";
import { Badge } from "@/components/ui/badge";
import { formatRate, getWeekdayLabel } from "@/lib/ledger-interest";
import { formatYMD, toJST } from "@/lib/date-utils";

export function AdminLedgerTable({
  rows,
  showOwner = true,
  emptyText = "口座がありません",
}: {
  rows: AdminLedgerRow[];
  showOwner?: boolean;
  emptyText?: string;
}) {
  const colSpan = 8 + (showOwner ? 1 : 0);

  return (
    <TableWrap>
      <thead>
        <tr>
          <Th>口座</Th>
          {showOwner && <Th>オーナー</Th>}
          <Th align="right">残高</Th>
          <Th align="right">未払利息</Th>
          <Th align="right">年利</Th>
          <Th align="center">発生</Th>
          <Th align="right">最終発生</Th>
          <Th align="right">次回の見込み</Th>
          <Th align="center">状態</Th>
        </tr>
      </thead>
      <tbody>
        {rows.length === 0 ? (
          <EmptyRow colSpan={colSpan}>{emptyText}</EmptyRow>
        ) : (
          rows.map((ledger) => (
            <tr key={ledger.id} className="border-t hover:bg-muted/40">
              <Td>
                <div className="font-medium">{ledger.title}</div>
                <div className="text-xs text-muted-foreground">
                  {ledger.partnerName}
                  {ledger.partnerIsArchived && "（アーカイブ済み）"}
                </div>
              </Td>
              {showOwner && (
                <Td>
                  <Link
                    href={`/admin/accounts/${ledger.ownerId}`}
                    className="hover:underline"
                  >
                    {ledger.ownerName}
                  </Link>
                </Td>
              )}
              <Td align="right">
                <Balance amount={ledger.breakdown.total} />
              </Td>
              <Td
                align="right"
                className={
                  ledger.breakdown.unpaidInterest > 0
                    ? "text-amber-600 dark:text-amber-400"
                    : "text-muted-foreground"
                }
              >
                {formatYen(ledger.breakdown.unpaidInterest)}
              </Td>
              <Td align="right">
                {ledger.annualInterestRate > 0 ? (
                  `${formatRate(ledger.annualInterestRate)}%`
                ) : (
                  <span className="text-muted-foreground">無利子</span>
                )}
              </Td>
              <Td align="center" className="whitespace-nowrap">
                {ledger.annualInterestRate > 0 ? (
                  <span className="text-xs">
                    {getWeekdayLabel(ledger.interestAccrualWeekday)}曜
                    <span className="ml-1 text-muted-foreground">
                      {ledger.interestCompounding ? "複利" : "単利"}
                    </span>
                  </span>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </Td>
              <Td align="right" className="text-muted-foreground">
                {ledger.lastInterestAccruedAt ? (
                  formatYMD(toJST(ledger.lastInterestAccruedAt))
                ) : (
                  <span>—</span>
                )}
              </Td>
              <Td align="right">
                {ledger.nextInterest.isEligible ? (
                  <>
                    {formatYen(ledger.nextInterest.amount)}
                    <div className="text-xs text-muted-foreground">
                      {formatYMD(ledger.nextInterest.nextDate)}
                    </div>
                  </>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </Td>
              <Td align="center">
                {ledger.isInterestStalled ? (
                  <Badge variant="destructive" className="gap-1">
                    <AlertTriangle />
                    停止の疑い
                  </Badge>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </Td>
            </tr>
          ))
        )}
      </tbody>
    </TableWrap>
  );
}
