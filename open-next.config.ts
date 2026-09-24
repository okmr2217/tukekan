// OpenNext（Next.js → Cloudflare Workers のアダプタ）の設定。
// ツケカンはログイン必須の動的ページばかりで ISR / fetch キャッシュを使っていないため、
// インクリメンタルキャッシュ（R2 など）は設定せず既定のままにしている。
import { defineCloudflareConfig } from "@opennextjs/cloudflare";

export default defineCloudflareConfig({});
