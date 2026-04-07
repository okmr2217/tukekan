"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FAB } from "@/components/layouts/fab";
import { TransactionForm } from "./transaction-form";
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

  const handleSuccess = useCallback(() => {
    setOpen(false);
  }, []);

  // Reset form state when modal opens
  const [key, setKey] = useState(0);
  useEffect(() => {
    if (open) {
      setKey((prev) => prev + 1);
    }
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

  return (
    <>
      <FAB onClick={() => setOpen(true)} />
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>新しい取引</DialogTitle>
          </DialogHeader>
          <TransactionForm
            key={key}
            partners={partners}
            suggestions={suggestions}
            defaultPartnerId={defaultPartnerId}
            onSuccess={handleSuccess}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
