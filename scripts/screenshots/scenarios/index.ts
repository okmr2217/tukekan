import { Page } from 'playwright';
import { capture } from '../utils/capture';
import { CONFIG } from '../config';

const BASE_URL = CONFIG.BASE_URL;

export async function runPcScenarios(page: Page): Promise<void> {
  // home-expenses-pc
  try {
    await page.goto(`${BASE_URL}/`);
    await page.waitForLoadState('networkidle');
    await capture(page, 'home-expenses-pc', 'pc');
  } catch (e) {
    console.error('❌ home-expenses-pc failed:', e);
  }

  // transaction-modal-pc
  try {
    await page.goto(`${BASE_URL}/`);
    await page.waitForLoadState('networkidle');
    const fabBtn = page.locator('button:has-text("+"), button[aria-label*="追加"], button[aria-label*="add"], button.fab').first();
    await fabBtn.click({ timeout: 5000 });
    await page.waitForTimeout(300);
    await capture(page, 'transaction-modal-pc', 'pc');
    await page.keyboard.press('Escape');
    await page.waitForTimeout(200);
  } catch (e) {
    console.error('❌ transaction-modal-pc failed:', e);
  }

  // from-members-detail (PC)
  try {
    await page.goto(`${BASE_URL}/from-members`);
    await page.waitForLoadState('networkidle');
    const firstMember = page.locator('a, li button, [data-member]').first();
    await firstMember.click({ timeout: 5000 });
    await page.waitForTimeout(300);
    await capture(page, 'from-members-detail', 'pc');
    await page.keyboard.press('Escape');
    await page.waitForTimeout(200);
  } catch (e) {
    console.error('❌ from-members-detail failed:', e);
  }

  // group-settings (PC)
  try {
    await page.goto(`${BASE_URL}/group`);
    await page.waitForLoadState('networkidle');
    await capture(page, 'group-settings', 'pc');
  } catch (e) {
    console.error('❌ group-settings failed:', e);
  }

  // members-list (PC)
  try {
    await page.goto(`${BASE_URL}/group/members`);
    await page.waitForLoadState('networkidle');
    await capture(page, 'members-list-pc', 'pc');
  } catch (e) {
    console.error('❌ members-list-pc failed:', e);
  }

  // member-delete-dialog (PC)
  try {
    await page.goto(`${BASE_URL}/group/members`);
    await page.waitForLoadState('networkidle');
    const deleteBtn = page.locator('button:has-text("削除"), button[aria-label*="削除"]').first();
    await deleteBtn.click({ timeout: 5000 });
    await page.waitForTimeout(300);
    await capture(page, 'member-delete-dialog-pc', 'pc');
    await page.keyboard.press('Escape');
    await page.waitForTimeout(200);
  } catch (e) {
    console.error('❌ member-delete-dialog-pc failed:', e);
  }

  // invite-link-page (PC)
  try {
    await page.goto(`${BASE_URL}/invite/demo-invite-code`);
    await page.waitForLoadState('networkidle');
    await capture(page, 'invite-link-page-pc', 'pc');
  } catch (e) {
    console.error('❌ invite-link-page-pc failed:', e);
  }

  // account-settings (PC)
  try {
    await page.goto(`${BASE_URL}/account`);
    await page.waitForLoadState('networkidle');
    await capture(page, 'account-settings', 'pc');
  } catch (e) {
    console.error('❌ account-settings failed:', e);
  }
}

export async function runMobileScenarios(page: Page): Promise<void> {
  // home-expenses-mobile
  try {
    await page.goto(`${BASE_URL}/`);
    await page.waitForLoadState('networkidle');
    await capture(page, 'home-expenses-mobile', 'mobile');
  } catch (e) {
    console.error('❌ home-expenses-mobile failed:', e);
  }

  // transaction-modal-mobile
  try {
    await page.goto(`${BASE_URL}/`);
    await page.waitForLoadState('networkidle');
    const fabBtn = page.locator('button:has-text("+"), button[aria-label*="追加"], button[aria-label*="add"], button.fab').first();
    await fabBtn.click({ timeout: 5000 });
    await page.waitForTimeout(400);
    await capture(page, 'transaction-modal-mobile', 'mobile');
    await page.keyboard.press('Escape');
    await page.waitForTimeout(200);
  } catch (e) {
    console.error('❌ transaction-modal-mobile failed:', e);
  }

  // from-members-mobile
  try {
    await page.goto(`${BASE_URL}/from-members`);
    await page.waitForLoadState('networkidle');
    await capture(page, 'from-members-mobile', 'mobile');
  } catch (e) {
    console.error('❌ from-members-mobile failed:', e);
  }

  // members-list (mobile)
  try {
    await page.goto(`${BASE_URL}/group/members`);
    await page.waitForLoadState('networkidle');
    await capture(page, 'members-list-mobile', 'mobile');
  } catch (e) {
    console.error('❌ members-list-mobile failed:', e);
  }

  // member-delete-dialog (mobile)
  try {
    await page.goto(`${BASE_URL}/group/members`);
    await page.waitForLoadState('networkidle');
    const deleteBtn = page.locator('button:has-text("削除"), button[aria-label*="削除"]').first();
    await deleteBtn.click({ timeout: 5000 });
    await page.waitForTimeout(400);
    await capture(page, 'member-delete-dialog-mobile', 'mobile');
    await page.keyboard.press('Escape');
    await page.waitForTimeout(200);
  } catch (e) {
    console.error('❌ member-delete-dialog-mobile failed:', e);
  }

  // invite-link-page (mobile)
  try {
    await page.goto(`${BASE_URL}/invite/demo-invite-code`);
    await page.waitForLoadState('networkidle');
    await capture(page, 'invite-link-page-mobile', 'mobile');
  } catch (e) {
    console.error('❌ invite-link-page-mobile failed:', e);
  }
}

export async function runLoginScenarios(page: Page, device: 'pc' | 'mobile'): Promise<void> {
  try {
    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('networkidle');
    await capture(page, `login-${device}`, device);
  } catch (e) {
    console.error(`❌ login-${device} failed:`, e);
  }
}
