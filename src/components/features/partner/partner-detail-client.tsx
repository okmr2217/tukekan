"use client";

import { useState, useTransition, useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
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
      router.push("/partners");
    });
  };

  return (
    <div className="space-y-4">
      {/* 名前変更 */}
      <div className="rounded-xl border bg-card px-4 py-4 shadow-sm space-y-3">
        <p className="text-sm font-medium">名前を変更</p>
        <form action={handleSubmit} className="space-y-3">
          {updateState.error && (
            <p className="text-sm text-destructive">{updateState.error}</p>
          )}
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
          </div>
          <Button
            type="submit"
            size="sm"
            disabled={isUpdatePending || !name.trim() || name === partner.name}
            className="w-full"
          >
            {isUpdatePending ? (
              <>
                <Loader2 className="size-4 animate-spin mr-1" />
                変更中...
              </>
            ) : (
              "保存"
            )}
          </Button>
        </form>
      </div>

      {/* アーカイブ */}
      <div className="rounded-xl border bg-card px-4 py-4 shadow-sm space-y-2">
        <p className="text-sm font-medium">
          {partner.isArchived ? "アーカイブを解除" : "アーカイブ"}
        </p>
        <p className="text-xs text-muted-foreground">
          アーカイブした相手は相手一覧に表示されなくなります。取引履歴は保持されます。
        </p>
        <Button
          variant="outline"
          size="sm"
          className="w-full mt-1"
          onClick={partner.isArchived ? handleUnarchive : handleArchive}
          disabled={isArchivePending}
        >
          {isArchivePending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : partner.isArchived ? (
            "アーカイブを解除"
          ) : (
            "アーカイブ"
          )}
        </Button>
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

      {/* 削除確認ダイアログ */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>相手を削除しますか？</DialogTitle>
            <DialogDescription>
              削除すると取引履歴もすべて失われます。この操作は取り消せません。
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={isDeletePending}
            >
              キャンセル
            </Button>
            <Button
              variant="destructive"
              className="flex-1"
              onClick={handleDelete}
              disabled={isDeletePending}
            >
              {isDeletePending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                "削除"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
