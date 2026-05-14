import { z } from "zod";
import type { DateMode } from "@/lib/date-picker-utils";

export const transactionFormSchema = z.object({
  amount: z.string().min(1),
  isLending: z.boolean(),
  description: z.string().max(100),
  dateMode: z.enum(["today", "yesterday", "other"]) as z.ZodType<DateMode>,
  otherDate: z.string(),
  selectedTime: z.string(),
});

export type TransactionFormValues = z.infer<typeof transactionFormSchema>;
