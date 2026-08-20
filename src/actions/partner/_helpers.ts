import prisma from "@/lib/prisma";

export async function findOwnedPartner(partnerId: string, userId: string) {
  const partner = await prisma.partner.findUnique({ where: { id: partnerId } });
  if (!partner || partner.ownerId !== userId) return null;
  return partner;
}

/** その相手の最初の口座（デフォルト口座）を取得。存在しなければ無利子の「通常」口座を作成する。 */
export async function getOrCreateDefaultLedger(partnerId: string) {
  const existing = await prisma.ledger.findFirst({
    where: { partnerId },
    orderBy: { createdAt: "asc" },
  });
  if (existing) return existing;

  return prisma.ledger.create({
    data: { partnerId, title: "通常", weeklyInterestRate: 0 },
  });
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
  const ledger = await prisma.ledger.findUnique({
    where: { id: requestedLedgerId },
  });
  if (!ledger || ledger.partnerId !== partnerId) return null;
  return ledger.id;
}
