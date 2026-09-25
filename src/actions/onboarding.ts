"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { account as accountTable } from "@/db/schema";
import { getSession } from "@/lib/auth";

/**
 * オンボーディングを終える（最後まで進んだときも、途中で「あとで」を選んだときも呼ぶ）。
 * 完了日時を記録してホームへ送る。
 */
export async function completeOnboarding(): Promise<void> {
  const session = await getSession();
  if (!session) redirect("/login");

  await db
    .update(accountTable)
    .set({ onboardingCompletedAt: new Date() })
    .where(eq(accountTable.id, session.userId));

  revalidatePath("/", "layout");
  redirect("/");
}
