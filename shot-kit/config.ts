import type { ShotKitProjectConfig } from 'shot-kit';

const config: ShotKitProjectConfig = {
  projectName: process.env['SHOT_KIT_PROJECT_NAME'] ?? 'my-project',
  baseUrl: process.env['SHOT_KIT_BASE_URL'] ?? 'http://localhost:3000',

  // 出力先を変えたい場合:
  // outputDir: 'screenshots',

  // WSL2 / Docker 環境では以下が必要な場合があります:
  // launchOptions: { args: ['--no-sandbox'] },
};

export default config;
