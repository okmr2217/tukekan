import { chromium } from 'playwright';
import { CONFIG } from './config';
import { login } from './utils/auth';
import { runPcScenarios, runMobileScenarios, runLoginScenarios } from './scenarios/index';

async function main() {
  const browser = await chromium.launch({ headless: true });

  // PC context (authenticated)
  const pcContext = await browser.newContext({
    viewport: CONFIG.VIEWPORTS.pc,
    deviceScaleFactor: CONFIG.DEVICE_SCALE_FACTOR,
  });
  const pcPage = await pcContext.newPage();
  await login(pcPage);
  await runPcScenarios(pcPage);
  await pcContext.close();

  // Mobile context (authenticated)
  const mobileContext = await browser.newContext({
    viewport: CONFIG.VIEWPORTS.mobile,
    deviceScaleFactor: CONFIG.DEVICE_SCALE_FACTOR,
  });
  const mobilePage = await mobileContext.newPage();
  await login(mobilePage);
  await runMobileScenarios(mobilePage);
  await mobileContext.close();

  // Unauthenticated PC context for login screenshot
  const loginPcContext = await browser.newContext({
    viewport: CONFIG.VIEWPORTS.pc,
    deviceScaleFactor: CONFIG.DEVICE_SCALE_FACTOR,
  });
  const loginPcPage = await loginPcContext.newPage();
  await runLoginScenarios(loginPcPage, 'pc');
  await loginPcContext.close();

  // Unauthenticated mobile context for login screenshot
  const loginMobileContext = await browser.newContext({
    viewport: CONFIG.VIEWPORTS.mobile,
    deviceScaleFactor: CONFIG.DEVICE_SCALE_FACTOR,
  });
  const loginMobilePage = await loginMobileContext.newPage();
  await runLoginScenarios(loginMobilePage, 'mobile');
  await loginMobileContext.close();

  await browser.close();
  console.log('Done! Screenshots saved to', CONFIG.OUTPUT_DIR);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
