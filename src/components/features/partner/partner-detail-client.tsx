"use client";

import { useState, useTransition, useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { LoadingButton } from "@/components/ui/loading-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DeleteConfirmDialog } from "@/components/ui/delete-confirm-dialog";
import {
  updatePartner,
  archivePartner,
  unarchivePartner,
  deletePartner,
  type UpdatePartnerState,
  type PartnerById,
} from "@/actions/partner";
import { toast } from "sonner";

type Props = {
  partner: PartnerById;
};

const initialUpdateState: UpdatePartnerState = {};

export function PartnerDetailClient({ partner }: Props) {
  const router = useRouter();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isArchivePending, startArchiveTransition] = useTransition();
  const [isDeletePending, startDeleteTransition] = useTransition();

  const [updateState, formAction, isUpdatePending] = useActionState(
    updatePartner,
    initialUpdateState,
  );
  const [name, setName] = useState(partner.name);

  useEffect(() => {
    if (updateState.success) {
      toast.success("名前を変更しました");
    }
  }, [updateState.success]);

  const handleSubmit = (formData: FormData) => {
    formData.set("partnerId", partner.id);
    formData.set("name", name);
    formAction(formData);
  };

  const handleArchive = () => {
    startArchiveTransition(async () => {
      const result = await archivePartner(partner.id);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(
          partner.isArchived
            ? `${partner.name}のアーカイブを解除しました`
            : `${partner.name}をアーカイブしました`,
        );
      }
    });
  };

  const handleUnarchive = () => {
    startArchiveTransition(async () => {
      const result = await unarchivePartner(partner.id);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(`${partner.name}のアーカイブを解除しました`);
      }
    });
  };

  const handleDelete = () => {
    startDeleteTransition(async () => {
      const result = await deletePartner(partner.id);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success(`${partner.name}を削除しました`);
      router.push("/");
    });
  };

  return (
    <div className="space-y-4">
      {/* 名前変更 */}
      <div className="rounded-xl border bg-card px-4 py-4 shadow-sm space-y-3">
        <p className="text-sm font-medium">名前を変更</p>
        <form action={handleSubmit} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="partner-name" className="text-xs text-muted-foreground">
              名前
            </Label>
            <Input
              id="partner-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="相手の名前"
              maxLength={50}
              disabled={isUpdatePending}
            />
            {updateState.error && (
              <p className="text-sm text-destructive">{updateState.error}</p>
            )}
          </div>
          <LoadingButton
            type="submit"
            size="sm"
            loading={isUpdatePending}
            loadingText="変更中..."
            disabled={!name.trim() || name === partner.name}
            className="w-full"
          >
            保存
          </LoadingButton>
        </form>
      </div>

      {/* アーカイブ */}
      <div className="rounded-xl border bg-card px-4 py-4 shadow-sm space-y-2">
        <p className="text-sm font-medium">
          {partner.isArchived ? "アーカイブを解除" : "アーカイブ"}
        </p>
        <p className="text-xs text-muted-foreground">
          {partner.isArchived
            ? "この相手はアーカイブ済みです。解除すると、ホームの一覧と取引フォームの候補にまた出るようになります。"
            : "やり取りが一段落した相手を、ホームの一覧と取引フォームの相手の候補から外します。"}
        </p>
        <ul className="list-disc space-y-0.5 pl-4 text-xs text-muted-foreground">
          <li>
            貸し借りの記録と残高はそのまま残り、ホームの合計・取引の一覧・統計にも含まれます
          </li>
          <li>相手のページと共有リンクはそのまま使えます</li>
          <li>アーカイブ中は、利子を設定した口座でも利息が付きません</li>
          <li>
            アーカイブ済みの相手は、ホームの相手一覧の下の「アーカイブ済みの相手」から見られます
          </li>
        </ul>
        <LoadingButton
          variant="outline"
          size="sm"
          className="w-full mt-1"
          onClick={partner.isArchived ? handleUnarchive : handleArchive}
          loading={isArchivePending}
        >
          {partner.isArchived ? "アーカイブを解除" : "アーカイブ"}
        </LoadingButton>
      </div>

      {/* 削除 */}
      <div className="rounded-xl border border-destructive/30 bg-card px-4 py-4 shadow-sm space-y-2">
        <p className="text-sm font-medium text-destructive">削除</p>
        <Button
          variant="destructive"
          size="sm"
          className="w-full"
          onClick={() => setDeleteDialogOpen(true)}
        >
          この相手を削除
        </Button>
      </div>

      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="相手を削除しますか？"
        description="削除すると取引履歴もすべて失われます。この操作は取り消せません。"
        onConfirm={handleDelete}
        isPending={isDeletePending}
      />
    </div>
  );
}
