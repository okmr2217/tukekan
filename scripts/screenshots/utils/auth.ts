import { Page } from 'playwright';
import { CONFIG } from '../config';

export async function login(page: Page): Promise<void> {
  await page.goto(`${CONFIG.BASE_URL}/login`);
  await page.waitForLoadState('networkidle');

  // shadcn/ui Select interaction - select first option (user1)
  await page.click('[role="combobox"]');
  await page.waitForSelector('[role="option"]', { state: 'visible' });
  // Select the option containing user1
  const userOption = page.locator(`[role="option"]:has-text("${CONFIG.AUTH.userText}")`).first();
  await userOption.click();

  await page.fill('input[type="password"]', CONFIG.AUTH.password);
  await page.click('button[type="submit"]');
  await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 15000 });
  await page.waitForLoadState('networkidle');
}
