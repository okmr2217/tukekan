"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FABProps {
  onClick?: () => void;
  id?: string;
}

export function FAB({ onClick, id }: FABProps) {
  return (
    <Button
      id={id}
      onClick={onClick}
      size="icon"
      className="fixed bottom-20 right-4 z-50 h-14 w-14 rounded-full shadow-lg"
    >
      <Plus className="h-6 w-6" />
      <span className="sr-only">新しい取引を追加</span>
    </Button>
  );
}
