/**
 * アカウント一覧。名前・メールで検索できる。
 * 検索語は ?q= に入れるので、URLの共有・ブックマークができる。
 */

import Link from "next/link";
import { Search } from "lucide-react";
import { getAdminAccounts } from "@/actions/admin/queries";
import {
  Balance,
  EmptyRow,
  PageHeader,
  Panel,
  TableWrap,
  Td,
  Th,
  formatYen,
} from "@/components/features/admin/admin-ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatYMD, toJST } from "@/lib/date-utils";

export default async function AdminAccountsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const accounts = await getAdminAccounts(q);

  return (
    <>
      <PageHeader
        title="アカウント"
        description="登録ユーザーの一覧。残高は本人視点の合計"
      />

      <form className="flex max-w-md gap-2" action="/admin/accounts">
        <Input
          name="q"
          defaultValue={q ?? ""}
          placeholder="名前・メールアドレスで検索"
          aria-label="アカウントを検索"
        />
        <Button type="submit" variant="outline">
          <Search />
          検索
        </Button>
      </form>

      <Panel
        title={`${accounts.length}件${q ? `（「${q}」で絞り込み）` : ""}`}
        action={
          q ? (
            <Link
              href="/admin/accounts"
              className="text-xs text-primary hover:underline"
            >
              絞り込みを解除
            </Link>
          ) : undefined
        }
      >
        <TableWrap>
          <thead>
            <tr>
              <Th>アカウント</Th>
              <Th align="right">残高</Th>
              <Th align="right">未払利息</Th>
              <Th align="right">相手</Th>
              <Th align="right">口座</Th>
              <Th align="right">取引</Th>
              <Th align="right">共有リンク</Th>
              <Th align="right">最終取引</Th>
              <Th align="right">登録日</Th>
            </tr>
          </thead>
          <tbody>
            {accounts.length === 0 ? (
              <EmptyRow colSpan={9}>
                {q
                  ? "条件に合うアカウントが見つかりません"
                  : "アカウントがまだありません"}
              </EmptyRow>
            ) : (
              accounts.map((a) => (
                <tr key={a.id} className="border-t hover:bg-muted/40">
                  <Td>
                    <Link
                      href={`/admin/accounts/${a.id}`}
                      className="font-medium hover:underline"
                    >
                      {a.name}
                    </Link>
                    <div className="text-xs text-muted-foreground">
                      {a.email}
                    </div>
                  </Td>
                  <Td align="right">
                    <Balance amount={a.breakdown.total} />
                  </Td>
                  <Td
                    align="right"
                    className={
                      a.breakdown.unpaidInterest > 0
                        ? "text-amber-600 dark:text-amber-400"
                        : "text-muted-foreground"
                    }
                  >
                    {formatYen(a.breakdown.unpaidInterest)}
                  </Td>
                  <Td align="right">{a.partnerCount}</Td>
                  <Td align="right">{a.ledgerCount}</Td>
                  <Td align="right">{a.transactionCount}</Td>
                  <Td align="right">
                    {a.shareLinkCount > 0 ? (
                      a.shareLinkCount
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </Td>
                  <Td align="right" className="text-muted-foreground">
                    {a.lastTransactionAt ? (
                      formatYMD(toJST(a.lastTransactionAt))
                    ) : (
                      <span>—</span>
                    )}
                  </Td>
                  <Td align="right" className="text-muted-foreground">
                    {formatYMD(toJST(a.createdAt))}
                  </Td>
                </tr>
              ))
            )}
          </tbody>
        </TableWrap>
      </Panel>
    </>
  );
}
