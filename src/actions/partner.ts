"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
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
