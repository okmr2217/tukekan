import { z } from "zod";
import type { Resolver } from "react-hook-form";
import { parseDateTimeLocal, type DateMode } from "@/lib/date-picker-utils";

export const MAX_AMOUNT = 10_000_000;
export const MAX_PURPOSE_LENGTH = 100;
export const MAX_DESCRIPTION_LENGTH = 1000;

export const transactionFormSchema = z
  .object({
    partnerId: z.string().min(1, "選択してください"),
    ledgerId: z.string(),
    amount: z.string().min(1, "入力してください"),
    isLending: z.boolean(),
    purpose: z.string().max(100, "100文字以内で入力してください"),
    description: z.string().max(1000, "1000文字以内で入力してください"),
    dateMode: z.enum(["now", "custom"]) as z.ZodType<DateMode>,
    customDateTime: z.string(),
  })
  .superRefine((values, ctx) => {
    if (values.amount !== "") {
      const amount = Number(values.amount);
      if (!Number.isInteger(amount) || amount <= 0) {
        ctx.addIssue({
          code: "custom",
          path: ["amount"],
          message: "1円以上の整数で入力してください",
        });
      } else if (amount > MAX_AMOUNT) {
        ctx.addIssue({
          code: "custom",
          path: ["amount"],
          message: `${MAX_AMOUNT.toLocaleString()}円以下で入力してください`,
        });
      }
    }

    if (values.dateMode === "custom") {
      const date = parseDateTimeLocal(values.customDateTime);
      if (!date) {
        ctx.addIssue({
          code: "custom",
          path: ["customDateTime"],
          message: "日時を入力してください",
        });
      } else if (date.getTime() > Date.now()) {
        ctx.addIssue({
          code: "custom",
          path: ["customDateTime"],
          message: "未来の日時は選択できません",
        });
      }
    }
  });

export type TransactionFormValues = z.infer<typeof transactionFormSchema>;

/**
 * @hookform/resolvers を足さずに zod スキーマを RHF に繋ぐための最小リゾルバ。
 */
export const transactionFormResolver: Resolver<TransactionFormValues> = (
  values,
) => {
  const result = transactionFormSchema.safeParse(values);
  if (result.success) {
    return { values: result.data, errors: {} };
  }

  const errors: Record<string, { type: string; message: string }> = {};
  for (const issue of result.error.issues) {
    const path = issue.path.join(".");
    if (!errors[path]) {
      errors[path] = { type: issue.code, message: issue.message };
    }
  }
  return { values: {}, errors };
};
