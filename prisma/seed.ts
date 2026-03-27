import { PrismaClient, Role } from "../src/app/generated/prisma/client";
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
  await prisma.group.deleteMany({});

  // グループ作成（招待コードはスクリーンショットシナリオで使用）
  const group = await prisma.group.create({
    data: {
      name: "山本家",
      inviteCode: "demo-invite-code",
    },
  });

  // メンバー作成
  const taro = await prisma.account.create({
    data: {
      name: "太郎",
      passwordHash,
      groupId: group.id,
      role: Role.ADMIN,
    },
  });

  const hanako = await prisma.account.create({
    data: {
      name: "花子",
      passwordHash,
      groupId: group.id,
      role: Role.MEMBER,
    },
  });

  const kenta = await prisma.account.create({
    data: {
      name: "健太",
      passwordHash,
      groupId: group.id,
      role: Role.MEMBER,
    },
  });

  // パートナー関係（双方向）
  const taroHanako = await prisma.partner.create({
    data: { name: "花子", ownerId: taro.id, linkedAccountId: hanako.id },
  });
  const taroKenta = await prisma.partner.create({
    data: { name: "健太", ownerId: taro.id, linkedAccountId: kenta.id },
  });
  const hanakoTaro = await prisma.partner.create({
    data: { name: "太郎", ownerId: hanako.id, linkedAccountId: taro.id },
  });
  const hanakoKenta = await prisma.partner.create({
    data: { name: "健太", ownerId: hanako.id, linkedAccountId: kenta.id },
  });
  const kentaTaro = await prisma.partner.create({
    data: { name: "太郎", ownerId: kenta.id, linkedAccountId: taro.id },
  });
  const kentaHanako = await prisma.partner.create({
    data: { name: "花子", ownerId: kenta.id, linkedAccountId: hanako.id },
  });

  // 太郎の取引履歴（花子との間）
  await prisma.transaction.createMany({
    data: [
      { ownerId: taro.id, partnerId: taroHanako.id, amount: 5400,  description: "スーパー代（週末）",    date: daysAgo(52) },
      { ownerId: taro.id, partnerId: taroHanako.id, amount: -3000, description: "電気代（2月分）",       date: daysAgo(45) },
      { ownerId: taro.id, partnerId: taroHanako.id, amount: 2800,  description: "外食（ランチ）",        date: daysAgo(38) },
      { ownerId: taro.id, partnerId: taroHanako.id, amount: 1200,  description: "薬局",                  date: daysAgo(30) },
      { ownerId: taro.id, partnerId: taroHanako.id, amount: -1500, description: "映画チケット",           date: daysAgo(22) },
      { ownerId: taro.id, partnerId: taroHanako.id, amount: 3200,  description: "スーパー代（食材）",    date: daysAgo(15) },
      { ownerId: taro.id, partnerId: taroHanako.id, amount: 800,   description: "コンビニ",              date: daysAgo(8)  },
      { ownerId: taro.id, partnerId: taroHanako.id, amount: 1500,  description: "日用品まとめ買い",      date: daysAgo(3)  },
    ],
  });

  // 太郎の取引履歴（健太との間）
  await prisma.transaction.createMany({
    data: [
      { ownerId: taro.id, partnerId: taroKenta.id, amount: 8000,  description: "家賃立替（3月分）",   date: daysAgo(48) },
      { ownerId: taro.id, partnerId: taroKenta.id, amount: -2500, description: "飲み会",               date: daysAgo(35) },
      { ownerId: taro.id, partnerId: taroKenta.id, amount: 1500,  description: "ガソリン代立替",       date: daysAgo(25) },
      { ownerId: taro.id, partnerId: taroKenta.id, amount: 2000,  description: "食材代（鍋パーティー）", date: daysAgo(12) },
      { ownerId: taro.id, partnerId: taroKenta.id, amount: -3000, description: "健太返済",             date: daysAgo(5)  },
    ],
  });

  // 花子の取引（太郎との間）
  await prisma.transaction.createMany({
    data: [
      { ownerId: hanako.id, partnerId: hanakoTaro.id, amount: 3000,  description: "電気代（2月分）",    date: daysAgo(45) },
      { ownerId: hanako.id, partnerId: hanakoTaro.id, amount: 1500,  description: "映画チケット",        date: daysAgo(22) },
      { ownerId: hanako.id, partnerId: hanakoTaro.id, amount: -5400, description: "スーパー代（週末）",  date: daysAgo(52) },
      { ownerId: hanako.id, partnerId: hanakoKenta.id, amount: 2000, description: "カフェ代",            date: daysAgo(20) },
    ],
  });

  // 健太の取引
  await prisma.transaction.createMany({
    data: [
      { ownerId: kenta.id, partnerId: kentaTaro.id, amount: 2500,  description: "飲み会",               date: daysAgo(35) },
      { ownerId: kenta.id, partnerId: kentaTaro.id, amount: 3000,  description: "返済",                  date: daysAgo(5)  },
      { ownerId: kenta.id, partnerId: kentaHanako.id, amount: -2000, description: "カフェ代",            date: daysAgo(20) },
    ],
  });

  console.log("Seed completed!");
  console.log("");
  console.log("グループ: 山本家（招待コード: demo-invite-code）");
  console.log("メンバー（パスワード: password123）:");
  console.log("  - 太郎（管理者）");
  console.log("  - 花子");
  console.log("  - 健太");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
