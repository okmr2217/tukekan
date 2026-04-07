"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { hashPassword, verifyPassword } from "@/lib/password";
import {
  generateJWT,
  setSessionCookie,
  deleteSessionCookie,
  getSession,
} from "@/lib/auth";

const loginSchema = z.object({
  email: z.string().email("メールアドレスの形式が正しくありません"),
  password: z.string().min(1, "パスワードを入力してください"),
});

export type LoginState = {
  error?: string;
};

const registerSchema = z.object({
  name: z
    .string()
    .min(1, "表示名を入力してください")
    .max(20, "表示名は20文字以内で入力してください"),
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

  const account = await prisma.account.findUnique({
    where: { email },
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
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!result.success) {
    return { error: result.error.issues[0].message };
  }

  const { name, email, password } = result.data;

  const existing = await prisma.account.findUnique({ where: { email } });
  if (existing) {
    return { error: "このメールアドレスはすでに登録されています" };
  }

  const passwordHash = await hashPassword(password);
  const account = await prisma.account.create({
    data: { name, email, passwordHash },
  });

  const token = await generateJWT({
    userId: account.id,
    email: account.email,
    name: account.name,
  });

  await setSessionCookie(token);
  redirect("/");
}

export async function logout(): Promise<void> {
  await deleteSessionCookie();
  redirect("/login");
}

// ユーザー情報取得
export async function getCurrentUser() {
  const session = await getSession();
  if (!session) return null;

  const account = await prisma.account.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      email: true,
      name: true,
      createdAt: true,
    },
  });

  return account;
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

  const currentAccount = await prisma.account.findUnique({
    where: { id: session.userId },
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
    await prisma.account.update({
      where: { id: session.userId },
      data: { name, passwordHash: newPasswordHash },
    });
  } else {
    await prisma.account.update({
      where: { id: session.userId },
      data: { name },
    });
  }

  const token = await generateJWT({
    userId: session.userId,
    email: currentAccount.email,
    name,
  });
  await setSessionCookie(token);

  return { success: true };
}

export { getSession };
