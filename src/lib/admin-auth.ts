/**
 * 管理画面（/admin）のサーバー側の認可ヘルパー。
 *
 * 実際のゲートは3層ある:
 *   1. Cloudflare Access（アプリの外）
 *   2. src/middleware.ts（/admin 配下のリクエストを入り口で弾く）
 *   3. このファイルの requireAdmin()（各ページ・各Server Actionで再確認）
 *
 * middleware があっても、Server Action は必ず requireAdmin() を呼ぶこと。
 * 「認可はデータに触る直前で確認する」というアプリ本体の方針（getSession）と同じ。
 */

import { cookies, headers } from "next/headers";
import {
  ADMIN_DENIAL_MESSAGES,
  CF_ACCESS_COOKIE,
  CF_ACCESS_JWT_HEADER,
  checkCfAccess,
  type AdminDenialReason,
} from "@/lib/cf-access";

export type AdminIdentity = {
  email: string;
  /** cloudflare-access = 本番の経路 / dev-bypass = ローカル開発の抜け道 */
  via: "cloudflare-access" | "dev-bypass";
  expiresAt: Date | null;
};

export type AdminAccessResult =
  | { ok: true; identity: AdminIdentity }
  | { ok: false; reason: AdminDenialReason; message: string };

/** 管理画面にアクセスできなかったときに投げるエラー */
export class AdminAccessDeniedError extends Error {
  readonly reason: AdminDenialReason;

  constructor(reason: AdminDenialReason) {
    super(ADMIN_DENIAL_MESSAGES[reason]);
    this.name = "AdminAccessDeniedError";
    this.reason = reason;
  }
}

/** Access の JWT をヘッダー → Cookie の順に探す */
async function readAccessToken(): Promise<string | undefined> {
  const headerStore = await headers();
  const fromHeader = headerStore.get(CF_ACCESS_JWT_HEADER);
  if (fromHeader) return fromHeader;

  const cookieStore = await cookies();
  return cookieStore.get(CF_ACCESS_COOKIE)?.value;
}

/** 現在のリクエストの管理者を判定する（例外を投げない版） */
export async function resolveAdminIdentity(): Promise<AdminAccessResult> {
  const result = await checkCfAccess(await readAccessToken());

  if (!result.ok) {
    return {
      ok: false,
      reason: result.reason,
      message: ADMIN_DENIAL_MESSAGES[result.reason],
    };
  }

  return {
    ok: true,
    identity: {
      email: result.identity.email,
      via: result.via,
      expiresAt: result.identity.expiresAt,
    },
  };
}

/**
 * 管理者であることを要求する。管理画面のページとServer Actionの先頭で必ず呼ぶ。
 * 管理者でなければ AdminAccessDeniedError を投げる。
 */
export async function requireAdmin(): Promise<AdminIdentity> {
  const result = await resolveAdminIdentity();
  if (!result.ok) throw new AdminAccessDeniedError(result.reason);
  return result.identity;
}
