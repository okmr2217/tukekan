/**
 * 管理画面（/admin）のレイアウト。
 *
 * アプリ本体の (main) レイアウト（スマホ前提のボトムバー + FAB）とは別物で、
 * こちらはPCで一覧を見るためのサイドバー構成。認証も本体のJWTではなく
 * Cloudflare Access を使う（src/lib/admin-auth.ts）。
 */

import type { Metadata } from "next";
import { ShieldCheck } from "lucide-react";
import { requireAdmin } from "@/lib/admin-auth";
import { AdminNav } from "@/components/features/admin/admin-nav";

export const metadata: Metadata = {
  title: "ツケカン 管理画面",
  // 管理画面は検索エンジンに載せない
  robots: { index: false, follow: false },
};

// 管理者の判定にリクエストヘッダーを読むので、常にリクエストごとに描画する
export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await requireAdmin();

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="mx-auto flex max-w-7xl flex-col md:flex-row">
        <aside className="border-b bg-background p-3 md:sticky md:top-0 md:h-screen md:w-56 md:shrink-0 md:border-r md:border-b-0">
          <div className="flex items-center gap-2 px-2 py-2 md:py-3">
            <ShieldCheck className="size-5 text-primary" />
            <div className="min-w-0">
              <p className="font-logo text-sm font-bold">ツケカン</p>
              <p className="text-[11px] text-muted-foreground">管理画面</p>
            </div>
          </div>

          <div className="mt-2">
            <AdminNav />
          </div>

          <div className="mt-3 hidden border-t px-2 pt-3 md:block">
            <p className="text-[11px] text-muted-foreground">サインイン中</p>
            <p className="truncate text-xs font-medium" title={admin.email}>
              {admin.email}
            </p>
            {admin.via === "dev-bypass" && (
              <p className="mt-1 text-[11px] text-amber-600 dark:text-amber-400">
                開発用バイパス（ADMIN_DEV_EMAIL）
              </p>
            )}
          </div>
        </aside>

        <main className="min-w-0 flex-1 space-y-5 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
