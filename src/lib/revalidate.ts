import { revalidatePath } from "next/cache";

/** パートナーCRUD後にキャッシュを無効化 */
export function revalidatePartnerScope(partnerId?: string) {
  revalidatePath("/home");
  revalidatePath("/transactions");
  if (partnerId) revalidatePath(`/partners/${partnerId}`);
}

/** 取引CRUD後にキャッシュを無効化 */
export function revalidateTransactionScope(...partnerIds: string[]) {
  revalidatePath("/home");
  revalidatePath("/transactions");
  for (const id of partnerIds) revalidatePath(`/partners/${id}`);
}
