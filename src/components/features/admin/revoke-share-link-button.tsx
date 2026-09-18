"use client";

/**
 * 共有リンクを管理者権限で失効させるボタン。
 * 他人のデータを止める操作なので、必ず確認ダイアログを挟む。
 */

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Ban } from "lucide-react";
import { revokeShareTokenAsAdmin } from "@/actions/admin/mutations";
import { Button } from "@/components/ui/button";
import { DeleteConfirmDialog } from "@/components/ui/delete-confirm-dialog";

export function RevokeShareLinkButton({
  partnerId,
  partnerName,
  ownerName,
}: {
  partnerId: string;
  partnerName: string;
  ownerName: string;
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleConfirm = () => {
    startTransition(async () => {
      const result = await revokeShareTokenAsAdmin(partnerId);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success(result.message ?? "共有リンクを失効させました");
      setOpen(false);
      router.refresh();
    });
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        disabled={isPending}
      >
        <Ban />
        失効
      </Button>

      <DeleteConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title="共有リンクを失効させますか？"
        description={`${ownerName} さんが「${partnerName}」に発行した共有リンクが使えなくなります。配布済みのURLを開いてもエラーになり、この操作は取り消せません（オーナーが新しいリンクを発行し直すことはできます）。`}
        confirmLabel="失効させる"
        loadingLabel="失効中..."
        onConfirm={handleConfirm}
        isPending={isPending}
      />
    </>
  );
}
