/**
 * Cloudflare Access（Zero Trust）による管理画面の認証。
 *
 * 管理画面（/admin）はアプリ本体のログイン（JWT + Cookie）とは別に、
 * Cloudflare Access で保護する。Access を通ったリクエストには
 * Cloudflare が署名した JWT が付くので、それを検証して管理者を特定する。
 *
 *   - ヘッダー: Cf-Access-Jwt-Assertion
 *   - Cookie:   CF_Authorization（ブラウザからの直アクセス時）
 *
 * 検証は「Access のチーム用 JWKS で署名を確認し、iss と aud を突き合わせる」だけ。
 * ここを通らないリクエストは Cloudflare を経由していない（＝オリジンを直接叩いている）
 * ことになるので、必ず拒否する。
 *
 * このファイルは Edge ランタイム（middleware）からも読むため、
 * next/headers や prisma など Node 依存のものを import しないこと。
 */

import { createRemoteJWKSet, jwtVerify } from "jose";

/** Cloudflare Access が付けるリクエストヘッダー名 */
export const CF_ACCESS_JWT_HEADER = "cf-access-jwt-assertion";

/** Cloudflare Access が発行する Cookie 名 */
export const CF_ACCESS_COOKIE = "CF_Authorization";

/** 管理画面にアクセスできなかった理由 */
export type AdminDenialReason =
  | "not_configured" // 環境変数が未設定（＝管理画面を有効にしていない）
  | "no_token" // Access の JWT が付いていない（Cloudflare を経由していない）
  | "invalid_token" // 署名・iss・aud・有効期限のいずれかが不正
  | "not_allowed"; // 認証は通ったが ADMIN_EMAILS の許可リストにいない

export const ADMIN_DENIAL_MESSAGES: Record<AdminDenialReason, string> = {
  not_configured:
    "管理画面が有効になっていません。CF_ACCESS_TEAM_DOMAIN と CF_ACCESS_AUD を設定してください。",
  no_token:
    "Cloudflare Access の認証情報がありません。管理画面には Cloudflare Access 経由でアクセスしてください。",
  invalid_token:
    "Cloudflare Access の認証情報を検証できませんでした。もう一度サインインし直してください。",
  not_allowed: "このアカウントには管理画面の権限がありません。",
};

export type CfAccessConfig = {
  /** 例: https://example.cloudflareaccess.com */
  issuer: string;
  /** 例: https://example.cloudflareaccess.com/cdn-cgi/access/certs */
  jwksUrl: string;
  /** Access アプリケーションの Audience (AUD) タグ。複数可 */
  audience: string[];
};

export type CfAccessIdentity = {
  /** Access が認証したメールアドレス */
  email: string;
  /** Access のユーザー識別子 */
  subject: string;
  /** この認証情報の有効期限 */
  expiresAt: Date | null;
};

/**
 * "example" / "example.cloudflareaccess.com" / "https://example.cloudflareaccess.com/"
 * のいずれで渡されても "https://example.cloudflareaccess.com" に揃える。
 */
function normalizeTeamDomain(raw: string): string {
  const trimmed = raw.trim().replace(/^https?:\/\//, "").replace(/\/+$/, "");
  if (!trimmed) return "";
  const host = trimmed.includes(".")
    ? trimmed
    : `${trimmed}.cloudflareaccess.com`;
  return `https://${host}`;
}

/** カンマ・空白区切りの環境変数を配列にする */
function parseList(raw: string | undefined): string[] {
  if (!raw) return [];
  return raw
    .split(/[,\s]+/)
    .map((v) => v.trim())
    .filter(Boolean);
}

/**
 * 環境変数から Access の検証設定を読む。
 * どちらか欠けていたら null（＝管理画面は無効）を返す。
 */
export function getCfAccessConfig(): CfAccessConfig | null {
  const issuer = normalizeTeamDomain(process.env.CF_ACCESS_TEAM_DOMAIN ?? "");
  const audience = parseList(process.env.CF_ACCESS_AUD);
  if (!issuer || audience.length === 0) return null;

  return { issuer, jwksUrl: `${issuer}/cdn-cgi/access/certs`, audience };
}

// JWKS はライブラリ側でキャッシュ・自動更新されるので、URLごとに使い回す
const jwkSetCache = new Map<string, ReturnType<typeof createRemoteJWKSet>>();

function getJwkSet(jwksUrl: string) {
  const cached = jwkSetCache.get(jwksUrl);
  if (cached) return cached;

  const jwkSet = createRemoteJWKSet(new URL(jwksUrl));
  jwkSetCache.set(jwksUrl, jwkSet);
  return jwkSet;
}

/**
 * Access の JWT を検証して、認証されたメールアドレスを取り出す。
 * 検証に失敗した場合（署名・iss・aud・有効期限）は null を返す。
 */
export async function verifyCfAccessToken(
  token: string,
  config: CfAccessConfig,
): Promise<CfAccessIdentity | null> {
  try {
    const { payload } = await jwtVerify(token, getJwkSet(config.jwksUrl), {
      issuer: config.issuer,
      audience: config.audience,
    });

    const email = typeof payload.email === "string" ? payload.email : "";
    if (!email) return null;

    return {
      email: email.toLowerCase(),
      subject: typeof payload.sub === "string" ? payload.sub : "",
      expiresAt: payload.exp ? new Date(payload.exp * 1000) : null,
    };
  } catch {
    return null;
  }
}

/**
 * ADMIN_EMAILS の許可リスト。
 * 未設定なら空配列＝「Access のポリシーを通った人は全員管理者」とみなす。
 */
export function getAdminEmailAllowlist(): string[] {
  return parseList(process.env.ADMIN_EMAILS).map((email) => email.toLowerCase());
}

export function isAllowedAdminEmail(email: string): boolean {
  const allowlist = getAdminEmailAllowlist();
  if (allowlist.length === 0) return true;
  return allowlist.includes(email.toLowerCase());
}

/**
 * ローカル開発用の抜け道。本番では絶対に効かないようにしている。
 * ADMIN_DEV_EMAIL を設定したときだけ、その人として管理画面に入れる。
 */
export function getDevAdminEmail(): string | null {
  if (process.env.NODE_ENV === "production") return null;
  const email = process.env.ADMIN_DEV_EMAIL?.trim();
  return email ? email.toLowerCase() : null;
}

export type CfAccessCheck =
  | { ok: true; identity: CfAccessIdentity; via: "cloudflare-access" }
  | { ok: true; identity: CfAccessIdentity; via: "dev-bypass" }
  | { ok: false; reason: AdminDenialReason };

/**
 * トークン文字列（ヘッダーまたはCookieから取り出したもの）を検証する。
 * middleware とサーバー側の両方から同じ判定を使うための共通処理。
 */
export async function checkCfAccess(
  token: string | undefined,
): Promise<CfAccessCheck> {
  const config = getCfAccessConfig();

  if (!config) {
    const devEmail = getDevAdminEmail();
    if (!devEmail) return { ok: false, reason: "not_configured" };
    return {
      ok: true,
      via: "dev-bypass",
      identity: { email: devEmail, subject: "dev", expiresAt: null },
    };
  }

  if (!token) return { ok: false, reason: "no_token" };

  const identity = await verifyCfAccessToken(token, config);
  if (!identity) return { ok: false, reason: "invalid_token" };
  if (!isAllowedAdminEmail(identity.email)) {
    return { ok: false, reason: "not_allowed" };
  }

  return { ok: true, via: "cloudflare-access", identity };
}
