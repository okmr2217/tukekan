import { PrismaClient } from "../src/app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import "dotenv/config";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({
  adapter,
});

function daysAgo(days: number): Date {
  const d = new Date("2026-03-27");
  d.setDate(d.getDate() - days);
  return d;
}

async function main() {
  const passwordHash = await bcrypt.hash("password123", 12);

  // 既存データを削除
  await prisma.transaction.deleteMany({});
  await prisma.partner.deleteMany({});
  await prisma.account.deleteMany({});

  // メンバー作成
  const taro = await prisma.account.create({
    data: {
      email: "taro@example.com",
      name: "太郎",
      passwordHash,
    },
  });

  const hanako = await prisma.account.create({
    data: {
      email: "hanako@example.com",
      name: "花子",
      passwordHash,
    },
  });

  const kenta = await prisma.account.create({
    data: {
      email: "kenta@example.com",
      name: "健太",
      passwordHash,
    },
  });

  // パートナー関係
  const taroHanako = await prisma.partner.create({
    data: { name: "花子", ownerId: taro.id },
  });
  const taroKenta = await prisma.partner.create({
    data: { name: "健太", ownerId: taro.id },
  });
  const hanakoTaro = await prisma.partner.create({
    data: { name: "太郎", ownerId: hanako.id },
  });
  const hanakoKenta = await prisma.partner.create({
    data: { name: "健太", ownerId: hanako.id },
  });
  const kentaTaro = await prisma.partner.create({
    data: { name: "太郎", ownerId: kenta.id },
  });
  const kentaHanako = await prisma.partner.create({
    data: { name: "花子", ownerId: kenta.id },
  });

  // 太郎の取引履歴（花子との間）
  await prisma.transaction.createMany({
    data: [
      {
        ownerId: taro.id,
        partnerId: taroHanako.id,
        amount: 5400,
        description: "スーパー代（週末）",
        date: daysAgo(52),
      },
      {
        ownerId: taro.id,
        partnerId: taroHanako.id,
        amount: -3000,
        description: "電気代（2月分）",
        date: daysAgo(45),
      },
      {
        ownerId: taro.id,
        partnerId: taroHanako.id,
        amount: 2800,
        description: "外食（ランチ）",
        date: daysAgo(38),
      },
      {
        ownerId: taro.id,
        partnerId: taroHanako.id,
        amount: 1200,
        description: "薬局",
        date: daysAgo(30),
      },
      {
        ownerId: taro.id,
        partnerId: taroHanako.id,
        amount: -1500,
        description: "映画チケット",
        date: daysAgo(22),
      },
      {
        ownerId: taro.id,
        partnerId: taroHanako.id,
        amount: 3200,
        description: "スーパー代（食材）",
        date: daysAgo(15),
      },
      {
        ownerId: taro.id,
        partnerId: taroHanako.id,
        amount: 800,
        description: "コンビニ",
        date: daysAgo(8),
      },
      {
        ownerId: taro.id,
        partnerId: taroHanako.id,
        amount: 1500,
        description: "日用品まとめ買い",
        date: daysAgo(3),
      },
    ],
  });

  // 太郎の取引履歴（健太との間）
  await prisma.transaction.createMany({
    data: [
      {
        ownerId: taro.id,
        partnerId: taroKenta.id,
        amount: 8000,
        description: "家賃立替（3月分）",
        date: daysAgo(48),
      },
      {
        ownerId: taro.id,
        partnerId: taroKenta.id,
        amount: -2500,
        description: "飲み会",
        date: daysAgo(35),
      },
      {
        ownerId: taro.id,
        partnerId: taroKenta.id,
        amount: 1500,
        description: "ガソリン代立替",
        date: daysAgo(25),
      },
      {
        ownerId: taro.id,
        partnerId: taroKenta.id,
        amount: 2000,
        description: "食材代（鍋パーティー）",
        date: daysAgo(12),
      },
      {
        ownerId: taro.id,
        partnerId: taroKenta.id,
        amount: -3000,
        description: "健太返済",
        date: daysAgo(5),
      },
    ],
  });

  // 花子の取引
  await prisma.transaction.createMany({
    data: [
      {
        ownerId: hanako.id,
        partnerId: hanakoTaro.id,
        amount: 3000,
        description: "電気代（2月分）",
        date: daysAgo(45),
      },
      {
        ownerId: hanako.id,
        partnerId: hanakoTaro.id,
        amount: 1500,
        description: "映画チケット",
        date: daysAgo(22),
      },
      {
        ownerId: hanako.id,
        partnerId: hanakoTaro.id,
        amount: -5400,
        description: "スーパー代（週末）",
        date: daysAgo(52),
      },
      {
        ownerId: hanako.id,
        partnerId: hanakoKenta.id,
        amount: 2000,
        description: "カフェ代",
        date: daysAgo(20),
      },
    ],
  });

  // 健太の取引
  await prisma.transaction.createMany({
    data: [
      {
        ownerId: kenta.id,
        partnerId: kentaTaro.id,
        amount: 2500,
        description: "飲み会",
        date: daysAgo(35),
      },
      {
        ownerId: kenta.id,
        partnerId: kentaTaro.id,
        amount: 3000,
        description: "返済",
        date: daysAgo(5),
      },
      {
        ownerId: kenta.id,
        partnerId: kentaHanako.id,
        amount: -2000,
        description: "カフェ代",
        date: daysAgo(20),
      },
    ],
  });

  console.log("Seed completed!");
  console.log("");
  console.log("メンバー（パスワード: password123）:");
  console.log("  - 太郎 (taro@example.com)");
  console.log("  - 花子 (hanako@example.com)");
  console.log("  - 健太 (kenta@example.com)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
