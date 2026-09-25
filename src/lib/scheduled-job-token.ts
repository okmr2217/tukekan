/**
 * Cron Triggers（worker.ts の scheduled）から Next のルートハンドラを呼ぶときの合言葉。
 *
 * scheduled ハンドラは Next の外にあるので、ジョブ本体は Worker 内部から
 * `/api/cron/...` を fetch して動かす（Prisma やリクエストコンテキストを Next 側と共有するため）。
 * このルートは本番ドメインからも見えてしまうので、外から叩かれても動かないように、
 * scheduled が起動のたびに使い捨てのトークンを発行し、ルート側で照合する。
 *
 * worker.ts（wrangler がバンドル）と Next のサーバーコード（OpenNext がバンドル）は
 * 別々にバンドルされるためモジュールの状態は共有できないが、同じ isolate の中で動くので
 * globalThis は共有できる。トークンはそこに置き、ネットワークにも設定にも出さない。
 *
 * このファイルは worker.ts からも import するので、他のモジュールに依存させない。
 */

export const SCHEDULED_JOB_TOKEN_HEADER = "x-tukekan-scheduled-token";

const TOKENS_KEY = Symbol.for("tukekan.scheduledJobTokens");

function getTokens(): Set<string> {
  const store = globalThis as unknown as Record<
    symbol,
    Set<string> | undefined
  >;
  store[TOKENS_KEY] ??= new Set();
  return store[TOKENS_KEY];
}

/** 使い捨てのトークンを発行する。使い終わったら必ず revoke する */
export function issueScheduledJobToken(): {
  token: string;
  revoke: () => void;
} {
  const token = crypto.randomUUID();
  getTokens().add(token);
  return { token, revoke: () => getTokens().delete(token) };
}

/** scheduled が発行した、まだ有効なトークンかどうか */
export function isValidScheduledJobToken(token: string | null): boolean {
  return token !== null && getTokens().has(token);
}
