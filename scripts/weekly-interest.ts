/**
 * 週次自動利子ジョブ
 *
 * 毎週水曜日に、週利率が設定されている口座（Ledger）ごとに
 * 「残高 × 週利率」の利子 Transaction を自動作成する。
 * 週利率は残高帯によって2段階（5000円未満 / 5000円以上）で適用する。
 *
 * - 対象: いずれかの週利率 > 0 の口座のうち、現在の残高がプラス（貸している側）のもの
 * - 残高がマイナス・0円の口座は対象外（利子は発生させない）
 * - 実行方法: npx tsx scripts/weekly-interest.ts
 */

import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { getEffectiveWeeklyRate } from "../src/lib/ledger-interest";
import "dotenv/config";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({
  adapter,
});

async function main() {
  console.log("Starting weekly interest job...");

  const ledgers = await prisma.ledger.findMany({
    where: {
      OR: [
        { weeklyInterestRateUnder5000: { gt: 0 } },
        { weeklyInterestRateFrom5000: { gt: 0 } },
      ],
    },
    include: {
      partner: { select: { id: true, name: true, ownerId: true, isArchived: true } },
      transactions: {
        where: { isArchived: false },
        select: { amount: true },
      },
    },
  });

  const targets = ledgers.filter((l) => !l.partner.isArchived);
  console.log(`Found ${targets.length} interest-bearing ledger(s).`);

  let created = 0;

  for (const ledger of targets) {
    const balance = ledger.transactions.reduce((sum, t) => sum + t.amount, 0);
    if (balance <= 0) {
      console.log(
        `Skip "${ledger.partner.name} / ${ledger.title}": balance is ${balance}`,
      );
      continue;
    }

    const rate = getEffectiveWeeklyRate(
      balance,
      ledger.weeklyInterestRateUnder5000 ? Number(ledger.weeklyInterestRateUnder5000) : 0,
      ledger.weeklyInterestRateFrom5000 ? Number(ledger.weeklyInterestRateFrom5000) : 0,
    );
    const interest = Math.round(balance * (rate / 100));
    if (interest <= 0) continue;

    await prisma.transaction.create({
      data: {
        amount: interest,
        description: `利子（週利${rate}%）`,
        date: new Date(),
        ownerId: ledger.partner.ownerId,
        partnerId: ledger.partner.id,
        ledgerId: ledger.id,
      },
    });

    created += 1;
    console.log(
      `Created interest transaction: ${ledger.partner.name} / ${ledger.title} → +¥${interest} (balance ¥${balance} × ${rate}%)`,
    );
  }

  console.log(`Weekly interest job completed. ${created} transaction(s) created.`);
}

main()
  .catch((e) => {
    console.error("Weekly interest job failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
