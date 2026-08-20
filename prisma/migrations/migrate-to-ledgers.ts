/**
 * 既存の Partner に紐づく Transaction を、口座（Ledger）構造に移行するスクリプト
 *
 * - まだ口座を持たない Partner ごとに、デフォルト口座（title: "通常", weeklyInterestRate: 0）を作成する
 * - ledgerId が未設定の Transaction を、その Partner のデフォルト口座に紐づける
 *
 * 実行方法:
 * npx tsx prisma/migrations/migrate-to-ledgers.ts
 *
 * 注意: このスクリプトはスキーママイグレーション（20260820010000_add_ledger）後に一度だけ実行してください
 */

import { PrismaClient } from "../../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({
  adapter,
});

async function main() {
  console.log("Starting migration to ledgers...");

  const partners = await prisma.partner.findMany({
    where: { transactions: { some: { ledgerId: null } } },
    select: { id: true, name: true },
  });

  if (partners.length === 0) {
    console.log("No partners to migrate.");
    return;
  }

  console.log(`Found ${partners.length} partners with unmigrated transactions.`);

  for (const partner of partners) {
    let ledger = await prisma.ledger.findFirst({
      where: { partnerId: partner.id, title: "通常" },
    });

    if (!ledger) {
      ledger = await prisma.ledger.create({
        data: {
          partnerId: partner.id,
          title: "通常",
          weeklyInterestRate: 0,
        },
      });
    }

    const { count } = await prisma.transaction.updateMany({
      where: { partnerId: partner.id, ledgerId: null },
      data: { ledgerId: ledger.id },
    });

    console.log(
      `Migrated ${count} transaction(s) of partner "${partner.name}" to ledger "${ledger.title}"`,
    );
  }

  console.log("Migration completed successfully!");
}

main()
  .catch((e) => {
    console.error("Migration failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
