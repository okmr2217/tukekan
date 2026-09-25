import { getCloudflareContext } from "@opennextjs/cloudflare";
import { drizzle, type DrizzleD1Database } from "drizzle-orm/d1";
import * as schema from "@/db/schema";

/**
 * DB クライアント（Drizzle ORM + Cloudflare D1）。
 *
 * D1 は Worker のバインディング（wrangler.jsonc の d1_databases → env.DB）経由でしか
 * つなげない。`next dev` でも next.config.ts の initOpenNextCloudflareForDev() により
 * wrangler のローカル D1（.wrangler/state）が同じ形で渡ってくる。
 *
 * バインディングはリクエストのコンテキストから取り出すため、呼び出し側が
 * `db.select()...` とそのまま書けるよう、実体を遅延して取り出す Proxy を export している。
 *
 * 注意: D1 は BEGIN/COMMIT による対話的なトランザクションを使えない（db.transaction() は使わない）。
 * 複数の書き込みをまとめて成功/失敗させたいときは db.batch([...]) を使う（D1 の batch は
 * 1つのトランザクションとして実行される）。
 */

export type Database = DrizzleD1Database<typeof schema>;

export function createDb(d1: D1Database): Database {
  return drizzle(d1, { schema });
}

// スキーマの解析を毎回やり直さないよう、バインディングごとにクライアントを使い回す
const clients = new WeakMap<D1Database, Database>();

function getDb(): Database {
  const { env } = getCloudflareContext();
  let client = clients.get(env.DB);
  if (!client) {
    client = createDb(env.DB);
    clients.set(env.DB, client);
  }
  return client;
}

export const db = new Proxy({} as Database, {
  get(_target, prop) {
    const client = getDb();
    const value = Reflect.get(client, prop, client);
    return typeof value === "function" ? value.bind(client) : value;
  },
});
