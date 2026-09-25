import { asc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { ledger, partner } from "@/db/schema";

export async function findOwnedPartner(partnerId: string, userId: string) {
  const found = await db.query.partner.findFirst({
    where: eq(partner.id, partnerId),
  });
  if (!found || found.ownerId !== userId) return null;
  return found;
}

/** その相手の最初の口座（デフォルト口座）を取得。存在しなければ無利子の「通常」口座を作成する。 */
export async function getOrCreateDefaultLedger(partnerId: string) {
  const existing = await db.query.ledger.findFirst({
    where: eq(ledger.partnerId, partnerId),
    orderBy: asc(ledger.createdAt),
  });
  if (existing) return existing;

  const [created] = await db
    .insert(ledger)
    .values({
      partnerId,
      title: "通常",
      annualInterestRateBp: 0,
    })
    .returning();
  return created;
}

/**
 * リクエストされた口座IDがその相手の口座として有効ならそのまま使い、
 * 指定がなければデフォルト口座にフォールバックする。
 * 無効な口座IDが指定された場合は null を返す。
 */
export async function resolveLedgerId(
  partnerId: string,
  requestedLedgerId?: string,
): Promise<string | null> {
  if (!requestedLedgerId) {
    return (await getOrCreateDefaultLedger(partnerId)).id;
  }
  const found = await db.query.ledger.findFirst({
    where: eq(ledger.id, requestedLedgerId),
    columns: { id: true, partnerId: true },
  });
  if (!found || found.partnerId !== partnerId) return null;
  return found.id;
}
