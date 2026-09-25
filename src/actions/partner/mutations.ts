"use server";

import { createId } from "@paralleldrive/cuid2";
import { z } from "zod";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { ledger, partner as partnerTable } from "@/db/schema";
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

/** 同じ持ち主の中で名前が一致する相手（名前は持ち主ごとに一意） */
async function findPartnerByName(ownerId: string, name: string) {
  return db.query.partner.findFirst({
    where: and(eq(partnerTable.ownerId, ownerId), eq(partnerTable.name, name)),
    columns: { id: true },
  });
}

export async function createPartner(
  _prevState: CreatePartnerState,
  formData: FormData,
): Promise<CreatePartnerState> {
  const session = await getSession();
  if (!session) return { error: "ログインが必要です" };

  const result = createPartnerSchema.safeParse({ name: formData.get("name") });
  if (!result.success) return { error: result.error.issues[0].message };

  const { name } = result.data;

  const existing = await findPartnerByName(session.userId, name);
  if (existing) return { error: "同じ名前の相手が既に登録されています" };

  // 相手と最初の「通常」口座をまとめて作る（batch は1つのトランザクションで実行される）
  const partnerId = createId();
  const [[partner]] = await db.batch([
    db
      .insert(partnerTable)
      .values({ id: partnerId, name, ownerId: session.userId })
      .returning(),
    db.insert(ledger).values({
      partnerId,
      title: "通常",
      annualInterestRateBp: 0,
    }),
  ]);

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

  const duplicate = await findPartnerByName(session.userId, name);
  if (duplicate && duplicate.id !== partnerId) {
    return { error: "同じ名前の相手が既に登録されています" };
  }

  await db
    .update(partnerTable)
    .set({ name })
    .where(eq(partnerTable.id, partnerId));
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
  await db
    .update(partnerTable)
    .set({ isArchived: true })
    .where(eq(partnerTable.id, partnerId));
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
  await db
    .update(partnerTable)
    .set({ isArchived: false })
    .where(eq(partnerTable.id, partnerId));
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
  await db.delete(partnerTable).where(eq(partnerTable.id, partnerId));
  revalidatePartnerScope();
  return {};
}
