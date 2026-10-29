/**
 * ヘルスチェック（外形監視用）。UptimeRobot などから 5 分ごとに GET / HEAD で叩く想定。
 *
 * 認証なしで公開する（/admin 以外は Cloudflare Access を通らない）ので、
 * 返すのは各チェックの ok / fail だけで、エラーメッセージやバージョンは含めない。
 *
 * チェック内容は 2 つ。
 * - db: D1 に届く（SELECT 1）。Worker と Next が応答していることは、このルートが返ること自体で分かる
 * - jwtSecret: JWT_SECRET が設定されている（値は見ない）。src/lib/auth.ts は未設定だと
 *   開発用の既定値で署名してしまうので、本番でシークレットが抜けたらここで検知する
 *
 * 全部 ok なら 200、ひとつでも fail なら 503。週次利子ジョブの動作確認は対象外
 * （止まっても画面は使えるので、docs/11-cloudflare-workers.md 11.5 の管理画面側で見る）。
 */

import { sql } from "drizzle-orm";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

/** D1 が固まっていても監視側のタイムアウトより先に 503 を返すための上限 */
const DB_TIMEOUT_MS = 3000;

type CheckResult = "ok" | "fail";

async function checkDb(): Promise<CheckResult> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    await Promise.race([
      db.run(sql`select 1`),
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error("timeout")), DB_TIMEOUT_MS);
      }),
    ]);
    return "ok";
  } catch (error) {
    // 詳細はレスポンスに出さず、Workers Logs にだけ残す
    console.error("health: db check failed", error);
    return "fail";
  } finally {
    clearTimeout(timer);
  }
}

function checkJwtSecret(): CheckResult {
  // ローカル開発では既定値で動かすので、本番ビルドのときだけ確認する
  if (process.env.NODE_ENV !== "production") return "ok";
  return process.env.JWT_SECRET ? "ok" : "fail";
}

async function handle(): Promise<Response> {
  const checks = {
    db: await checkDb(),
    jwtSecret: checkJwtSecret(),
  };
  const healthy = Object.values(checks).every((result) => result === "ok");

  return Response.json(
    { status: healthy ? "ok" : "error", checks },
    {
      status: healthy ? 200 : 503,
      headers: { "Cache-Control": "no-store" },
    },
  );
}

export const GET = handle;
export const HEAD = handle;
