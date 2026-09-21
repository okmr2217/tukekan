/**
 * 管理画面の取引テーブル。
 * ダッシュボード・取引検索・アカウント詳細で共用する。
 */

import Link from "next/link";
import { FileText } from "lucide-react";
import type { AdminTransactionRow } from "@/actions/admin/types";
import {
  EmptyRow,
  TableWrap,
  Td,
  Th,
  formatSignedYen,
} from "@/components/features/admin/admin-ui";
import { Badge } from "@/components/ui/badge";
import { formatYMD, toJST } from "@/lib/date-utils";
import { isInterestKind } from "@/lib/transaction-kind";

export function AdminTransactionTable({
  rows,
  showOwner = true,
  showStatus = false,
  emptyText = "取引がありません",
}: {
  rows: AdminTransactionRow[];
  showOwner?: boolean;
  /** アーカイブ済みの取引も混ざるときだけ状態の列を出す */
  showStatus?: boolean;
  emptyText?: string;
}) {
  const colSpan = 5 + (showOwner ? 1 : 0) + (showStatus ? 1 : 0);

  return (
    <TableWrap>
      <thead>
        <tr>
          <Th>日付</Th>
          {showOwner && <Th>アカウント</Th>}
          <Th>相手 / 口座</Th>
          <Th>用途</Th>
          <Th align="right">金額</Th>
          {showStatus && <Th align="center">状態</Th>}
        </tr>
      </thead>
      <tbody>
        {rows.length === 0 ? (
          <EmptyRow colSpan={colSpan}>{emptyText}</EmptyRow>
        ) : (
          rows.map((t) => (
            <tr key={t.id} className="border-t hover:bg-muted/40">
              <Td className="whitespace-nowrap text-muted-foreground">
                {formatYMD(toJST(t.date))}
              </Td>
              {showOwner && (
                <Td>
                  <Link
                    href={`/admin/accounts/${t.ownerId}`}
                    className="hover:underline"
                  >
                    {t.ownerName}
                  </Link>
                </Td>
              )}
              <Td className="text-muted-foreground">
                {t.partnerName}
                {t.ledgerTitle ? ` / ${t.ledgerTitle}` : ""}
              </Td>
              <Td>
                <span className="flex items-center gap-1.5">
                  {t.purpose ?? <span className="text-muted-foreground">—</span>}
                  {isInterestKind(t.kind) && (
                    <Badge variant="secondary">利息</Badge>
                  )}
                  {t.description && (
                    <FileText
                      className="size-3.5 text-muted-foreground"
                      aria-label="メモあり"
                    />
                  )}
                </span>
              </Td>
              <Td
                align="right"
                className={t.amount < 0 ? "text-destructive" : "text-foreground"}
              >
                {formatSignedYen(t.amount)}
              </Td>
              {showStatus && (
                <Td align="center">
                  {t.isArchived ? (
                    <Badge variant="outline">アーカイブ</Badge>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </Td>
              )}
            </tr>
          ))
        )}
      </tbody>
    </TableWrap>
  );
}
