import { z } from "zod";
import type { Resolver } from "react-hook-form";
import type { DateMode } from "@/lib/date-picker-utils";

export const MAX_AMOUNT = 10_000_000;

export const transactionFormSchema = z
  .object({
    partnerId: z.string().min(1, "選択してください"),
    ledgerId: z.string(),
    amount: z.string().min(1, "入力してください"),
    isLending: z.boolean(),
    description: z.string().max(100, "100文字以内で入力してください"),
    dateMode: z.enum(["today", "yesterday", "other"]) as z.ZodType<DateMode>,
    otherDate: z.string(),
    selectedTime: z.string(),
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

    if (values.dateMode === "other" && values.otherDate === "") {
      ctx.addIssue({
        code: "custom",
        path: ["otherDate"],
        message: "日付を選択してください",
      });
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
