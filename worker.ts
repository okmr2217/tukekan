/**
 * Cloudflare Workers のエントリ（wrangler.jsonc の main）。
 *
 * OpenNext が生成する .open-next/worker.js（Next.js 本体）をそのまま fetch に使い、
 * Cron Triggers 用の scheduled を足している。詳細は docs/11-cloudflare-workers.md。
 *
 * scheduled からは Worker 内部で Next のルートハンドラ（/api/cron/...）を呼ぶ。
 * ジョブ本体をここに直接書かないのは、Prisma（WASM）を Next 側と二重にバンドルせず、
 * src/lib/prisma.ts のリクエストごとのクライアントをそのまま使うため。
 */

// `opennextjs-cloudflare build` が生成し、wrangler のバンドル時に解決される。
// ビルド前は存在せず、ビルド後は型のない JS なので型チェックから外す
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { default as nextHandler } from "./.open-next/worker.js";
import {
  SCHEDULED_JOB_TOKEN_HEADER,
  issueScheduledJobToken,
} from "./src/lib/scheduled-job-token";

// OpenNext の Durable Objects（未使用だが、生成物と同じく export しておく）
// prettier-ignore
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
export { DOQueueHandler, DOShardedTagCache, BucketCachePurge } from "./.open-next/worker.js";

type Env = Record<string, unknown>;

type ScheduledController = {
  readonly cron: string;
  readonly scheduledTime: number;
};

type ExecutionContext = {
  waitUntil(promise: Promise<unknown>): void;
  passThroughOnException(): void;
};

/** cron 式 → 叩くルート。cron 式は wrangler.jsonc の triggers.crons と一致させる */
const SCHEDULED_ROUTES: Record<string, string> = {
  // 毎日 00:00 JST（15:00 UTC）: 週次自動利子ジョブ
  "0 15 * * *": "/api/cron/weekly-interest",
};

const worker = {
  fetch: nextHandler.fetch,

  async scheduled(
    controller: ScheduledController,
    env: Env,
    ctx: ExecutionContext,
  ): Promise<void> {
    const path = SCHEDULED_ROUTES[controller.cron];
    if (!path) {
      throw new Error(`Unknown cron trigger: ${controller.cron}`);
    }

    const { token, revoke } = issueScheduledJobToken();
    try {
      // ホスト名は何でもよい（Worker の外には出ない）
      const request = new Request(`https://tukekan.internal${path}`, {
        method: "POST",
        headers: { [SCHEDULED_JOB_TOKEN_HEADER]: token },
      });
      const response: Response = await nextHandler.fetch(request, env, ctx);
      const body = await response.text();

      // 失敗を例外にすると、ダッシュボードの Cron イベントに「失敗」として残る
      if (!response.ok) {
        throw new Error(`${path} failed (${response.status}): ${body}`);
      }
      console.log(`${path} completed: ${body}`);
    } finally {
      revoke();
    }
  },
};

export default worker;
