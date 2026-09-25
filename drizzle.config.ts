// drizzle-kit の設定。スキーマ（src/db/schema.ts）からマイグレーション SQL を drizzle/ に生成する。
// 適用は wrangler が行う（npm run db:migrate:local / db:migrate:remote）。詳細は docs/11-cloudflare-workers.md
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "sqlite",
  schema: "./src/db/schema.ts",
  out: "./drizzle",
});
