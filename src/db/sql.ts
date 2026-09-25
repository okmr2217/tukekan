import { sql, type AnyColumn, type SQL } from "drizzle-orm";

/**
 * 部分一致の検索条件（`column LIKE '%keyword%'`）。
 *
 * キーワード中の `%` `_` はワイルドカードとして扱わず文字どおりに探すよう、エスケープする。
 * SQLite の LIKE は英字（ASCII）の大文字・小文字を区別しない。日本語には影響しない。
 */
export function contains(column: AnyColumn, keyword: string): SQL {
  const escaped = keyword.replace(/[\\%_]/g, (c) => `\\${c}`);
  return sql`${column} like ${`%${escaped}%`} escape '\\'`;
}
