"use client";

import { useActionState, useEffect, useState } from "react";
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  ResponsiveDialogBody,
  ResponsiveDialogFooter,
} from "@/components/ui/responsive-dialog";
import { Button } from "@/components/ui/button";
import { LoadingButton } from "@/components/ui/loading-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createPartner, type CreatePartnerState } from "@/actions/partner";
import { toast } from "sonner";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const initialState: CreatePartnerState = {};

export function AddPartnerDialog({ open, onOpenChange }: Props) {
  const [state, formAction, isPending] = useActionState(
    createPartner,
    initialState,
  );
  const [name, setName] = useState("");

  useEffect(() => {
    if (open) {
      setName("");
    }
  }, [open]);

  useEffect(() => {
    if (state.success && state.partner) {
      toast.success(`${state.partner.name}を追加しました`);
      onOpenChange(false);
    }
  }, [state.success, state.partner, onOpenChange]);

  const handleSubmit = (formData: FormData) => {
    formData.set("name", name);
    formAction(formData);
  };

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent>
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>相手を追加</ResponsiveDialogTitle>
        </ResponsiveDialogHeader>
        <form action={handleSubmit}>
          <ResponsiveDialogBody>
            <div className="space-y-4 pb-2">
              {state.error && (
                <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
                  {state.error}
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="new-partner-name">名前</Label>
                <Input
                  id="new-partner-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="相手の名前を入力"
                  maxLength={50}
                  disabled={isPending}
                  autoFocus
                />
              </div>
            </div>
          </ResponsiveDialogBody>
          <ResponsiveDialogFooter>
            <div className="flex gap-2 w-full">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isPending}
                className="flex-1"
              >
                キャンセル
              </Button>
              <LoadingButton
                type="submit"
                loading={isPending}
                loadingText="追加中..."
                disabled={!name.trim()}
                className="flex-1"
              >
                追加
              </LoadingButton>
            </div>
          </ResponsiveDialogFooter>
        </form>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
