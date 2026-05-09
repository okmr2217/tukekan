"use client";

import { useState } from "react";
import { Plus, ChevronDown, ChevronUp } from "lucide-react";
import { PartnerNoteCard } from "./partner-note-card";
import { PartnerNoteFormDialog } from "./partner-note-form-dialog";
import type { PartnerNote } from "@/actions/partner";

type Props = {
  partnerId: string;
  notes: PartnerNote[];
  readOnly?: boolean;
};

const INITIAL_VISIBLE = 3;

export function PartnerNoteSection({
  partnerId,
  notes,
  readOnly = false,
}: Props) {
  const [expanded, setExpanded] = useState(false);
  const [addOpen, setAddOpen] = useState(false);

  if (readOnly && notes.length === 0) return null;

  const visibleNotes = expanded ? notes : notes.slice(0, INITIAL_VISIBLE);
  const hasMore = notes.length > INITIAL_VISIBLE;

  return (
    <>
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-medium tracking-widest text-muted-foreground uppercase">
            メモ
          </p>
          {!readOnly && (
            <button
              onClick={() => setAddOpen(true)}
              className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-md border border-border bg-transparent hover:bg-muted transition-colors"
            >
              <Plus className="size-3.5" />
              追加
            </button>
          )}
        </div>

        {notes.length === 0 ? (
          <div className="border border-dashed border-border rounded-xl px-4 py-5 flex flex-col items-center gap-2">
            <p className="text-xs text-muted-foreground">
              まだメモはありません
            </p>
            <button
              onClick={() => setAddOpen(true)}
              className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-md border border-border bg-transparent hover:bg-muted transition-colors"
            >
              <Plus className="size-3.5" />
              メモを追加
            </button>
          </div>
        ) : (
          <>
            <div className="space-y-2">
              {visibleNotes.map((note) => (
                <PartnerNoteCard key={note.id} note={note} readOnly={readOnly} />
              ))}
            </div>
            {hasMore && (
              <button
                onClick={() => setExpanded((v) => !v)}
                className="mt-2.5 w-full py-2 text-xs rounded-md border border-border text-muted-foreground flex items-center justify-center gap-1 hover:bg-muted transition-colors"
              >
                {expanded ? (
                  <>
                    <ChevronUp className="size-3.5" />
                    折りたたむ
                  </>
                ) : (
                  <>
                    <ChevronDown className="size-3.5" />
                    すべて見る（{notes.length}件）
                  </>
                )}
              </button>
            )}
          </>
        )}
      </div>

      {!readOnly && (
        <PartnerNoteFormDialog
          partnerId={partnerId}
          open={addOpen}
          onOpenChange={setAddOpen}
        />
      )}
    </>
  );
}
