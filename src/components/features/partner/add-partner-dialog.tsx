"use client";

import { useActionState, useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>相手を追加</DialogTitle>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4">
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
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
              className="flex-1"
            >
              キャンセル
            </Button>
            <Button
              type="submit"
              disabled={isPending || !name.trim()}
              className="flex-1"
            >
              {isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  追加中...
                </>
              ) : (
                "追加"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
