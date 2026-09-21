/**
 * 管理画面で使い回す表示部品。
 *
 * アプリ本体はスマホ前提の1カラムだが、管理画面は一覧を並べて見るPC前提なので、
 * ここだけは別のレイアウト規約（サイドバー + 広いテーブル）を持つ。
 * 色や角丸などのトークンは本体と同じものを使う。
 */

import Link from "next/link";
import { cn } from "@/lib/utils";

/** 金額を「¥1,234」の形にする。マイナスは先頭に - を付ける */
export function formatYen(amount: number): string {
  return `${amount < 0 ? "-" : ""}¥${Math.abs(amount).toLocaleString()}`;
}

/** 符号つきの金額（+¥1,234 / -¥1,234） */
export function formatSignedYen(amount: number): string {
  return `${amount < 0 ? "-" : "+"}¥${Math.abs(amount).toLocaleString()}`;
}

export function PageHeader({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3 border-b pb-4">
      <div>
        <h1 className="text-xl font-bold tracking-tight">{title}</h1>
        {description && (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {children && <div className="flex items-center gap-2">{children}</div>}
    </div>
  );
}

export function StatTile({
  label,
  value,
  sub,
  tone,
  href,
}: {
  label: string;
  value: string;
  sub?: string;
  tone?: "default" | "positive" | "negative" | "warning";
  href?: string;
}) {
  const body = (
    <>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div
        className={cn(
          "mt-1.5 text-2xl font-bold tabular-nums",
          tone === "negative" && "text-destructive",
          tone === "warning" && "text-amber-600 dark:text-amber-400",
          tone === "positive" && "text-emerald-600 dark:text-emerald-400",
        )}
      >
        {value}
      </div>
      {sub && <div className="mt-1 text-xs text-muted-foreground">{sub}</div>}
    </>
  );

  const className =
    "rounded-xl border bg-card px-4 py-3.5 shadow-sm transition-colors";

  if (href) {
    return (
      <Link href={href} className={cn(className, "hover:bg-muted/60")}>
        {body}
      </Link>
    );
  }

  return <div className={className}>{body}</div>;
}

export function Panel({
  title,
  description,
  action,
  className,
  children,
}: {
  title?: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={cn("rounded-xl border bg-card shadow-sm", className)}>
      {(title || action) && (
        <header className="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3">
          <div>
            {title && <h2 className="text-sm font-semibold">{title}</h2>}
            {description && (
              <p className="mt-0.5 text-xs text-muted-foreground">
                {description}
              </p>
            )}
          </div>
          {action}
        </header>
      )}
      {children}
    </section>
  );
}

/** 横スクロールできるテーブルの箱 */
export function TableWrap({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full min-w-[40rem] text-sm">{children}</table>
    </div>
  );
}

export function Th({
  children,
  align = "left",
  className,
}: {
  children?: React.ReactNode;
  align?: "left" | "right" | "center";
  className?: string;
}) {
  return (
    <th
      className={cn(
        "bg-muted/40 px-3 py-2 text-xs font-medium whitespace-nowrap text-muted-foreground",
        align === "right" && "text-right",
        align === "center" && "text-center",
        align === "left" && "text-left",
        className,
      )}
    >
      {children}
    </th>
  );
}

export function Td({
  children,
  align = "left",
  className,
}: {
  children?: React.ReactNode;
  align?: "left" | "right" | "center";
  className?: string;
}) {
  return (
    <td
      className={cn(
        "px-3 py-2.5 align-middle",
        align === "right" && "text-right tabular-nums",
        align === "center" && "text-center",
        className,
      )}
    >
      {children}
    </td>
  );
}

export function EmptyRow({
  colSpan,
  children,
}: {
  colSpan: number;
  children: React.ReactNode;
}) {
  return (
    <tr>
      <td
        colSpan={colSpan}
        className="px-3 py-10 text-center text-sm text-muted-foreground"
      >
        {children}
      </td>
    </tr>
  );
}

/** 残高。プラスは「貸している」、マイナスは「借りている」 */
export function Balance({
  amount,
  className,
}: {
  amount: number;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "font-semibold tabular-nums",
        amount < 0 ? "text-destructive" : "text-foreground",
        className,
      )}
    >
      {formatYen(amount)}
    </span>
  );
}
