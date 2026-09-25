/**
 * Supabase（PostgreSQL）の全データを、D1 に流し込む SQL ファイルに書き出すワンショットスクリプト。
 * 手順は docs/11-cloudflare-workers.md の「Supabase から D1 へのデータ移行」を参照。
 *
 *   DATABASE_URL="postgresql://..." npx tsx scripts/migrate-supabase-to-d1.ts [出力先]
 *   npx wrangler d1 execute tukekan-db --remote --file=.d1-import.sql
 *
 * - 出力先の既定は .d1-import.sql（.gitignore 済み。パスワードハッシュを含むのでコミットしない）
 * - 出力する SQL は先頭で D1 側の全行を消してから入れ直すので、何度流しても同じ結果になる
 * - 型の変換:
 *     DateTime  → UNIX ミリ秒の整数
 *     Boolean   → 0 / 1
 *     Ledger.annualInterestRate（Decimal, %） → annualInterestRateBp（整数, 0.01%単位）
 * - 最後に移行元の件数と金額の合計を表示する。D1 側で同じ値になるかを確かめる
 *
 * 移行が終わったら、このスクリプトと devDependencies の pg / @types/pg は削除してよい。
 */

import { writeFileSync } from "node:fs";
import pg from "pg";

// Prisma は DateTime を「タイムゾーンなしの timestamp（中身は UTC）」で保存している。
// node-pg は既定でこれをローカル時刻として読んでしまい、JST の端末だと9時間ずれるので UTC として読む
const TIMESTAMP_WITHOUT_TZ_OID = 1114;
pg.types.setTypeParser(TIMESTAMP_WITHOUT_TZ_OID, (value) => new Date(`${value}Z`));

type Value = string | number | boolean | Date | null;
type Column = { name: string; convert?: (value: unknown) => Value };

type TableSpec = {
  table: string;
  columns: Column[];
};

/** 年利(%, Decimal は文字列で届く) → ベーシスポイント */
const toBasisPoints = (value: unknown): number =>
  value === null ? 0 : Math.round(Number(value) * 100);

// 外部キーの順（親 → 子）。削除はこの逆順で行う
const TABLES: TableSpec[] = [
  {
    table: "Account",
    columns: [
      { name: "id" },
      { name: "email" },
      { name: "name" },
      { name: "passwordHash" },
      { name: "createdAt" },
      { name: "updatedAt" },
      { name: "transactionLabelPreset" },
    ],
  },
  {
    table: "Partner",
    columns: [
      { name: "id" },
      { name: "name" },
      { name: "isArchived" },
      { name: "createdAt" },
      { name: "updatedAt" },
      { name: "shareToken" },
      { name: "shareTokenExpiresAt" },
      { name: "shareNote" },
      { name: "ownerId" },
    ],
  },
  {
    table: "Ledger",
    columns: [
      { name: "id" },
      { name: "title" },
      { name: "annualInterestRate", convert: toBasisPoints },
      { name: "interestAccrualWeekday" },
      { name: "interestCompounding" },
      { name: "lastInterestAccruedAt" },
      { name: "createdAt" },
      { name: "updatedAt" },
      { name: "partnerId" },
    ],
  },
  {
    table: "Transaction",
    columns: [
      { name: "id" },
      { name: "amount" },
      { name: "purpose" },
      { name: "description" },
      { name: "date" },
      { name: "kind" },
      { name: "isArchived" },
      { name: "createdAt" },
      { name: "updatedAt" },
      { name: "ownerId" },
      { name: "partnerId" },
      { name: "ledgerId" },
    ],
  },
  {
    table: "AdminAuditLog",
    columns: [
      { name: "id" },
      { name: "actorEmail" },
      { name: "action" },
      { name: "targetType" },
      { name: "targetId" },
      { name: "summary" },
      { name: "createdAt" },
    ],
  },
];

/** D1 側の列名（年利だけ名前と単位が変わる） */
function d1ColumnName(table: string, column: string): string {
  return table === "Ledger" && column === "annualInterestRate"
    ? "annualInterestRateBp"
    : column;
}

function toSqlLiteral(value: Value): string {
  if (value === null) return "NULL";
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) throw new Error("Invalid date");
    return String(value.getTime());
  }
  if (typeof value === "boolean") return value ? "1" : "0";
  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new Error(`Invalid number: ${value}`);
    return String(value);
  }
  return `'${value.replaceAll("'", "''")}'`;
}

const quote = (identifier: string) => `"${identifier}"`;

async function main() {
  const outPath = process.argv[2] ?? ".d1-import.sql";
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL（Supabase の接続文字列）を指定してください");
  }

  const client = new pg.Client({ connectionString });
  await client.connect();

  try {
    const lines: string[] = [
      "-- scripts/migrate-supabase-to-d1.ts が生成した D1 への取り込み用 SQL（コミットしない）",
      "PRAGMA defer_foreign_keys = true;",
      ...[...TABLES].reverse().map((t) => `DELETE FROM ${quote(t.table)};`),
    ];

    for (const spec of TABLES) {
      const selectList = spec.columns.map((c) => quote(c.name)).join(", ");
      const { rows } = await client.query<Record<string, unknown>>(
        `SELECT ${selectList} FROM ${quote(spec.table)} ORDER BY "createdAt", "id"`,
      );

      const insertColumns = spec.columns
        .map((c) => quote(d1ColumnName(spec.table, c.name)))
        .join(", ");

      for (const row of rows) {
        const values = spec.columns
          .map((c) => {
            const raw = row[c.name];
            return toSqlLiteral(c.convert ? c.convert(raw) : (raw as Value));
          })
          .join(", ");
        lines.push(
          `INSERT INTO ${quote(spec.table)} (${insertColumns}) VALUES (${values});`,
        );
      }

      console.log(`${spec.table}: ${rows.length} rows`);
    }

    writeFileSync(outPath, `${lines.join("\n")}\n`);
    console.log(`\nWrote ${outPath}`);

    // D1 に流し込んだあと、同じクエリを D1 で実行して一致するか確かめる
    const { rows: [check] } = await client.query<{
      transactions: string;
      amount: string | null;
      ledgers: string;
      rate_bp: string | null;
    }>(`
      SELECT
        (SELECT count(*) FROM "Transaction") AS transactions,
        (SELECT sum("amount") FROM "Transaction") AS amount,
        (SELECT count(*) FROM "Ledger") AS ledgers,
        (SELECT sum(round(coalesce("annualInterestRate", 0) * 100)) FROM "Ledger") AS rate_bp
    `);
    console.log("\n移行元の検算値（D1 側で下のコマンドを実行し、同じ値になるか確認する）:");
    console.log(
      `  transactions=${check.transactions} amount=${check.amount ?? 0} ` +
        `ledgers=${check.ledgers} rate_bp=${check.rate_bp ?? 0}`,
    );
    console.log(
      `  npx wrangler d1 execute tukekan-db --remote --command ` +
        `'SELECT (SELECT count(*) FROM "Transaction") AS transactions, ` +
        `(SELECT sum("amount") FROM "Transaction") AS amount, ` +
        `(SELECT count(*) FROM "Ledger") AS ledgers, ` +
        `(SELECT sum("annualInterestRateBp") FROM "Ledger") AS rate_bp'`,
    );
  } finally {
    await client.end();
  }
}

main().catch((e) => {
  console.error("Export failed:", e);
  process.exit(1);
});
