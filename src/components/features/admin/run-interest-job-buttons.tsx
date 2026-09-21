"use client";

/**
 * 利子ジョブを管理画面から手動実行するボタン。
 *
 * - 試し打ち（dry-run）: DBを変更せず、いま実行したら何が起きるかだけを返す
 * - 実行: 本当に利息の取引を作る。確認ダイアログを挟む
 *
 * 同じ日に二重で発生しない仕組み（lastInterestAccruedAt）が効いているので、
 * 押しすぎても利息が二重に付くことはない。
 */

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Play, TestTube } from "lucide-react";
import { runInterestJobAsAdmin } from "@/actions/admin/mutations";
import { Button } from "@/components/ui/button";
import { DeleteConfirmDialog } from "@/components/ui/delete-confirm-dialog";

export function RunInterestJobButtons({
  eligibleCount,
  eligibleAmount,
}: {
  eligibleCount: number;
  eligibleAmount: number;
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const run = (dryRun: boolean) => {
    startTransition(async () => {
      const result = await runInterestJobAsAdmin(dryRun);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success(result.message ?? "実行しました");
      setOpen(false);
      router.refresh();
    });
  };

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => run(true)}
          disabled={isPending}
        >
          <TestTube />
          試し打ち
        </Button>
        <Button size="sm" onClick={() => setOpen(true)} disabled={isPending}>
          <Play />
          いま実行する
        </Button>
      </div>

      <DeleteConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title="利子ジョブを実行しますか？"
        description={
          eligibleCount === 0
            ? "今日が発生曜日にあたる口座のうち、いま利息が発生する口座はありません。実行しても何も起きません。"
            : `${eligibleCount}件の口座に、合計 ¥${eligibleAmount.toLocaleString()} の利息が発生します。作成された利息の取引はユーザーの画面にも反映され、管理画面からは取り消せません。`
        }
        confirmLabel="実行する"
        loadingLabel="実行中..."
        onConfirm={() => run(false)}
        isPending={isPending}
      />
    </>
  );
}
