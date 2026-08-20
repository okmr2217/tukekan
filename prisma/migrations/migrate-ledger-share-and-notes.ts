/**
 * 共有リンクとメモを Partner から Ledger（口座）に移す移行スクリプト
 *
 * - 各 Partner の（無利子の）デフォルト口座を特定する
 * - 旧 Partner.shareToken / shareTokenExpiresAt をそのデフォルト口座にコピーする
 * - 旧 PartnerNote の各行を、対応する相手のデフォルト口座に紐づく LedgerNote として複製する
 *
 * 旧テーブル・旧カラムは削除しない（このスクリプトはコピーのみ）。
 * 削除は、アプリが新しいデータで問題なく動くことを確認した後、別マイグレーションで行う。
 *
 * 実行方法:
 * npx tsx prisma/migrations/migrate-ledger-share-and-notes.ts
 *
 * 注意: このスクリプトはスキーママイグレーション
 * （20260821000000_ledger_share_and_notes）後に一度だけ実行してください。
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

async function getDefaultLedgerId(partnerId: string): Promise<string | null> {
  const zeroRateLedger = await prisma.ledger.findFirst({
    where: { partnerId, title: "通常" },
    orderBy: { createdAt: "asc" },
  });
  if (zeroRateLedger) return zeroRateLedger.id;

  const anyLedger = await prisma.ledger.findFirst({
    where: { partnerId },
    orderBy: { createdAt: "asc" },
  });
  return anyLedger?.id ?? null;
}

async function migrateShareTokens() {
  const partnersWithToken = await prisma.$queryRaw<
    { id: string; name: string; shareToken: string; shareTokenExpiresAt: Date }[]
  >`
    SELECT id, name, "shareToken", "shareTokenExpiresAt"
    FROM "Partner"
    WHERE "shareToken" IS NOT NULL
  `;

  console.log(`Found ${partnersWithToken.length} partner(s) with a share token.`);

  for (const partner of partnersWithToken) {
    const ledgerId = await getDefaultLedgerId(partner.id);
    if (!ledgerId) {
      console.warn(`  Skipping "${partner.name}": no ledger found.`);
      continue;
    }

    const alreadySet = await prisma.ledger.findUnique({
      where: { id: ledgerId },
      select: { shareToken: true },
    });
    if (alreadySet?.shareToken) {
      console.log(`  Ledger for "${partner.name}" already has a share token, skipping.`);
      continue;
    }

    await prisma.ledger.update({
      where: { id: ledgerId },
      data: {
        shareToken: partner.shareToken,
        shareTokenExpiresAt: partner.shareTokenExpiresAt,
      },
    });
    console.log(`  Copied share token for "${partner.name}" to ledger ${ledgerId}.`);
  }
}

async function migrateNotes() {
  const notes = await prisma.$queryRaw<
    {
      id: string;
      content: string;
      createdAt: Date;
      updatedAt: Date;
      ownerId: string;
      partnerId: string;
    }[]
  >`
    SELECT id, content, "createdAt", "updatedAt", "ownerId", "partnerId"
    FROM "PartnerNote"
  `;

  console.log(`Found ${notes.length} partner note(s) to migrate.`);

  const ledgerIdCache = new Map<string, string | null>();

  for (const note of notes) {
    let ledgerId = ledgerIdCache.get(note.partnerId);
    if (ledgerId === undefined) {
      ledgerId = await getDefaultLedgerId(note.partnerId);
      ledgerIdCache.set(note.partnerId, ledgerId);
    }
    if (!ledgerId) {
      console.warn(`  Skipping note ${note.id}: no ledger found for partner ${note.partnerId}.`);
      continue;
    }

    const existing = await prisma.ledgerNote.findFirst({
      where: {
        ledgerId,
        ownerId: note.ownerId,
        content: note.content,
        createdAt: note.createdAt,
      },
    });
    if (existing) continue;

    await prisma.ledgerNote.create({
      data: {
        content: note.content,
        createdAt: note.createdAt,
        updatedAt: note.updatedAt,
        ownerId: note.ownerId,
        ledgerId,
      },
    });
  }

  console.log("Notes migrated.");
}

async function main() {
  console.log("Starting migration of share tokens and notes to ledgers...");
  await migrateShareTokens();
  await migrateNotes();
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
