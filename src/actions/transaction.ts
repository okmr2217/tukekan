"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export type TransactionWithPartner = {
  id: string;
  amount: number;
  description: string | null;
  date: Date;
  isArchived: boolean;
  partnerId: string;
  partnerName: string;
  partnerIsArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type SortOrder = "date_desc" | "date_asc" | "amount_desc" | "amount_asc";

type GetTransactionsParams = {
  partnerIds?: string[];
  showArchived?: boolean;
  showArchivedPartners?: boolean;
  q?: string;
  sortOrder?: SortOrder;
};

export async function getTransactions(
  params: GetTransactionsParams = {},
): Promise<TransactionWithPartner[]> {
  const session = await getSession();
  if (!session) return [];

  const {
    partnerIds,
    showArchived = false,
    showArchivedPartners = false,
    q,
    sortOrder = "date_desc",
  } = params;

  const dbOrderBy =
    sortOrder === "date_asc"
      ? { date: "asc" as const }
      : { date: "desc" as const };

  const rows = await prisma.transaction.findMany({
    where: {
      ownerId: session.userId,
      ...(showArchived ? {} : { isArchived: false }),
      ...(q ? { description: { contains: q } } : {}),
      partner: {
        ...(showArchivedPartners ? {} : { isArchived: false }),
        ...(partnerIds && partnerIds.length > 0 ? { id: { in: partnerIds } } : {}),
      },
    },
    orderBy: dbOrderBy,
    include: { partner: { select: { name: true, isArchived: true } } },
  });

  const mapped = rows.map((t) => ({
    id: t.id,
    amount: t.amount,
    description: t.description,
    date: t.date,
    isArchived: t.isArchived,
    partnerId: t.partnerId,
    partnerName: t.partner.name,
    partnerIsArchived: t.partner.isArchived,
    createdAt: t.createdAt,
    updatedAt: t.updatedAt,
  }));

  if (sortOrder === "amount_desc") {
    return mapped.sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount));
  }
  if (sortOrder === "amount_asc") {
    return mapped.sort((a, b) => Math.abs(a.amount) - Math.abs(b.amount));
  }
  return mapped;
}

export async function getDescriptionSuggestions(): Promise<string[]> {
  const session = await getSession();
  if (!session) {
    return [];
  }

  const suggestions = await prisma.transaction.groupBy({
    by: ["description"],
    where: {
      ownerId: session.userId,
      description: { not: null },
    },
    _count: { description: true },
    orderBy: { _count: { description: "desc" } },
    take: 10,
  });

  return suggestions
    .map((s) => s.description)
    .filter((d): d is string => d !== null);
}

const createTransactionSchema = z.object({
  partnerId: z.string().min(1, "相手を選択してください"),
  amount: z
    .number()
    .int("整数で入力してください")
    .min(-10000000, "金額は-1,000万円以上で入力してください")
    .max(10000000, "金額は1,000万円以下で入力してください")
    .refine((val) => val !== 0, "金額を入力してください"),
  description: z
    .string()
    .max(100, "説明は100文字以内で入力してください")
    .optional(),
  date: z
    .date()
    .refine((date) => date <= new Date(), "未来の日付は選択できません"),
});

export type CreateTransactionState = {
  error?: string;
  success?: boolean;
};

export async function createTransaction(
  _prevState: CreateTransactionState,
  formData: FormData,
): Promise<CreateTransactionState> {
  const session = await getSession();
  if (!session) {
    return { error: "ログインが必要です" };
  }

  // amountの解析
  const amountStr = formData.get("amount");
  const amount = amountStr ? parseInt(amountStr.toString(), 10) : NaN;

  // dateの解析
  const dateStr = formData.get("date");
  const date = dateStr ? new Date(dateStr.toString()) : new Date();

  const result = createTransactionSchema.safeParse({
    partnerId: formData.get("partnerId"),
    amount: isNaN(amount) ? undefined : amount,
    description: formData.get("description") || undefined,
    date: date,
  });

  if (!result.success) {
    return { error: result.error.issues[0].message };
  }

  const {
    partnerId,
    amount: validAmount,
    description,
    date: validDate,
  } = result.data;

  // partnerが存在し、かつ自分が所有しているかチェック
  const partner = await prisma.partner.findUnique({
    where: { id: partnerId },
  });

  if (!partner) {
    return { error: "指定された相手が見つかりません" };
  }

  if (partner.ownerId !== session.userId) {
    return { error: "この相手への取引を登録する権限がありません" };
  }

  await prisma.transaction.create({
    data: {
      amount: validAmount,
      description: description || null,
      date: validDate,
      ownerId: session.userId,
      partnerId: partnerId,
    },
  });

  revalidatePath("/");
  revalidatePath("/transactions");
  revalidatePath(`/partners/${partnerId}`);

  return { success: true };
}

// 取引更新
const updateTransactionSchema = z.object({
  transactionId: z.string().min(1, "取引IDが必要です"),
  partnerId: z.string().optional(),
  amount: z
    .number()
    .int("整数で入力してください")
    .min(-10000000, "金額は-1,000万円以上で入力してください")
    .max(10000000, "金額は1,000万円以下で入力してください")
    .refine((val) => val !== 0, "金額を入力してください"),
  description: z
    .string()
    .max(100, "説明は100文字以内で入力してください")
    .optional(),
  date: z
    .date()
    .refine((date) => date <= new Date(), "未来の日付は選択できません"),
});

export type UpdateTransactionState = {
  error?: string;
  success?: boolean;
};

export async function updateTransaction(
  _prevState: UpdateTransactionState,
  formData: FormData,
): Promise<UpdateTransactionState> {
  const session = await getSession();
  if (!session) {
    return { error: "ログインが必要です" };
  }

  const amountStr = formData.get("amount");
  const amount = amountStr ? parseInt(amountStr.toString(), 10) : NaN;

  const dateStr = formData.get("date");
  const date = dateStr ? new Date(dateStr.toString()) : new Date();

  const result = updateTransactionSchema.safeParse({
    transactionId: formData.get("transactionId"),
    partnerId: formData.get("partnerId") || undefined,
    amount: isNaN(amount) ? undefined : amount,
    description: formData.get("description") || undefined,
    date: date,
  });

  if (!result.success) {
    return { error: result.error.issues[0].message };
  }

  const {
    transactionId,
    partnerId,
    amount: validAmount,
    description,
    date: validDate,
  } = result.data;

  // 取引が存在し、自分のものかチェック
  const transaction = await prisma.transaction.findUnique({
    where: { id: transactionId },
  });

  if (!transaction) {
    return { error: "取引が見つかりません" };
  }

  if (transaction.ownerId !== session.userId) {
    return { error: "この取引を編集する権限がありません" };
  }

  // 相手が変更される場合、相手が自分のものかチェック
  if (partnerId && partnerId !== transaction.partnerId) {
    const partner = await prisma.partner.findUnique({
      where: { id: partnerId },
    });
    if (!partner || partner.ownerId !== session.userId) {
      return { error: "相手が見つかりません" };
    }
  }

  await prisma.transaction.update({
    where: { id: transactionId },
    data: {
      ...(partnerId ? { partnerId } : {}),
      amount: validAmount,
      description: description || null,
      date: validDate,
    },
  });

  revalidatePath("/");
  revalidatePath("/transactions");
  revalidatePath(`/partners/${transaction.partnerId}`);
  if (partnerId && partnerId !== transaction.partnerId) {
    revalidatePath(`/partners/${partnerId}`);
  }

  return { success: true };
}

// 取引アーカイブ
export async function archiveTransaction(
  transactionId: string,
): Promise<{ error?: string }> {
  const session = await getSession();
  if (!session) return { error: "ログインが必要です" };

  const transaction = await prisma.transaction.findUnique({
    where: { id: transactionId },
  });

  if (!transaction) return { error: "取引が見つかりません" };
  if (transaction.ownerId !== session.userId) {
    return { error: "この取引を操作する権限がありません" };
  }

  await prisma.transaction.update({
    where: { id: transactionId },
    data: { isArchived: true },
  });

  revalidatePath("/");
  revalidatePath("/transactions");
  revalidatePath(`/partners/${transaction.partnerId}`);
  return {};
}

// 取引アーカイブ解除
export async function unarchiveTransaction(
  transactionId: string,
): Promise<{ error?: string }> {
  const session = await getSession();
  if (!session) return { error: "ログインが必要です" };

  const transaction = await prisma.transaction.findUnique({
    where: { id: transactionId },
  });

  if (!transaction) return { error: "取引が見つかりません" };
  if (transaction.ownerId !== session.userId) {
    return { error: "この取引を操作する権限がありません" };
  }

  await prisma.transaction.update({
    where: { id: transactionId },
    data: { isArchived: false },
  });

  revalidatePath("/");
  revalidatePath("/transactions");
  revalidatePath(`/partners/${transaction.partnerId}`);
  return {};
}

// 取引削除
export type DeleteTransactionState = {
  error?: string;
  success?: boolean;
};

export async function deleteTransaction(
  transactionId: string,
): Promise<DeleteTransactionState> {
  const session = await getSession();
  if (!session) {
    return { error: "ログインが必要です" };
  }

  const transaction = await prisma.transaction.findUnique({
    where: { id: transactionId },
  });

  if (!transaction) {
    return { error: "取引が見つかりません" };
  }

  if (transaction.ownerId !== session.userId) {
    return { error: "この取引を削除する権限がありません" };
  }

  await prisma.transaction.delete({
    where: { id: transactionId },
  });

  revalidatePath("/");
  revalidatePath("/transactions");
  revalidatePath(`/partners/${transaction.partnerId}`);

  return { success: true };
}
