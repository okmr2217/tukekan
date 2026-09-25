"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { account as accountTable } from "@/db/schema";
import { hashPassword, verifyPassword } from "@/lib/password";
import {
  generateJWT,
  setSessionCookie,
  deleteSessionCookie,
  getSession,
} from "@/lib/auth";
import {
  DEFAULT_TRANSACTION_LABEL_PRESET,
  TRANSACTION_LABEL_PRESETS,
  toTransactionLabelPreset,
  type TransactionLabelPreset,
} from "@/lib/transaction-labels";

const loginSchema = z.object({
  email: z.string().email("メールアドレスの形式が正しくありません"),
  password: z.string().min(1, "パスワードを入力してください"),
});

export type LoginState = {
  error?: string;
};

const registerSchema = z.object({
  email: z.string().email("メールアドレスの形式が正しくありません"),
  password: z.string().min(8, "パスワードは8文字以上で入力してください"),
});

export type RegisterState = {
  error?: string;
};

export async function login(
  _prevState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const result = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!result.success) {
    return { error: result.error.issues[0].message };
  }

  const { email, password } = result.data;

  const account = await db.query.account.findFirst({
    where: eq(accountTable.email, email),
  });

  if (!account) {
    return { error: "メールアドレスまたはパスワードが正しくありません" };
  }

  const isValid = await verifyPassword(password, account.passwordHash);
  if (!isValid) {
    return { error: "メールアドレスまたはパスワードが正しくありません" };
  }

  const token = await generateJWT({
    userId: account.id,
    email: account.email,
    name: account.name,
  });

  await setSessionCookie(token);
  redirect("/");
}

export async function register(
  _prevState: RegisterState,
  formData: FormData,
): Promise<RegisterState> {
  const result = registerSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!result.success) {
    return { error: result.error.issues[0].message };
  }

  const { email, password } = result.data;

  const existing = await db.query.account.findFirst({
    where: eq(accountTable.email, email),
    columns: { id: true },
  });
  if (existing) {
    return { error: "このメールアドレスはすでに登録されています" };
  }

  // 表示名はオンボーディングの最初のステップで決めてもらう。
  // それまでの仮の名前としてメールアドレスの @ より前を入れておく（入力欄の初期値にもなる）
  const name = email.split("@")[0].slice(0, 20);

  const passwordHash = await hashPassword(password);
  const [account] = await db
    .insert(accountTable)
    .values({ name, email, passwordHash })
    .returning();

  const token = await generateJWT({
    userId: account.id,
    email: account.email,
    name: account.name,
  });

  await setSessionCookie(token);
  redirect("/onboarding");
}

export async function logout(): Promise<void> {
  await deleteSessionCookie();
  redirect("/login");
}

// ユーザー情報取得
export async function getCurrentUser() {
  const session = await getSession();
  if (!session) return null;

  const account = await db.query.account.findFirst({
    where: eq(accountTable.id, session.userId),
    columns: {
      id: true,
      email: true,
      name: true,
      createdAt: true,
      transactionLabelPreset: true,
      onboardingCompletedAt: true,
    },
  });

  if (!account) return null;

  return {
    ...account,
    transactionLabelPreset: toTransactionLabelPreset(
      account.transactionLabelPreset,
    ),
  };
}

// 取引フォームの名目ラベルプリセットを取得（未ログイン時は既定値）
export async function getTransactionLabelPreset(): Promise<TransactionLabelPreset> {
  const session = await getSession();
  if (!session) return DEFAULT_TRANSACTION_LABEL_PRESET;

  const account = await db.query.account.findFirst({
    where: eq(accountTable.id, session.userId),
    columns: { transactionLabelPreset: true },
  });

  return toTransactionLabelPreset(account?.transactionLabelPreset);
}

// 取引フォームの名目ラベルプリセットを更新
const transactionLabelPresetSchema = z.enum(TRANSACTION_LABEL_PRESETS);

export type UpdateTransactionLabelPresetState = {
  success?: boolean;
  error?: string;
};

export async function updateTransactionLabelPreset(
  preset: string,
): Promise<UpdateTransactionLabelPresetState> {
  const session = await getSession();
  if (!session) {
    return { error: "ログインが必要です" };
  }

  const result = transactionLabelPresetSchema.safeParse(preset);
  if (!result.success) {
    return { error: "不正な選択肢です" };
  }

  await db
    .update(accountTable)
    .set({ transactionLabelPreset: result.data })
    .where(eq(accountTable.id, session.userId));

  // 取引フォームは (main) レイアウトでプリセットを読んでいるので全体を無効化する
  revalidatePath("/", "layout");

  return { success: true };
}

// プロフィール更新
const updateProfileSchema = z.object({
  name: z
    .string()
    .min(1, "ユーザー名を入力してください")
    .max(50, "ユーザー名は50文字以内で入力してください"),
  currentPassword: z.string().optional(),
  newPassword: z.string().optional(),
});

export type UpdateProfileState = {
  success?: boolean;
  error?: string;
};

export async function updateProfile(
  _prevState: UpdateProfileState,
  formData: FormData,
): Promise<UpdateProfileState> {
  const session = await getSession();
  if (!session) {
    return { error: "ログインが必要です" };
  }

  const result = updateProfileSchema.safeParse({
    name: formData.get("name"),
    currentPassword: formData.get("currentPassword") || undefined,
    newPassword: formData.get("newPassword") || undefined,
  });

  if (!result.success) {
    return { error: result.error.issues[0].message };
  }

  const { name, currentPassword, newPassword } = result.data;

  const currentAccount = await db.query.account.findFirst({
    where: eq(accountTable.id, session.userId),
  });

  if (!currentAccount) {
    return { error: "アカウントが見つかりません" };
  }

  if (newPassword) {
    if (!currentPassword) {
      return { error: "現在のパスワードを入力してください" };
    }

    if (newPassword.length < 6) {
      return { error: "新しいパスワードは6文字以上で入力してください" };
    }

    const isValid = await verifyPassword(
      currentPassword,
      currentAccount.passwordHash,
    );
    if (!isValid) {
      return { error: "現在のパスワードが正しくありません" };
    }

    const newPasswordHash = await hashPassword(newPassword);
    await db
      .update(accountTable)
      .set({ name, passwordHash: newPasswordHash })
      .where(eq(accountTable.id, session.userId));
  } else {
    await db
      .update(accountTable)
      .set({ name })
      .where(eq(accountTable.id, session.userId));
  }

  const token = await generateJWT({
    userId: session.userId,
    email: currentAccount.email,
    name,
  });
  await setSessionCookie(token);

  return { success: true };
}
