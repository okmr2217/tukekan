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
import { updatePartner, type UpdatePartnerState } from "@/actions/partner";
import { toast } from "sonner";

type Props = {
  partner: { id: string; name: string };
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const initialState: UpdatePartnerState = {};

export function EditPartnerDialog({ partner, open, onOpenChange }: Props) {
  const [state, formAction, isPending] = useActionState(
    updatePartner,
    initialState,
  );
  const [name, setName] = useState(partner.name);

  useEffect(() => {
    if (open) {
      setName(partner.name);
    }
  }, [open, partner.name]);

  useEffect(() => {
    if (state.success) {
      toast.success("名前を変更しました");
      onOpenChange(false);
    }
  }, [state.success, onOpenChange]);

  const handleSubmit = (formData: FormData) => {
    formData.set("partnerId", partner.id);
    formData.set("name", name);
    formAction(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>名前を変更</DialogTitle>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4">
          {state.error && (
            <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
              {state.error}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="partner-name">名前</Label>
            <Input
              id="partner-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="相手の名前"
              maxLength={50}
              disabled={isPending}
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
                  変更中...
                </>
              ) : (
                "変更"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
