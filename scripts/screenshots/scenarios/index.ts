import { Page } from "playwright";
import { capture } from "../utils/capture";
import { CONFIG } from "../config";

const BASE_URL = CONFIG.BASE_URL;

/**
 * スクリーンショットシナリオ一覧
 *
 * PC (runPcScenarios)
 *   home-transactions-pc       / ホーム（取引一覧）
 *   transaction-modal-pc       / FAB → 取引追加モーダル
 *   partners-pc                /partners 相手一覧
 *   partner-menu-pc            /partners 相手カードのドロップダウンメニュー
 *   add-partner-dialog-pc      /partners 相手追加ダイアログ
 *   stats-partners-pc          /stats 統計（相手タブ・デフォルト）
 *   stats-overall-pc           /stats 統計（全体タブ）
 *   settings-pc                /settings 設定
 *   share-page-pc              /share/demo-token 共有ページ
 *
 * Mobile (runMobileScenarios)
 *   home-transactions-mobile   / ホーム（取引一覧）
 *   transaction-modal-mobile   / FAB → 取引追加モーダル
 *   partners-mobile            /partners 相手一覧
 *   stats-mobile               /stats 統計（相手タブ・デフォルト）
 *   settings-mobile            /settings 設定
 *   share-page-mobile          /share/demo-token 共有ページ
 *
 * Login (runLoginScenarios)
 *   login-pc                   /login ログイン（未認証・PC）
 *   login-mobile               /login ログイン（未認証・モバイル）
 */

export async function runPcScenarios(page: Page): Promise<void> {
  // home-transactions-pc
  try {
    await page.goto(`${BASE_URL}/`);
    await page.waitForLoadState("networkidle");
    await capture(page, "home-transactions-pc", "pc");
  } catch (e) {
    console.error("❌ home-transactions-pc failed:", e);
  }

  // transaction-modal-pc
  try {
    await page.goto(`${BASE_URL}/`);
    await page.waitForLoadState("networkidle");
    const fabBtn = page.locator("button.rounded-full").first();
    await fabBtn.click({ timeout: 5000 });
    await page.waitForTimeout(300);
    await capture(page, "transaction-modal-pc", "pc");
    await page.keyboard.press("Escape");
    await page.waitForTimeout(200);
  } catch (e) {
    console.error("❌ transaction-modal-pc failed:", e);
  }

  // partners-pc
  try {
    await page.goto(`${BASE_URL}/partners`);
    await page.waitForLoadState("networkidle");
    await capture(page, "partners-pc", "pc");
  } catch (e) {
    console.error("❌ partners-pc failed:", e);
  }

  // partner-menu-pc (ドロップダウンメニューを開いた状態)
  try {
    await page.goto(`${BASE_URL}/partners`);
    await page.waitForLoadState("networkidle");
    const menuBtn = page.locator('button[class*="size-8"]').first();
    await menuBtn.click({ timeout: 5000 });
    await page.waitForTimeout(300);
    await capture(page, "partner-menu-pc", "pc");
    await page.keyboard.press("Escape");
    await page.waitForTimeout(200);
  } catch (e) {
    console.error("❌ partner-menu-pc failed:", e);
  }

  // add-partner-dialog-pc
  try {
    await page.goto(`${BASE_URL}/partners`);
    await page.waitForLoadState("networkidle");
    const addBtn = page.locator('button:has-text("追加")').first();
    await addBtn.click({ timeout: 5000 });
    await page.waitForTimeout(300);
    await capture(page, "add-partner-dialog-pc", "pc");
    await page.keyboard.press("Escape");
    await page.waitForTimeout(200);
  } catch (e) {
    console.error("❌ add-partner-dialog-pc failed:", e);
  }

  // stats-partners-pc (相手タブ - デフォルト)
  try {
    await page.goto(`${BASE_URL}/stats`);
    await page.waitForLoadState("networkidle");
    await capture(page, "stats-partners-pc", "pc");
  } catch (e) {
    console.error("❌ stats-partners-pc failed:", e);
  }

  // stats-overall-pc (全体タブ)
  try {
    await page.goto(`${BASE_URL}/stats`);
    await page.waitForLoadState("networkidle");
    const overallTab = page.locator('button[role="tab"]:has-text("全体")');
    await overallTab.click({ timeout: 5000 });
    await page.waitForTimeout(300);
    await capture(page, "stats-overall-pc", "pc");
  } catch (e) {
    console.error("❌ stats-overall-pc failed:", e);
  }

  // settings-pc
  try {
    await page.goto(`${BASE_URL}/settings`);
    await page.waitForLoadState("networkidle");
    await capture(page, "settings-pc", "pc");
  } catch (e) {
    console.error("❌ settings-pc failed:", e);
  }

  // share-page-pc
  try {
    await page.goto(`${BASE_URL}/share/demo-token`);
    await page.waitForLoadState("networkidle");
    await capture(page, "share-page-pc", "pc");
  } catch (e) {
    console.error("❌ share-page-pc failed:", e);
  }
}

export async function runMobileScenarios(page: Page): Promise<void> {
  // home-transactions-mobile
  try {
    await page.goto(`${BASE_URL}/`);
    await page.waitForLoadState("networkidle");
    await capture(page, "home-transactions-mobile", "mobile");
  } catch (e) {
    console.error("❌ home-transactions-mobile failed:", e);
  }

  // transaction-modal-mobile
  try {
    await page.goto(`${BASE_URL}/`);
    await page.waitForLoadState("networkidle");
    const fabBtn = page.locator("button.rounded-full").first();
    await fabBtn.click({ timeout: 5000 });
    await page.waitForTimeout(400);
    await capture(page, "transaction-modal-mobile", "mobile");
    await page.keyboard.press("Escape");
    await page.waitForTimeout(200);
  } catch (e) {
    console.error("❌ transaction-modal-mobile failed:", e);
  }

  // partners-mobile
  try {
    await page.goto(`${BASE_URL}/partners`);
    await page.waitForLoadState("networkidle");
    await capture(page, "partners-mobile", "mobile");
  } catch (e) {
    console.error("❌ partners-mobile failed:", e);
  }

  // stats-mobile
  try {
    await page.goto(`${BASE_URL}/stats`);
    await page.waitForLoadState("networkidle");
    await capture(page, "stats-mobile", "mobile");
  } catch (e) {
    console.error("❌ stats-mobile failed:", e);
  }

  // settings-mobile
  try {
    await page.goto(`${BASE_URL}/settings`);
    await page.waitForLoadState("networkidle");
    await capture(page, "settings-mobile", "mobile");
  } catch (e) {
    console.error("❌ settings-mobile failed:", e);
  }

  // share-page-mobile
  try {
    await page.goto(`${BASE_URL}/share/demo-token`);
    await page.waitForLoadState("networkidle");
    await capture(page, "share-page-mobile", "mobile");
  } catch (e) {
    console.error("❌ share-page-mobile failed:", e);
  }
}

export async function runLoginScenarios(
  page: Page,
  device: "pc" | "mobile",
): Promise<void> {
  try {
    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState("networkidle");
    await capture(page, `login-${device}`, device);
  } catch (e) {
    console.error(`❌ login-${device} failed:`, e);
  }
}
