/**
 * DB スキーマ（Cloudflare D1 / SQLite）。詳細は docs/03-data-design.md。
 *
 * - テーブル名・カラム名は Supabase（PostgreSQL + Prisma）時代と同じにしてある
 * - 日時は UNIX ミリ秒の整数で持つ（Drizzle が Date に変換する）
 * - 真偽値は 0/1 の整数で持つ（Drizzle が boolean に変換する）
 * - スキーマを変えたら `npm run db:generate` でマイグレーションを作る
 */

import { createId } from "@paralleldrive/cuid2";
import { relations } from "drizzle-orm";
import {
  index,
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

const id = () =>
  text("id")
    .primaryKey()
    .$defaultFn(() => createId());

const createdAt = () =>
  integer("createdAt", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date());

const updatedAt = () =>
  integer("updatedAt", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date())
    .$onUpdateFn(() => new Date());

export const account = sqliteTable("Account", {
  id: id(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  passwordHash: text("passwordHash").notNull(),
  createdAt: createdAt(),
  updatedAt: updatedAt(),

  // 取引フォームの金額ボタンに出す名目ラベルのプリセット。
  // "BOTH" | "LENDER" | "BORROWER"（src/lib/transaction-labels.ts）
  transactionLabelPreset: text("transactionLabelPreset")
    .notNull()
    .default("BOTH"),
});

export const partner = sqliteTable(
  "Partner",
  {
    id: id(),
    name: text("name").notNull(),
    isArchived: integer("isArchived", { mode: "boolean" })
      .notNull()
      .default(false),
    createdAt: createdAt(),
    updatedAt: updatedAt(),

    // 相手ごとの公開ページ（/share/[token]）用のトークン
    shareToken: text("shareToken").unique(),
    shareTokenExpiresAt: integer("shareTokenExpiresAt", {
      mode: "timestamp_ms",
    }),

    // 公開ページ（/share/[token]）に表示するメモ。相手ごとに1つだけ持つ（100文字以内）
    shareNote: text("shareNote"),

    ownerId: text("ownerId")
      .notNull()
      .references(() => account.id, {
        onDelete: "restrict",
        onUpdate: "cascade",
      }),
  },
  (t) => [uniqueIndex("Partner_ownerId_name_key").on(t.ownerId, t.name)],
);

export const ledger = sqliteTable(
  "Ledger",
  {
    id: id(),
    title: text("title").notNull(), // 自由記述（例: "通常", "5000円貸しパターン"）

    // 年利をベーシスポイント（0.01%単位の整数）で持つ。例: 年利 5.25% → 525。0 = 無利子。
    // SQLite には Decimal がないため。アプリ内では toInterestSettings()（src/lib/ledger-interest.ts）で
    // %（number）に直してから使う
    annualInterestRateBp: integer("annualInterestRateBp").notNull().default(0),

    // 利息が発生する曜日（JST基準。0=日曜 〜 6=土曜）
    interestAccrualWeekday: integer("interestAccrualWeekday")
      .notNull()
      .default(3),

    // true = 複利（元本＋未払利息に課金） / false = 単利（元本のみに課金）
    interestCompounding: integer("interestCompounding", { mode: "boolean" })
      .notNull()
      .default(false),

    // 同じ日に二重で利息を発生させないための最終発生日時
    lastInterestAccruedAt: integer("lastInterestAccruedAt", {
      mode: "timestamp_ms",
    }),

    createdAt: createdAt(),
    updatedAt: updatedAt(),

    partnerId: text("partnerId")
      .notNull()
      .references(() => partner.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
  },
  (t) => [index("Ledger_partnerId_idx").on(t.partnerId)],
);

export const transaction = sqliteTable(
  "Transaction",
  {
    id: id(),
    amount: integer("amount").notNull(), // +は貸し、-は借り
    purpose: text("purpose"), // 用途（例: 麻雀、ランチ、返済）。1行・100文字以内
    description: text("description"), // メモ（詳細テキスト）。複数行可・1000文字以内
    date: integer("date", { mode: "timestamp_ms" }).notNull(),

    // 取引の種別。"NORMAL"（通常の貸し借り・返済） | "INTEREST"（自動発生した利息）
    // src/lib/transaction-kind.ts を参照
    kind: text("kind").notNull().default("NORMAL"),

    isArchived: integer("isArchived", { mode: "boolean" })
      .notNull()
      .default(false),
    createdAt: createdAt(),
    updatedAt: updatedAt(),

    ownerId: text("ownerId")
      .notNull()
      .references(() => account.id, {
        onDelete: "restrict",
        onUpdate: "cascade",
      }),

    partnerId: text("partnerId")
      .notNull()
      .references(() => partner.id, {
        onDelete: "restrict",
        onUpdate: "cascade",
      }),

    // 口座（Ledger）への紐づけ。口座導入前の古い取引は null のことがある
    ledgerId: text("ledgerId").references(() => ledger.id, {
      onDelete: "set null",
      onUpdate: "cascade",
    }),
  },
  (t) => [
    index("Transaction_ownerId_idx").on(t.ownerId),
    index("Transaction_partnerId_idx").on(t.partnerId),
    index("Transaction_ledgerId_idx").on(t.ledgerId),
    index("Transaction_date_idx").on(t.date),
  ],
);

// 管理画面（/admin）で行った操作の記録。
// 管理画面は Cloudflare Access で認証するため、actorEmail は Account ではなく
// Access が認証したメールアドレスをそのまま文字列で持つ（リレーションは張らない）。
export const adminAuditLog = sqliteTable(
  "AdminAuditLog",
  {
    id: id(),

    // 操作した管理者のメールアドレス（Cloudflare Access の identity）。Cron からの自動実行は "cron"
    actorEmail: text("actorEmail").notNull(),

    // 操作の種別。src/lib/admin-audit.ts の ADMIN_AUDIT_ACTIONS
    action: text("action").notNull(),

    // 操作対象の種類（"Partner" / "Job" など）と識別子
    targetType: text("targetType"),
    targetId: text("targetId"),

    // 人が読むための要約（例: "共有リンクを失効: たろう"）
    summary: text("summary").notNull(),

    createdAt: createdAt(),
  },
  (t) => [
    index("AdminAuditLog_createdAt_idx").on(t.createdAt),
    index("AdminAuditLog_actorEmail_idx").on(t.actorEmail),
  ],
);

// ---- リレーション（db.query.xxx.findMany({ with }) 用） ----

export const accountRelations = relations(account, ({ many }) => ({
  partners: many(partner),
  transactions: many(transaction),
}));

export const partnerRelations = relations(partner, ({ one, many }) => ({
  owner: one(account, { fields: [partner.ownerId], references: [account.id] }),
  ledgers: many(ledger),
  transactions: many(transaction),
}));

export const ledgerRelations = relations(ledger, ({ one, many }) => ({
  partner: one(partner, {
    fields: [ledger.partnerId],
    references: [partner.id],
  }),
  transactions: many(transaction),
}));

export const transactionRelations = relations(transaction, ({ one }) => ({
  owner: one(account, {
    fields: [transaction.ownerId],
    references: [account.id],
  }),
  partner: one(partner, {
    fields: [transaction.partnerId],
    references: [partner.id],
  }),
  ledger: one(ledger, {
    fields: [transaction.ledgerId],
    references: [ledger.id],
  }),
}));
