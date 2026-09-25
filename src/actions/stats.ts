"use server";

import { and, asc, count, eq, gte, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { partner as partnerTable, transaction } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { toJST } from "@/lib/date-utils";

/*
 * 相手単位の集計（口座をまたぐ）。
 *
 * 利息を元本と分けて持つようになった後も「元本 + 未払利息 = 全取引の金額合計」は
 * 変わらないため、ここでの合計・累計は従来どおり正しい。
 * 元本／未払利息の内訳が必要な口座別の統計は `src/actions/ledger-stats.ts` を参照。
 */

export type PartnerStat = {
  partnerId: string;
  partnerName: string;
  balance: number;
  totalLent: number;
  totalBorrowed: number;
  transactionCount: number;
};

export type OverallStat = {
  balance: number;
  totalLent: number;
  totalBorrowed: number;
  transactionCount: number;
};

export type MonthlyStat = {
  month: string; // "YYYY-MM"
  monthLabel: string; // "YYYY年M月"
  totalLent: number;
  totalBorrowed: number;
  net: number;
};

/** 取引の金額の集計（残高・貸した合計・借りた合計・件数）を1回のクエリで出す列 */
const amountTotals = {
  balance: sql<number>`coalesce(sum(${transaction.amount}), 0)`.mapWith(Number),
  totalLent: sql<number>`coalesce(sum(case when ${transaction.amount} > 0 then ${transaction.amount} else 0 end), 0)`.mapWith(
    Number,
  ),
  totalBorrowed: sql<number>`coalesce(sum(case when ${transaction.amount} < 0 then -${transaction.amount} else 0 end), 0)`.mapWith(
    Number,
  ),
  transactionCount: count(),
};

export async function getPartnerStats(): Promise<PartnerStat[]> {
  const session = await getSession();
  if (!session) {
    return [];
  }

  const [partners, totals] = await Promise.all([
    db.query.partner.findMany({
      where: and(
        eq(partnerTable.ownerId, session.userId),
        eq(partnerTable.isArchived, false),
      ),
      columns: { id: true, name: true },
      orderBy: asc(partnerTable.name),
    }),
    db
      .select({ partnerId: transaction.partnerId, ...amountTotals })
      .from(transaction)
      .where(
        and(
          eq(transaction.ownerId, session.userId),
          eq(transaction.isArchived, false),
        ),
      )
      .groupBy(transaction.partnerId),
  ]);

  const totalsByPartner = new Map(totals.map((t) => [t.partnerId, t]));

  return partners.map((partner) => {
    const t = totalsByPartner.get(partner.id);
    return {
      partnerId: partner.id,
      partnerName: partner.name,
      balance: t?.balance ?? 0,
      totalLent: t?.totalLent ?? 0,
      totalBorrowed: t?.totalBorrowed ?? 0,
      transactionCount: t?.transactionCount ?? 0,
    };
  });
}

export async function getOverallStats(): Promise<OverallStat> {
  const session = await getSession();
  if (!session) {
    return { balance: 0, totalLent: 0, totalBorrowed: 0, transactionCount: 0 };
  }

  const [totals] = await db
    .select(amountTotals)
    .from(transaction)
    .innerJoin(partnerTable, eq(transaction.partnerId, partnerTable.id))
    .where(
      and(
        eq(transaction.ownerId, session.userId),
        eq(transaction.isArchived, false),
        eq(partnerTable.ownerId, session.userId),
        eq(partnerTable.isArchived, false),
      ),
    );

  return totals;
}

export async function getMonthlyStats(): Promise<MonthlyStat[]> {
  const session = await getSession();
  if (!session) return [];

  // JST での現在月を基準に直近12ヶ月を計算
  const nowJST = toJST(new Date());
  const startOfEarliestMonthJST = new Date(
    nowJST.getFullYear(),
    nowJST.getMonth() - 11,
    1,
  );
  // JST 0:00 → UTC (-9h)
  const startUTC = new Date(
    startOfEarliestMonthJST.getTime() - 9 * 60 * 60 * 1000,
  );

  const transactions = await db
    .select({ amount: transaction.amount, date: transaction.date })
    .from(transaction)
    .innerJoin(partnerTable, eq(transaction.partnerId, partnerTable.id))
    .where(
      and(
        eq(transaction.ownerId, session.userId),
        eq(transaction.isArchived, false),
        eq(partnerTable.ownerId, session.userId),
        eq(partnerTable.isArchived, false),
        gte(transaction.date, startUTC),
      ),
    );

  // 直近12ヶ月分のキーを初期化
  const monthMap = new Map<string, { totalLent: number; totalBorrowed: number }>();
  for (let i = 11; i >= 0; i--) {
    const d = new Date(nowJST.getFullYear(), nowJST.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    monthMap.set(key, { totalLent: 0, totalBorrowed: 0 });
  }

  // 取引を JST 月ごとに集計
  for (const tx of transactions) {
    const jst = toJST(tx.date);
    const key = `${jst.getFullYear()}-${String(jst.getMonth() + 1).padStart(2, "0")}`;
    const entry = monthMap.get(key);
    if (!entry) continue;
    if (tx.amount > 0) {
      entry.totalLent += tx.amount;
    } else {
      entry.totalBorrowed += Math.abs(tx.amount);
    }
  }

  return Array.from(monthMap.entries()).map(([month, data]) => {
    const [year, monthNum] = month.split("-").map(Number);
    return {
      month,
      monthLabel: `${year}年${monthNum}月`,
      totalLent: data.totalLent,
      totalBorrowed: data.totalBorrowed,
      net: data.totalLent - data.totalBorrowed,
    };
  });
}
