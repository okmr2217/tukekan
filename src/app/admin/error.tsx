"use client";

/**
 * 管理画面のエラー画面。
 *
 * 通常、権限のないリクエストは middleware が 403 で止めるので、ここに来るのは
 * 「middleware を通ったあとに requireAdmin() が失敗した」場合か、
 * データ取得に失敗した場合。どちらも詳細は出さず、やり直す導線だけ出す。
 */

import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AdminError({ reset }: { reset: () => void }) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
      <ShieldAlert className="size-10 text-muted-foreground" />
      <div>
        <h1 className="text-lg font-bold">管理画面を表示できませんでした</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          権限がないか、データの取得に失敗しました。
          <br />
          Cloudflare Access でサインインし直しても直らない場合は、環境変数の設定を確認してください。
        </p>
      </div>
      <Button variant="outline" onClick={reset}>
        もう一度試す
      </Button>
    </div>
  );
}
