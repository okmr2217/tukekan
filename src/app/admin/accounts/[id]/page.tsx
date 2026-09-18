/**
 * アカウント1件の詳細。
 * そのユーザーが持つ相手・口座・直近の取引と、共有リンクの状態をまとめて見る。
 */

import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getAdminAccountDetail } from "@/actions/admin/queries";
import {
  Balance,
  EmptyRow,
  PageHeader,
  Panel,
  StatTile,
  TableWrap,
  Td,
  Th,
  formatYen,
} from "@/components/features/admin/admin-ui";
import { AdminLedgerTable } from "@/components/features/admin/ledger-table";
import { AdminTransactionTable } from "@/components/features/admin/transaction-table";
import { RevokeShareLinkButton } from "@/components/features/admin/revoke-share-link-button";
import { Badge } from "@/components/ui/badge";
import { formatDateTimeForDisplay, formatYMD, toJST } from "@/lib/date-utils";
import {
  getTransactionLabelOption,
  toTransactionLabelPreset,
} from "@/lib/transaction-labels";

export default async function AdminAccountDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const account = await getAdminAccountDetail(id);
  if (!account) notFound();

  const presetLabel = getTransactionLabelOption(
    toTransactionLabelPreset(account.transactionLabelPreset),
  ).title;

  const now = new Date();

  return (
    <>
      <Link
        href="/admin/accounts"
        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" />
        アカウント一覧へ
      </Link>

      <PageHeader
        title={account.name}
        description={`${account.email} ・ ${formatDateTimeForDisplay(account.createdAt)} に登録 ・ 取引ボタン「${presetLabel}」`}
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile
          label="残高"
          value={formatYen(account.breakdown.total)}
          sub={`元本 ${formatYen(account.breakdown.principal)}`}
          tone={account.breakdown.total < 0 ? "negative" : "default"}
        />
        <StatTile
          label="未払利息"
          value={formatYen(account.breakdown.unpaidInterest)}
          tone={account.breakdown.unpaidInterest > 0 ? "warning" : "default"}
        />
        <StatTile
          label="累計の貸出"
          value={formatYen(account.totalLent)}
          sub={`累計の返済・借入 ${formatYen(account.totalBorrowed)}`}
        />
        <StatTile
          label="取引"
          value={account.transactionCount.toLocaleString()}
          sub={`相手 ${account.partners.length} ・ 口座 ${account.ledgers.length}`}
          href={`/admin/transactions?ownerId=${account.id}`}
        />
      </div>

      <Panel title={`相手（${account.partners.length}）`}>
        <TableWrap>
          <thead>
            <tr>
              <Th>相手</Th>
              <Th align="right">残高</Th>
              <Th align="right">未払利息</Th>
              <Th align="right">口座</Th>
              <Th align="right">取引</Th>
              <Th>共有リンク</Th>
              <Th align="right">登録日</Th>
              <Th align="right"></Th>
            </tr>
          </thead>
          <tbody>
            {account.partners.length === 0 ? (
              <EmptyRow colSpan={8}>相手が登録されていません</EmptyRow>
            ) : (
              account.partners.map((p) => {
                const hasLiveLink =
                  p.shareToken !== null &&
                  p.shareTokenExpiresAt !== null &&
                  p.shareTokenExpiresAt > now;

                return (
                  <tr key={p.id} className="border-t hover:bg-muted/40">
                    <Td>
                      <span className="font-medium">{p.name}</span>
                      {p.isArchived && (
                        <Badge variant="outline" className="ml-2">
                          アーカイブ
                        </Badge>
                      )}
                    </Td>
                    <Td align="right">
                      <Balance amount={p.breakdown.total} />
                    </Td>
                    <Td
                      align="right"
                      className={
                        p.breakdown.unpaidInterest > 0
                          ? "text-amber-600 dark:text-amber-400"
                          : "text-muted-foreground"
                      }
                    >
                      {formatYen(p.breakdown.unpaidInterest)}
                    </Td>
                    <Td align="right">{p.ledgerCount}</Td>
                    <Td align="right">{p.transactionCount}</Td>
                    <Td className="whitespace-nowrap text-xs">
                      {hasLiveLink ? (
                        <span className="text-muted-foreground">
                          有効（{formatYMD(toJST(p.shareTokenExpiresAt!))} まで）
                        </span>
                      ) : p.shareToken ? (
                        <span className="text-destructive">期限切れ</span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </Td>
                    <Td align="right" className="text-muted-foreground">
                      {formatYMD(toJST(p.createdAt))}
                    </Td>
                    <Td align="right">
                      {p.shareToken && (
                        <RevokeShareLinkButton
                          partnerId={p.id}
                          partnerName={p.name}
                          ownerName={account.name}
                        />
                      )}
                    </Td>
                  </tr>
                );
              })
            )}
          </tbody>
        </TableWrap>
      </Panel>

      <Panel title={`口座（${account.ledgers.length}）`}>
        <AdminLedgerTable rows={account.ledgers} showOwner={false} />
      </Panel>

      <Panel
        title="直近の取引"
        action={
          <Link
            href={`/admin/transactions?ownerId=${account.id}`}
            className="text-xs text-primary hover:underline"
          >
            このアカウントの取引をすべて見る →
          </Link>
        }
      >
        <AdminTransactionTable
          rows={account.recentTransactions}
          showOwner={false}
          showStatus
        />
      </Panel>
    </>
  );
}
