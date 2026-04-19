"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createId } from "@paralleldrive/cuid2";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export type Partner = {
  id: string;
  name: string;
};


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
  shareToken: string | null;
  shareTokenExpiresAt: Date | null;
};

export type PartnerForHome = {
  id: string;
  name: string;
  balance: number;
  lastTransaction: {
    amount: number;
    description: string | null;
    date: Date;
  } | null;
};

export async function getPartnersForHome(): Promise<PartnerForHome[]> {
  const session = await getSession();
  if (!session) return [];

  const partners = await prisma.partner.findMany({
    where: { ownerId: session.userId, isArchived: false },
    select: {
      id: true,
      name: true,
      transactions: {
        where: { isArchived: false },
        select: { amount: true, description: true, date: true },
        orderBy: { date: "desc" },
      },
    },
    orderBy: { name: "asc" },
  });

  return partners.map((p) => ({
    id: p.id,
    name: p.name,
    balance: p.transactions.reduce((sum, t) => sum + t.amount, 0),
    lastTransaction: p.transactions[0] ?? null,
  }));
}

export type PartnerById = {
  id: string;
  name: string;
  balance: number;
  isArchived: boolean;
  shareToken: string | null;
  shareTokenExpiresAt: Date | null;
};

export async function getPartnerById(
  partnerId: string,
): Promise<PartnerById | null> {
  const session = await getSession();
  if (!session) return null;

  const partner = await prisma.partner.findUnique({
    where: { id: partnerId },
    select: {
      id: true,
      name: true,
      isArchived: true,
      ownerId: true,
      shareToken: true,
      shareTokenExpiresAt: true,
      transactions: {
        where: { isArchived: false },
        select: { amount: true },
      },
    },
  });

  if (!partner || partner.ownerId !== session.userId) return null;

  return {
    id: partner.id,
    name: partner.name,
    isArchived: partner.isArchived,
    shareToken: partner.shareToken,
    shareTokenExpiresAt: partner.shareTokenExpiresAt,
    balance: partner.transactions.reduce((sum, t) => sum + t.amount, 0),
  };
}

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
      shareToken: true,
      shareTokenExpiresAt: true,
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
    shareToken: p.shareToken,
    shareTokenExpiresAt: p.shareTokenExpiresAt,
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
  revalidatePath("/transactions");
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
  revalidatePath("/transactions");
  revalidatePath("/partners");
  revalidatePath(`/partners/${partnerId}`);

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
  revalidatePath("/transactions");
  revalidatePath("/partners");
  revalidatePath(`/partners/${partnerId}`);

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
  revalidatePath("/transactions");
  revalidatePath("/partners");
  revalidatePath(`/partners/${partnerId}`);

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
  revalidatePath("/transactions");
  revalidatePath("/partners");
  revalidatePath(`/partners/${partnerId}`);

  return { success: true };
}

export type ShareTokenState = {
  error?: string;
  success?: boolean;
  token?: string;
};

export async function generateShareToken(
  partnerId: string,
): Promise<ShareTokenState> {
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

  const token = createId();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 90);

  await prisma.partner.update({
    where: { id: partnerId },
    data: {
      shareToken: token,
      shareTokenExpiresAt: expiresAt,
    },
  });

  revalidatePath("/partners");
  revalidatePath(`/partners/${partnerId}`);

  return { success: true, token };
}

export async function revokeShareToken(
  partnerId: string,
): Promise<{ error?: string; success?: boolean }> {
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
    data: {
      shareToken: null,
      shareTokenExpiresAt: null,
    },
  });

  revalidatePath("/partners");
  revalidatePath(`/partners/${partnerId}`);

  return { success: true };
}

export type SharedPartnerData = {
  partnerName: string;
  balance: number;
  transactions: Array<{
    id: string;
    amount: number;
    description: string | null;
    date: Date;
  }>;
};

export async function getPartnerByShareToken(
  token: string,
): Promise<{ data?: SharedPartnerData; error?: string }> {
  const partner = await prisma.partner.findUnique({
    where: { shareToken: token },
    select: {
      name: true,
      shareTokenExpiresAt: true,
      transactions: {
        where: { isArchived: false },
        select: {
          id: true,
          amount: true,
          description: true,
          date: true,
        },
        orderBy: { date: "desc" },
      },
    },
  });

  if (!partner) {
    return { error: "invalid" };
  }

  if (!partner.shareTokenExpiresAt || partner.shareTokenExpiresAt < new Date()) {
    return { error: "expired" };
  }

  const balance = partner.transactions.reduce((sum, t) => sum + t.amount, 0);

  return {
    data: {
      partnerName: partner.name,
      balance,
      transactions: partner.transactions,
    },
  };
}
