import type { AuthHandler } from "shot-kit";

/**
 * 認証が必要なシナリオで一度だけ呼び出されます。
 * デバイスごとにセッションが共有されるため、シナリオ数が増えても認証は 1 回のみです。
 *
 * 認証不要なシナリオは scenarios/index.ts で requiresAuth: false を指定してください。
 * 認証が不要な場合はこのファイルを空のまま（何もしない実装）にしてください。
 *
 * 使用する認証情報は .env などで管理し、process.env 経由で読み込むことを推奨します。
 * 例: Email / Password 認証の場合
 *   process.env['APP_EMAIL']    — ログイン用メールアドレス
 *   process.env['APP_PASSWORD'] — ログイン用パスワード
 * 例: トークン認証の場合
 *   process.env['APP_AUTH_TOKEN'] — Bearer トークンなど
 */
const authHandler: AuthHandler = async (page, config) => {
  // --- Email / Password 認証の例 ---
  await page.goto(`${config.baseUrl}/login`);
  await page.fill('[name="email"]', process.env["SEED_DEMO_EMAIL"] ?? "");
  await page.fill('[name="password"]', process.env["SEED_DEMO_PASSWORD"] ?? "");
  await page.click('[type="submit"]');
  await page.waitForURL(`${config.baseUrl}`);

  // --- Cookie / LocalStorage にトークンをセットする例 ---
  // await page.goto(config.baseUrl);
  // await page.evaluate((token) => {
  //   localStorage.setItem('auth_token', token);
  // }, process.env['APP_AUTH_TOKEN'] ?? '');
  // await page.reload();
};

export default authHandler;
