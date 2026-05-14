import prisma from "@/lib/prisma";

export async function findOwnedPartner(partnerId: string, userId: string) {
  const partner = await prisma.partner.findUnique({ where: { id: partnerId } });
  if (!partner || partner.ownerId !== userId) return null;
  return partner;
}
