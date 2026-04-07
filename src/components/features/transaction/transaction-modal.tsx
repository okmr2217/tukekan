"use client";

import { useState, useEffect, useTransition } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FAB } from "@/components/layouts/fab";
import { TransactionFormFields } from "./transaction-form-fields";
import { createTransaction } from "@/actions/transaction";
import {
  floorToNearest30,
  buildDateTime,
  type DateMode,
} from "@/lib/date-picker-utils";
import { formatDateToJST } from "@/lib/dateUtils";
import { toast } from "sonner";
import type { Partner } from "@/actions/partner";

type Props = {
  partners: Partner[];
  suggestions: string[];
  defaultPartnerId?: string;
};

export function TransactionModal({
  partners,
  suggestions,
  defaultPartnerId,
}: Props) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const [partnerId, setPartnerId] = useState(defaultPartnerId ?? "");
  const [isLending, setIsLending] = useState(true);
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [dateMode, setDateMode] = useState<DateMode>("today");
  const [otherDate, setOtherDate] = useState(formatDateToJST());
  const [selectedTime, setSelectedTime] = useState(() =>
    floorToNearest30(new Date()),
  );
  const [error, setError] = useState<string | null>(null);

  function resetForm() {
    setPartnerId(defaultPartnerId ?? "");
    setIsLending(true);
    setAmount("");
    setDescription("");
    setDateMode("today");
    setOtherDate(formatDateToJST());
    setSelectedTime(floorToNearest30(new Date()));
    setError(null);
  }

  // Reset form when modal opens
  useEffect(() => {
    if (open) resetForm();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Keyboard shortcut: N to open modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (open) return;
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.tagName === "SELECT" ||
        target.isContentEditable
      )
        return;
      if (e.key === "n" || e.key === "N") {
        setOpen(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  const handleSubmit = () => {
    if (!partnerId) {
      setError("相手を選択してください");
      return;
    }
    const rawAmount = parseInt(amount, 10);
    if (isNaN(rawAmount) || rawAmount <= 0) {
      setError("金額を正しく入力してください");
      return;
    }

    const signedAmount = isLending ? rawAmount : -rawAmount;
    const date = buildDateTime(dateMode, otherDate, selectedTime);

    setError(null);
    startTransition(async () => {
      const formData = new FormData();
      formData.set("partnerId", partnerId);
      formData.set("amount", signedAmount.toString());
      formData.set("description", description);
      formData.set("date", date.toISOString());

      const result = await createTransaction({}, formData);
      if (result.error) {
        setError(result.error);
        return;
      }
      toast.success("取引を登録しました");
      setOpen(false);
    });
  };

  return (
    <>
      <FAB onClick={() => setOpen(true)} />
      <Dialog open={open} onOpenChange={(v) => !isPending && setOpen(v)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>新しい取引</DialogTitle>
          </DialogHeader>

          <div className="space-y-5">
            {error && (
              <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
                {error}
              </div>
            )}

            {/* Partner */}
            <div className="space-y-2">
              <Label>相手</Label>
              <Select
                value={partnerId}
                onValueChange={setPartnerId}
                disabled={isPending}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="選択してください" />
                </SelectTrigger>
                <SelectContent>
                  {partners.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <TransactionFormFields
              amount={amount}
              setAmount={setAmount}
              isLending={isLending}
              setIsLending={setIsLending}
              description={description}
              setDescription={setDescription}
              dateMode={dateMode}
              setDateMode={setDateMode}
              otherDate={otherDate}
              setOtherDate={setOtherDate}
              selectedTime={selectedTime}
              setSelectedTime={setSelectedTime}
              suggestions={suggestions}
              isPending={isPending}
              maxDate={formatDateToJST()}
            />

            <Button
              type="button"
              onClick={handleSubmit}
              className="w-full"
              disabled={isPending || !partnerId || !amount}
            >
              {isPending ? "登録中..." : "登録"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
