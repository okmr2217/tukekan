/**
 * 全アカウントを横断した取引の検索。
 *
 * 絞り込みの状態はすべてクエリパラメータに持つので、
 * 「この条件の一覧」をURLで共有できる。
 */

import Link from "next/link";
import { Search } from "lucide-react";
import {
  getAdminAccountOptions,
  getAdminTransactions,
} from "@/actions/admin/queries";
import { PageHeader, Panel } from "@/components/features/admin/admin-ui";
import { AdminTransactionTable } from "@/components/features/admin/transaction-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type SearchParams = {
  q?: string;
  ownerId?: string;
  kind?: string;
  from?: string;
  to?: string;
  archived?: string;
  page?: string;
};

/** いまの絞り込みを保ったまま page だけ差し替えたURLを作る */
function buildHref(params: SearchParams, page: number): string {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (key !== "page" && value) query.set(key, value);
  }
  if (page > 1) query.set("page", String(page));
  const qs = query.toString();
  return qs ? `/admin/transactions?${qs}` : "/admin/transactions";
}

const SELECT_CLASS =
  "h-9 rounded-md border border-input bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 dark:bg-input/30";

export default async function AdminTransactionsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const includeArchived = params.archived === "1";

  const [result, accounts] = await Promise.all([
    getAdminTransactions({
      q: params.q,
      ownerId: params.ownerId,
      kind: params.kind,
      from: params.from,
      to: params.to,
      includeArchived,
      page: Number(params.page) || 1,
    }),
    getAdminAccountOptions(),
  ]);

  return (
    <>
      <PageHeader
        title="取引"
        description="全アカウントの取引を横断して検索する"
      />

      <Panel className="p-4">
        <form
          action="/admin/transactions"
          className="flex flex-wrap items-end gap-3"
        >
          <label className="flex min-w-[14rem] flex-1 flex-col gap-1.5">
            <span className="text-xs text-muted-foreground">
              用途・メモ・相手名
            </span>
            <Input
              name="q"
              defaultValue={params.q ?? ""}
              placeholder="キーワード"
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-xs text-muted-foreground">アカウント</span>
            <select
              name="ownerId"
              defaultValue={params.ownerId ?? ""}
              className={SELECT_CLASS}
            >
              <option value="">すべて</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}（{a.email}）
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-xs text-muted-foreground">種別</span>
            <select
              name="kind"
              defaultValue={params.kind ?? ""}
              className={SELECT_CLASS}
            >
              <option value="">すべて</option>
              <option value="NORMAL">通常</option>
              <option value="INTEREST">利息</option>
            </select>
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-xs text-muted-foreground">開始日</span>
            <Input type="date" name="from" defaultValue={params.from ?? ""} />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-xs text-muted-foreground">終了日</span>
            <Input type="date" name="to" defaultValue={params.to ?? ""} />
          </label>

          <label className="flex h-9 items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="archived"
              value="1"
              defaultChecked={includeArchived}
              className="size-4 rounded border-input"
            />
            アーカイブも含める
          </label>

          <div className="flex gap-2">
            <Button type="submit" variant="outline">
              <Search />
              検索
            </Button>
            <Button asChild variant="ghost">
              <Link href="/admin/transactions">条件をクリア</Link>
            </Button>
          </div>
        </form>
      </Panel>

      <Panel
        title={`${result.total.toLocaleString()}件`}
        description={`${result.page} / ${result.pageCount} ページ`}
      >
        <AdminTransactionTable
          rows={result.rows}
          showStatus={includeArchived}
          emptyText="条件に合う取引がありません"
        />
      </Panel>

      {result.pageCount > 1 && (
        <nav className="flex items-center justify-center gap-2 text-sm">
          <Link
            href={buildHref(params, result.page - 1)}
            aria-disabled={result.page <= 1}
            className={cn(
              "rounded-md border px-3 py-1.5",
              result.page <= 1
                ? "pointer-events-none opacity-40"
                : "hover:bg-muted",
            )}
          >
            前へ
          </Link>
          <span className="text-muted-foreground">
            {result.page} / {result.pageCount}
          </span>
          <Link
            href={buildHref(params, result.page + 1)}
            aria-disabled={result.page >= result.pageCount}
            className={cn(
              "rounded-md border px-3 py-1.5",
              result.page >= result.pageCount
                ? "pointer-events-none opacity-40"
                : "hover:bg-muted",
            )}
          >
            次へ
          </Link>
        </nav>
      )}
    </>
  );
}
