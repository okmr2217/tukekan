"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import type { LedgerNote } from "@/generated/prisma";

function validateContent(content: string): string | null {
  const trimmed = content.trim();
  if (trimmed.length === 0 || trimmed.length > 100) {
    return "メモは1〜100文字で入力してください";
  }
  return null;
}

export async function createLedgerNote(input: {
  ledgerId: string;
  content: string;
}): Promise<{ data?: LedgerNote; error?: string }> {
  const session = await getSession();
  if (!session) return { error: "認証が必要です" };

  const contentError = validateContent(input.content);
  if (contentError) return { error: contentError };

  const ledger = await prisma.ledger.findUnique({
    where: { id: input.ledgerId },
    select: { partner: { select: { ownerId: true } } },
  });

  if (!ledger || ledger.partner.ownerId !== session.userId) {
    return { error: "口座が見つかりません" };
  }

  const note = await prisma.ledgerNote.create({
    data: {
      content: input.content.trim(),
      ledgerId: input.ledgerId,
      ownerId: session.userId,
    },
  });

  revalidatePath(`/ledgers/${input.ledgerId}`);
  return { data: note };
}

export async function updateLedgerNote(input: {
  id: string;
  content: string;
}): Promise<{ data?: LedgerNote; error?: string }> {
  const session = await getSession();
  if (!session) return { error: "認証が必要です" };

  const contentError = validateContent(input.content);
  if (contentError) return { error: contentError };

  const existing = await prisma.ledgerNote.findUnique({
    where: { id: input.id },
    select: { ownerId: true, ledgerId: true },
  });

  if (!existing || existing.ownerId !== session.userId) {
    return { error: "メモが見つかりません" };
  }

  const note = await prisma.ledgerNote.update({
    where: { id: input.id },
    data: { content: input.content.trim() },
  });

  revalidatePath(`/ledgers/${existing.ledgerId}`);
  return { data: note };
}

export async function deleteLedgerNote(input: {
  id: string;
}): Promise<{ data?: { id: string }; error?: string }> {
  const session = await getSession();
  if (!session) return { error: "認証が必要です" };

  const existing = await prisma.ledgerNote.findUnique({
    where: { id: input.id },
    select: { ownerId: true, ledgerId: true },
  });

  if (!existing || existing.ownerId !== session.userId) {
    return { error: "メモが見つかりません" };
  }

  await prisma.ledgerNote.delete({ where: { id: input.id } });

  revalidatePath(`/ledgers/${existing.ledgerId}`);
  return { data: { id: input.id } };
}
