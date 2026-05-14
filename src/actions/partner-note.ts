"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import type { PartnerNote } from "@/generated/prisma";

function validateContent(content: string): string | null {
  const trimmed = content.trim();
  if (trimmed.length === 0 || trimmed.length > 100) {
    return "メモは1〜100文字で入力してください";
  }
  return null;
}

export async function createPartnerNote(input: {
  partnerId: string;
  content: string;
}): Promise<{ data?: PartnerNote; error?: string }> {
  const session = await getSession();
  if (!session) return { error: "認証が必要です" };

  const contentError = validateContent(input.content);
  if (contentError) return { error: contentError };

  const partner = await prisma.partner.findUnique({
    where: { id: input.partnerId },
    select: { ownerId: true },
  });

  if (!partner || partner.ownerId !== session.userId) {
    return { error: "相手が見つかりません" };
  }

  const note = await prisma.partnerNote.create({
    data: {
      content: input.content.trim(),
      partnerId: input.partnerId,
      ownerId: session.userId,
    },
  });

  revalidatePath(`/partners/${input.partnerId}`);
  return { data: note };
}

export async function updatePartnerNote(input: {
  id: string;
  content: string;
}): Promise<{ data?: PartnerNote; error?: string }> {
  const session = await getSession();
  if (!session) return { error: "認証が必要です" };

  const contentError = validateContent(input.content);
  if (contentError) return { error: contentError };

  const existing = await prisma.partnerNote.findUnique({
    where: { id: input.id },
    select: { ownerId: true, partnerId: true },
  });

  if (!existing || existing.ownerId !== session.userId) {
    return { error: "メモが見つかりません" };
  }

  const note = await prisma.partnerNote.update({
    where: { id: input.id },
    data: { content: input.content.trim() },
  });

  revalidatePath(`/partners/${existing.partnerId}`);
  return { data: note };
}

export async function deletePartnerNote(input: {
  id: string;
}): Promise<{ data?: { id: string }; error?: string }> {
  const session = await getSession();
  if (!session) return { error: "認証が必要です" };

  const existing = await prisma.partnerNote.findUnique({
    where: { id: input.id },
    select: { ownerId: true, partnerId: true },
  });

  if (!existing || existing.ownerId !== session.userId) {
    return { error: "メモが見つかりません" };
  }

  await prisma.partnerNote.delete({ where: { id: input.id } });

  revalidatePath(`/partners/${existing.partnerId}`);
  return { data: { id: input.id } };
}
