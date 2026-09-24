import { cache } from "react";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

/**
 * Prisma クライアント。
 *
 * - Node.js（`next dev` / `next start`）: プロセス内で1つのクライアントを使い回す。
 * - Cloudflare Workers（本番）: リクエストごとに作り直す。Workers では
 *   あるリクエストで開いたソケットを別のリクエストから使えないため、
 *   グローバルに持ったコネクションプールを共有するとエラーになる。
 *   React の cache() で「1リクエストにつき1つ」にしている。
 *
 * 呼び出し側はどちらの環境でも `prisma.xxx` とそのまま書けるよう、
 * 実体を遅延して取り出す Proxy を default export している。
 */

const isCloudflareWorkers =
  typeof navigator !== "undefined" &&
  navigator.userAgent === "Cloudflare-Workers";

function createClient(connectionString: string | undefined): PrismaClient {
  const adapter = new PrismaPg({
    connectionString,
    // Workers ではリクエストをまたいで接続を再利用できないので、使い捨てにする
    ...(isCloudflareWorkers ? { maxUses: 1 } : {}),
  });
  return new PrismaClient({ adapter });
}

// Workers: Hyperdrive のバインディングがあればそちらを優先し、なければ DATABASE_URL に直接つなぐ
const getWorkersClient = cache((): PrismaClient => {
  const { env } = getCloudflareContext();
  const hyperdrive = (env as { HYPERDRIVE?: { connectionString: string } })
    .HYPERDRIVE;
  return createClient(hyperdrive?.connectionString ?? process.env.DATABASE_URL);
});

const globalForPrisma = global as unknown as {
  prisma: PrismaClient | undefined;
};

function getNodeClient(): PrismaClient {
  globalForPrisma.prisma ??= createClient(process.env.DATABASE_URL);
  return globalForPrisma.prisma;
}

function getClient(): PrismaClient {
  return isCloudflareWorkers ? getWorkersClient() : getNodeClient();
}

const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const client = getClient();
    const value = Reflect.get(client, prop, client);
    return typeof value === "function" ? value.bind(client) : value;
  },
});

export default prisma;
