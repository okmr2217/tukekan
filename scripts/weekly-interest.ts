/**
 * 週次自動利子ジョブ
 *
 * 毎日 9:00 JST に起動し、「その日が発生曜日に設定されている口座（Ledger）」だけを処理する。
 * 各口座につき週1回、利息の Transaction（kind: "INTEREST"）を自動作成する。
 *
 * - 対象: 年利 > 0 かつ、発生曜日が当日（JST）の口座。相手がアーカイブ済みの口座は対象外
 * - 利息額: 対象額 × 年利 ÷ 52（四捨五入）
 *   - 単利（既定）: 対象額 = 元本残高
 *   - 複利:         対象額 = 元本残高 + 未払利息
 * - 対象額が0以下の口座は対象外（利子は発生させない）
 * - 発生した利息は元本には足さず「未払利息」としてたまる（返済時にまず利息から充当される）
 * - 同じ日に二重で発生させないよう lastInterestAccruedAt を見てスキップする
 * - 実行方法: npx tsx scripts/weekly-interest.ts
 */

import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import {
  calcWeeklyInterestAmount,
  formatRate,
  getInterestBase,
  getWeekdayLabel,
  toInterestSettings,
} from "../src/lib/ledger-interest";
import { calcLedgerBreakdown } from "../src/lib/ledger-balance";
import { formatDateToJST, toJST } from "../src/lib/date-utils";
import "dotenv/config";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({
  adapter,
});

async function main() {
  const now = new Date();
  const todayWeekday = toJST(now).getDay();
  const todayJST = formatDateToJST(now);

  console.log(
    `Starting weekly interest job... (${todayJST} ${getWeekdayLabel(todayWeekday)}曜日 JST)`,
  );

  const ledgers = await prisma.ledger.findMany({
    where: {
      annualInterestRate: { gt: 0 },
      interestAccrualWeekday: todayWeekday,
    },
    include: {
      partner: { select: { id: true, name: true, ownerId: true, isArchived: true } },
      transactions: {
        where: { isArchived: false },
        select: { amount: true, kind: true, date: true, createdAt: true },
      },
    },
  });

  const targets = ledgers.filter((l) => !l.partner.isArchived);
  console.log(
    `Found ${targets.length} ledger(s) accruing interest on ${getWeekdayLabel(todayWeekday)}曜日.`,
  );

  let created = 0;
  let skipped = 0;

  for (const ledger of targets) {
    const label = `${ledger.partner.name} / ${ledger.title}`;

    // 同じ日に二重で発生させない（ジョブの再実行・手動実行対策）
    if (
      ledger.lastInterestAccruedAt &&
      formatDateToJST(ledger.lastInterestAccruedAt) === todayJST
    ) {
      console.log(`Skip "${label}": already accrued today`);
      skipped += 1;
      continue;
    }

    const settings = toInterestSettings(ledger);
    const breakdown = calcLedgerBreakdown(ledger.transactions);
    const base = getInterestBase(breakdown, settings.interestCompounding);
    const interest = calcWeeklyInterestAmount(base, settings.annualInterestRate);

    if (interest <= 0) {
      console.log(
        `Skip "${label}": base is ¥${base} (principal ¥${breakdown.principal} / unpaid interest ¥${breakdown.unpaidInterest})`,
      );
      skipped += 1;
      continue;
    }

    await prisma.$transaction([
      prisma.transaction.create({
        data: {
          amount: interest,
          kind: "INTEREST",
          purpose: `利子（年利${formatRate(settings.annualInterestRate)}%）`,
          date: now,
          ownerId: ledger.partner.ownerId,
          partnerId: ledger.partner.id,
          ledgerId: ledger.id,
        },
      }),
      prisma.ledger.update({
        where: { id: ledger.id },
        data: { lastInterestAccruedAt: now },
      }),
    ]);

    created += 1;
    console.log(
      `Created interest transaction: ${label} → +¥${interest} (` +
        `${settings.interestCompounding ? "複利" : "単利"} base ¥${base} × 年利${formatRate(
          settings.annualInterestRate,
        )}% ÷ 52)`,
    );
  }

  console.log(
    `Weekly interest job completed. ${created} transaction(s) created, ${skipped} skipped.`,
  );
}

main()
  .catch((e) => {
    console.error("Weekly interest job failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
