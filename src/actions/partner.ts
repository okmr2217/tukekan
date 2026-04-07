"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export type Partner = {
  id: string;
  name: string;
};

export type PartnerOption = {
  id: string;
  name: string;
  isArchived: boolean;
};

export async function getAllPartners(): Promise<PartnerOption[]> {
  const session = await getSession();
  if (!session) return [];

  return prisma.partner.findMany({
    where: { ownerId: session.userId },
    select: { id: true, name: true, isArchived: true },
    orderBy: { name: "asc" },
  });
}

export async function getPartners(): Promise<Partner[]> {
  const session = await getSession();
  if (!session) {
    return [];
  }

  const partners = await prisma.partner.findMany({
    where: { ownerId: session.userId, isArchived: false },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  return partners;
}

const createPartnerSchema = z.object({
  name: z
    .string()
    .min(1, "名前を入力してください")
    .max(50, "名前は50文字以内で入力してください"),
});

export type CreatePartnerState = {
  error?: string;
  success?: boolean;
  partner?: {
    id: string;
    name: string;
  };
};

export type PartnerWithBalance = {
  id: string;
  name: string;
  balance: number;
  isArchived: boolean;
  transactionCount: number;
};

export async function getPartnersWithBalance(): Promise<PartnerWithBalance[]> {
  const session = await getSession();
  if (!session) {
    return [];
  }

  const partners = await prisma.partner.findMany({
    where: { ownerId: session.userId },
    select: {
      id: true,
      name: true,
      isArchived: true,
      transactions: {
        where: { isArchived: false },
        select: { amount: true },
      },
    },
    orderBy: { name: "asc" },
  });

  return partners.map((p) => ({
    id: p.id,
    name: p.name,
    isArchived: p.isArchived,
    transactionCount: p.transactions.length,
    balance: p.transactions.reduce((sum, t) => sum + t.amount, 0),
  }));
}

export async function createPartner(
  _prevState: CreatePartnerState,
  formData: FormData,
): Promise<CreatePartnerState> {
  const session = await getSession();
  if (!session) {
    return { error: "ログインが必要です" };
  }

  const result = createPartnerSchema.safeParse({
    name: formData.get("name"),
  });

  if (!result.success) {
    return { error: result.error.issues[0].message };
  }

  const { name } = result.data;

  const existingPartner = await prisma.partner.findUnique({
    where: {
      ownerId_name: {
        ownerId: session.userId,
        name,
      },
    },
  });

  if (existingPartner) {
    return { error: "同じ名前の相手が既に登録されています" };
  }

  const partner = await prisma.partner.create({
    data: {
      name,
      ownerId: session.userId,
    },
  });

  revalidatePath("/");
  revalidatePath("/partners");

  return {
    success: true,
    partner: {
      id: partner.id,
      name: partner.name,
    },
  };
}

const updatePartnerSchema = z.object({
  partnerId: z.string().min(1),
  name: z
    .string()
    .min(1, "名前を入力してください")
    .max(50, "名前は50文字以内で入力してください"),
});

export type UpdatePartnerState = {
  error?: string;
  success?: boolean;
};

export async function updatePartner(
  _prevState: UpdatePartnerState,
  formData: FormData,
): Promise<UpdatePartnerState> {
  const session = await getSession();
  if (!session) {
    return { error: "ログインが必要です" };
  }

  const result = updatePartnerSchema.safeParse({
    partnerId: formData.get("partnerId"),
    name: formData.get("name"),
  });

  if (!result.success) {
    return { error: result.error.issues[0].message };
  }

  const { partnerId, name } = result.data;

  const partner = await prisma.partner.findUnique({
    where: { id: partnerId },
  });

  if (!partner || partner.ownerId !== session.userId) {
    return { error: "相手が見つかりません" };
  }

  const duplicate = await prisma.partner.findUnique({
    where: { ownerId_name: { ownerId: session.userId, name } },
  });

  if (duplicate && duplicate.id !== partnerId) {
    return { error: "同じ名前の相手が既に登録されています" };
  }

  await prisma.partner.update({
    where: { id: partnerId },
    data: { name },
  });

  revalidatePath("/");
  revalidatePath("/partners");

  return { success: true };
}

export async function archivePartner(
  partnerId: string,
): Promise<{ error?: string }> {
  const session = await getSession();
  if (!session) {
    return { error: "ログインが必要です" };
  }

  const partner = await prisma.partner.findUnique({
    where: { id: partnerId },
  });

  if (!partner || partner.ownerId !== session.userId) {
    return { error: "相手が見つかりません" };
  }

  await prisma.partner.update({
    where: { id: partnerId },
    data: { isArchived: true },
  });

  revalidatePath("/");
  revalidatePath("/partners");

  return {};
}

export async function unarchivePartner(
  partnerId: string,
): Promise<{ error?: string }> {
  const session = await getSession();
  if (!session) {
    return { error: "ログインが必要です" };
  }

  const partner = await prisma.partner.findUnique({
    where: { id: partnerId },
  });

  if (!partner || partner.ownerId !== session.userId) {
    return { error: "相手が見つかりません" };
  }

  await prisma.partner.update({
    where: { id: partnerId },
    data: { isArchived: false },
  });

  revalidatePath("/");
  revalidatePath("/partners");

  return {};
}

export type SettlePartnerState = {
  error?: string;
  success?: boolean;
};

export async function settlePartner(
  partnerId: string,
): Promise<SettlePartnerState> {
  const session = await getSession();
  if (!session) {
    return { error: "ログインが必要です" };
  }

  const partner = await prisma.partner.findUnique({
    where: { id: partnerId },
  });

  if (!partner || partner.ownerId !== session.userId) {
    return { error: "相手が見つかりません" };
  }

  const result = await prisma.transaction.aggregate({
    where: { ownerId: session.userId, partnerId, isArchived: false },
    _sum: { amount: true },
  });

  const balance = result._sum.amount ?? 0;

  if (balance === 0) {
    return { error: "残高が0のため精算できません" };
  }

  await prisma.transaction.create({
    data: {
      amount: -balance,
      description: "精算",
      date: new Date(),
      ownerId: session.userId,
      partnerId,
    },
  });

  revalidatePath("/");
  revalidatePath("/partners");

  return { success: true };
}
