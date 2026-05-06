import type { Scenario } from "shot-kit";

const scenarios: Scenario[] = [
  {
    name: "相手",
    path: "/",
    device: "mobile",
  },
  {
    name: "取引履歴と残高 はると",
    path: "/partners/cmou1m80j0004wp8qffywyw5r",
    device: "mobile",
  },
  {
    name: "すべての取引",
    path: "/transactions",
    device: "mobile",
  },
  {
    name: "統計 相手タブ",
    path: "/statistics",
    device: "mobile",
  },
  {
    name: "統計 全体タブ",
    path: "/statistics",
    device: "mobile",
    action: async (page) => {
      await page
        .locator('button[role="tab"]:has-text("全体")')
        .click({ timeout: 5000 });
      await page.waitForTimeout(300);
    },
  },
  {
    name: "相手の管理",
    path: "/partners",
    device: "mobile",
  },
  {
    name: "設定",
    path: "/settings",
    device: "mobile",
  },
  {
    name: "ヘルプ",
    path: "/help",
    device: "mobile",
  },
  {
    name: "共有ページ",
    path: "/share/tbt9cba7m7h0ilg9r22px788",
    device: "mobile",
  },
  {
    name: "取引追加モーダル",
    path: "/transactions",
    device: "mobile",
    action: async (page) => {
      await page.locator("#transaction-fab").click({ timeout: 5000 });
      await page.waitForSelector('[role="dialog"]');
    },
  },
  {
    name: "すべての取引 検索条件モーダル",
    path: "/transactions",
    device: "mobile",
    action: async (page) => {
      await page
        .locator('[aria-label="検索・絞り込み"]')
        .click({ timeout: 5000 });
      await page.waitForSelector('[role="dialog"]');
    },
  },
];

export default scenarios;
