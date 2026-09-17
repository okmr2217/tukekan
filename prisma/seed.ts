import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import "dotenv/config";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({
  adapter,
});

const demoEmail = process.env.SEED_DEMO_EMAIL ?? "demo@example.com";
const demoPassword = process.env.SEED_DEMO_PASSWORD ?? "password123";

function daysAgo(days: number): Date {
  const d = new Date("2026-05-06");
  d.setDate(d.getDate() - days);
  return d;
}

async function main() {
  const passwordHash = await bcrypt.hash(demoPassword, 12);

  const yuki = await prisma.account.create({
    data: {
      email: demoEmail,
      name: "ゆうき",
      passwordHash,
    },
  });

  const aoi = await prisma.partner.create({
    data: { name: "あおい", ownerId: yuki.id },
  });
  const haruto = await prisma.partner.create({
    data: { name: "はると", ownerId: yuki.id },
  });
  const mio = await prisma.partner.create({
    data: { name: "みお", ownerId: yuki.id },
  });
  const sota = await prisma.partner.create({
    data: { name: "そうた", ownerId: yuki.id },
  });

  // あおいとの取引 (18件)
  await prisma.transaction.createMany({
    data: [
      { ownerId: yuki.id, partnerId: aoi.id, amount: 1600, purpose: "カフェ代（2人分）", date: daysAgo(85) },
      { ownerId: yuki.id, partnerId: aoi.id, amount: 1200, purpose: "ランチ割り勘", date: daysAgo(78) },
      { ownerId: yuki.id, partnerId: aoi.id, amount: 3600, purpose: "映画チケット（2枚）", date: daysAgo(72) },
      { ownerId: yuki.id, partnerId: aoi.id, amount: 980, purpose: "コンビニまとめ買い", date: daysAgo(68) },
      { ownerId: yuki.id, partnerId: aoi.id, amount: 8400, purpose: "旅行交通費立替", date: daysAgo(60) },
      { ownerId: yuki.id, partnerId: aoi.id, amount: 12000, purpose: "宿泊費立替", date: daysAgo(59) },
      { ownerId: yuki.id, partnerId: aoi.id, amount: 2800, purpose: "旅行中の食事", date: daysAgo(58) },
      { ownerId: yuki.id, partnerId: aoi.id, amount: -8000, purpose: "あおいから返済", date: daysAgo(50) },
      { ownerId: yuki.id, partnerId: aoi.id, amount: 3200, purpose: "スーパー代", date: daysAgo(45) },
      { ownerId: yuki.id, partnerId: aoi.id, amount: 2400, purpose: "カラオケ代", date: daysAgo(38) },
      { ownerId: yuki.id, partnerId: aoi.id, amount: 3000, purpose: "誕生日プレゼント", date: daysAgo(32) },
      { ownerId: yuki.id, partnerId: aoi.id, amount: 1400, purpose: "ランチ", date: daysAgo(28) },
      { ownerId: yuki.id, partnerId: aoi.id, amount: 900, purpose: "カフェ", date: daysAgo(22) },
      { ownerId: yuki.id, partnerId: aoi.id, amount: -5000, purpose: "あおいから返済", date: daysAgo(18) },
      { ownerId: yuki.id, partnerId: aoi.id, amount: 4200, purpose: "夕食代", date: daysAgo(14) },
      { ownerId: yuki.id, partnerId: aoi.id, amount: 650, purpose: "コンビニ", date: daysAgo(10) },
      { ownerId: yuki.id, partnerId: aoi.id, amount: 1800, purpose: "映画", date: daysAgo(6) },
      { ownerId: yuki.id, partnerId: aoi.id, amount: 1300, purpose: "ランチ", date: daysAgo(2) },
    ],
  });

  // はるととの取引 (18件)
  await prisma.transaction.createMany({
    data: [
      { ownerId: yuki.id, partnerId: haruto.id, amount: 6800, purpose: "飲み会代立替", date: daysAgo(82) },
      { ownerId: yuki.id, partnerId: haruto.id, amount: 2400, purpose: "タクシー代", date: daysAgo(80) },
      { ownerId: yuki.id, partnerId: haruto.id, amount: 1500, purpose: "ランチ", date: daysAgo(75) },
      { ownerId: yuki.id, partnerId: haruto.id, amount: -4000, purpose: "はるとから返済", date: daysAgo(70) },
      { ownerId: yuki.id, partnerId: haruto.id, amount: 1200, purpose: "ゲームセンター", date: daysAgo(65) },
      { ownerId: yuki.id, partnerId: haruto.id, amount: 5600, purpose: "焼肉代", date: daysAgo(55) },
      { ownerId: yuki.id, partnerId: haruto.id, amount: 1100, purpose: "コンビニ", date: daysAgo(52) },
      { ownerId: yuki.id, partnerId: haruto.id, amount: 9000, purpose: "ライブチケット立替", date: daysAgo(44) },
      { ownerId: yuki.id, partnerId: haruto.id, amount: -6000, purpose: "はるとから返済", date: daysAgo(40) },
      { ownerId: yuki.id, partnerId: haruto.id, amount: 4800, purpose: "BBQ食材代", date: daysAgo(35) },
      { ownerId: yuki.id, partnerId: haruto.id, amount: 3200, purpose: "スポーツ用品", date: daysAgo(30) },
      { ownerId: yuki.id, partnerId: haruto.id, amount: 2800, purpose: "飲み代", date: daysAgo(25) },
      { ownerId: yuki.id, partnerId: haruto.id, amount: -3000, purpose: "はるとから返済", date: daysAgo(20) },
      { ownerId: yuki.id, partnerId: haruto.id, amount: 1600, purpose: "ランチ", date: daysAgo(16) },
      { ownerId: yuki.id, partnerId: haruto.id, amount: 2000, purpose: "カラオケ", date: daysAgo(12) },
      { ownerId: yuki.id, partnerId: haruto.id, amount: 780, purpose: "コンビニ", date: daysAgo(8) },
      { ownerId: yuki.id, partnerId: haruto.id, amount: 3400, purpose: "夕食代", date: daysAgo(4) },
      { ownerId: yuki.id, partnerId: haruto.id, amount: 1100, purpose: "カフェ", date: daysAgo(1) },
    ],
  });

  // みおとの取引 (14件) — ゆうきがみおに借りている状態
  await prisma.transaction.createMany({
    data: [
      { ownerId: yuki.id, partnerId: mio.id, amount: -7000, purpose: "旅行宿泊費（みお立替）", date: daysAgo(75) },
      { ownerId: yuki.id, partnerId: mio.id, amount: -5000, purpose: "旅行交通費（みお立替）", date: daysAgo(74) },
      { ownerId: yuki.id, partnerId: mio.id, amount: -3000, purpose: "旅行中の食事（みお立替）", date: daysAgo(73) },
      { ownerId: yuki.id, partnerId: mio.id, amount: 3000, purpose: "返済", date: daysAgo(65) },
      { ownerId: yuki.id, partnerId: mio.id, amount: 1800, purpose: "カフェ代（2人分）", date: daysAgo(58) },
      { ownerId: yuki.id, partnerId: mio.id, amount: -2800, purpose: "映画チケット（みお立替）", date: daysAgo(48) },
      { ownerId: yuki.id, partnerId: mio.id, amount: 2000, purpose: "返済", date: daysAgo(40) },
      { ownerId: yuki.id, partnerId: mio.id, amount: -2400, purpose: "ディナー（みお立替）", date: daysAgo(32) },
      { ownerId: yuki.id, partnerId: mio.id, amount: 1200, purpose: "カフェ", date: daysAgo(25) },
      { ownerId: yuki.id, partnerId: mio.id, amount: 1900, purpose: "ランチ", date: daysAgo(18) },
      { ownerId: yuki.id, partnerId: mio.id, amount: 2500, purpose: "返済", date: daysAgo(12) },
      { ownerId: yuki.id, partnerId: mio.id, amount: 500, purpose: "プリクラ", date: daysAgo(8) },
      { ownerId: yuki.id, partnerId: mio.id, amount: 1400, purpose: "カフェ", date: daysAgo(4) },
      { ownerId: yuki.id, partnerId: mio.id, amount: 1600, purpose: "ランチ", date: daysAgo(1) },
    ],
  });

  // そうたとの取引 (14件)
  await prisma.transaction.createMany({
    data: [
      { ownerId: yuki.id, partnerId: sota.id, amount: 6000, purpose: "ゲーム代立替", date: daysAgo(78) },
      { ownerId: yuki.id, partnerId: sota.id, amount: 4200, purpose: "飲み会", date: daysAgo(72) },
      { ownerId: yuki.id, partnerId: sota.id, amount: -4000, purpose: "そうたから返済", date: daysAgo(65) },
      { ownerId: yuki.id, partnerId: sota.id, amount: 1800, purpose: "ランチ", date: daysAgo(58) },
      { ownerId: yuki.id, partnerId: sota.id, amount: 2400, purpose: "漫画喫茶", date: daysAgo(50) },
      { ownerId: yuki.id, partnerId: sota.id, amount: -2000, purpose: "そうたから返済", date: daysAgo(45) },
      { ownerId: yuki.id, partnerId: sota.id, amount: 6400, purpose: "焼肉代", date: daysAgo(38) },
      { ownerId: yuki.id, partnerId: sota.id, amount: 1200, purpose: "コンビニ", date: daysAgo(33) },
      { ownerId: yuki.id, partnerId: sota.id, amount: -5000, purpose: "そうたから返済", date: daysAgo(28) },
      { ownerId: yuki.id, partnerId: sota.id, amount: 1800, purpose: "映画", date: daysAgo(22) },
      { ownerId: yuki.id, partnerId: sota.id, amount: 3600, purpose: "飲み会", date: daysAgo(16) },
      { ownerId: yuki.id, partnerId: sota.id, amount: -2000, purpose: "そうたから返済", date: daysAgo(11) },
      { ownerId: yuki.id, partnerId: sota.id, amount: 2200, purpose: "ランチ", date: daysAgo(6) },
      { ownerId: yuki.id, partnerId: sota.id, amount: 1300, purpose: "カフェ", date: daysAgo(2) },
    ],
  });

  // そうたの「利子つき」口座 — 利息の分離（元本／未払利息）を確認するためのデモ
  const sotaInterestLedger = await prisma.ledger.create({
    data: {
      partnerId: sota.id,
      title: "利子つき",
      annualInterestRate: 260, // 週5%（260 ÷ 52）
      interestAccrualWeekday: 3, // 毎週水曜
      interestCompounding: false, // 単利（元本のみに課金）
    },
  });

  await prisma.transaction.createMany({
    data: [
      {
        ownerId: yuki.id,
        partnerId: sota.id,
        ledgerId: sotaInterestLedger.id,
        amount: 20000,
        purpose: "貸付",
        date: daysAgo(21),
      },
      {
        ownerId: yuki.id,
        partnerId: sota.id,
        ledgerId: sotaInterestLedger.id,
        amount: 1000,
        kind: "INTEREST",
        purpose: "利子（年利260%）",
        date: daysAgo(14),
      },
      {
        ownerId: yuki.id,
        partnerId: sota.id,
        ledgerId: sotaInterestLedger.id,
        amount: 1000,
        kind: "INTEREST",
        purpose: "利子（年利260%）",
        date: daysAgo(7),
      },
      {
        // 返済1,500円 → まず未払利息2,000円のうち1,500円に充当される
        ownerId: yuki.id,
        partnerId: sota.id,
        ledgerId: sotaInterestLedger.id,
        amount: -1500,
        purpose: "そうたから返済",
        date: daysAgo(3),
      },
    ],
  });

  console.log("Seed completed!");
  console.log("");
  console.log(`デモアカウント（パスワード: ${demoPassword}）:`);
  console.log(`  - ゆうき (${demoEmail})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
