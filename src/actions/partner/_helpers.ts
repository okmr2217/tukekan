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
