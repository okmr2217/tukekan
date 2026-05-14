"use server";

import { z } from "zod";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { revalidatePartnerScope } from "@/lib/revalidate";
import { findOwnedPartner } from "./_helpers";
import type { CreatePartnerState, UpdatePartnerState } from "./types";

const createPartnerSchema = z.object({
  name: z
    .string()
    .min(1, "名前を入力してください")
    .max(50, "名前は50文字以内で入力してください"),
});

const updatePartnerSchema = z.object({
  partnerId: z.string().min(1),
  name: z
    .string()
    .min(1, "名前を入力してください")
    .max(50, "名前は50文字以内で入力してください"),
});

export async function createPartner(
  _prevState: CreatePartnerState,
  formData: FormData,
): Promise<CreatePartnerState> {
  const session = await getSession();
  if (!session) return { error: "ログインが必要です" };

  const result = createPartnerSchema.safeParse({ name: formData.get("name") });
  if (!result.success) return { error: result.error.issues[0].message };

  const { name } = result.data;

  const existing = await prisma.partner.findUnique({
    where: { ownerId_name: { ownerId: session.userId, name } },
  });
  if (existing) return { error: "同じ名前の相手が既に登録されています" };

  const partner = await prisma.partner.create({
    data: { name, ownerId: session.userId },
  });

  revalidatePartnerScope();
  return { success: true, partner: { id: partner.id, name: partner.name } };
}

export async function updatePartner(
  _prevState: UpdatePartnerState,
  formData: FormData,
): Promise<UpdatePartnerState> {
  const session = await getSession();
  if (!session) return { error: "ログインが必要です" };

  const result = updatePartnerSchema.safeParse({
    partnerId: formData.get("partnerId"),
    name: formData.get("name"),
  });
  if (!result.success) return { error: result.error.issues[0].message };

  const { partnerId, name } = result.data;

  if (!(await findOwnedPartner(partnerId, session.userId))) {
    return { error: "相手が見つかりません" };
  }

  const duplicate = await prisma.partner.findUnique({
    where: { ownerId_name: { ownerId: session.userId, name } },
  });
  if (duplicate && duplicate.id !== partnerId) {
    return { error: "同じ名前の相手が既に登録されています" };
  }

  await prisma.partner.update({ where: { id: partnerId }, data: { name } });
  revalidatePartnerScope(partnerId);
  return { success: true };
}

export async function archivePartner(
  partnerId: string,
): Promise<{ error?: string }> {
  const session = await getSession();
  if (!session) return { error: "ログインが必要です" };
  if (!(await findOwnedPartner(partnerId, session.userId))) {
    return { error: "相手が見つかりません" };
  }
  await prisma.partner.update({
    where: { id: partnerId },
    data: { isArchived: true },
  });
  revalidatePartnerScope(partnerId);
  return {};
}

export async function unarchivePartner(
  partnerId: string,
): Promise<{ error?: string }> {
  const session = await getSession();
  if (!session) return { error: "ログインが必要です" };
  if (!(await findOwnedPartner(partnerId, session.userId))) {
    return { error: "相手が見つかりません" };
  }
  await prisma.partner.update({
    where: { id: partnerId },
    data: { isArchived: false },
  });
  revalidatePartnerScope(partnerId);
  return {};
}

export async function deletePartner(
  partnerId: string,
): Promise<{ error?: string }> {
  const session = await getSession();
  if (!session) return { error: "ログインが必要です" };
  if (!(await findOwnedPartner(partnerId, session.userId))) {
    return { error: "相手が見つかりません" };
  }
  await prisma.partner.delete({ where: { id: partnerId } });
  revalidatePartnerScope();
  return {};
}
