/**
 * 管理画面（/admin）の入り口のゲート。
 *
 * Cloudflare Access を通っていないリクエスト（＝オリジンを直接叩いているもの）を
 * ページのレンダリングやServer Actionの実行より前に 403 で止める。
 * matcher を /admin 配下に限定しているので、アプリ本体の動作には影響しない。
 *
 * これは最初の防壁でしかなく、各ページ・各Server Actionでも requireAdmin() で
 * 再確認している（src/lib/admin-auth.ts）。
 *
 * Next.js 16 で middleware.ts は proxy.ts に改称された（動きは同じ）。
 */

import { NextResponse, type NextRequest } from "next/server";
import {
  ADMIN_DENIAL_MESSAGES,
  CF_ACCESS_COOKIE,
  CF_ACCESS_JWT_HEADER,
  checkCfAccess,
} from "@/lib/cf-access";

export const config = {
  matcher: ["/admin", "/admin/:path*"],
};

function forbidden(message: string): NextResponse {
  const body = `<!DOCTYPE html>
<html lang="ja">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>403 | ツケカン管理画面</title>
  </head>
  <body style="font-family: system-ui, sans-serif; margin: 0; display: grid; place-items: center; min-height: 100vh; background: #f8f8f7; color: #1c1c1b;">
    <main style="max-width: 32rem; padding: 2rem; text-align: center;">
      <h1 style="font-size: 1.25rem; margin: 0 0 0.75rem;">管理画面にアクセスできません</h1>
      <p style="font-size: 0.875rem; line-height: 1.7; margin: 0; color: #6b6b68;">${message}</p>
    </main>
  </body>
</html>`;

  return new NextResponse(body, {
    status: 403,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

export default async function proxy(request: NextRequest) {
  const token =
    request.headers.get(CF_ACCESS_JWT_HEADER) ??
    request.cookies.get(CF_ACCESS_COOKIE)?.value;

  const result = await checkCfAccess(token);
  if (!result.ok) return forbidden(ADMIN_DENIAL_MESSAGES[result.reason]);

  return NextResponse.next();
}
