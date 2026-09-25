# 11. ホスティング（Cloudflare Workers）

ツケカンは Vercel から **Cloudflare Workers** に移行した。Next.js は
[OpenNext（`@opennextjs/cloudflare`）](https://opennext.js.org/cloudflare) で Worker に変換してデプロイする。
DB は引き続き **Supabase（PostgreSQL）** を使う（D1 への移行は別フェーズ）。

---

## 11.1 構成

```
ブラウザ ──> Cloudflare（カスタムドメイン / Access）──> Worker「tukekan」
                                                         ├─ 静的ファイル: Workers Static Assets（.open-next/assets）
                                                         └─ SSR / Server Actions / proxy.ts
                                                               └─ pg（TCP・pg-cloudflare）──> Supabase
                                                                  （任意で Hyperdrive 経由）
```

| ファイル | 役割 |
| --- | --- |
| `wrangler.jsonc` | Worker の設定（名前・互換性フラグ・静的アセット・バインディング） |
| `open-next.config.ts` | OpenNext の設定。ISR 等を使っていないのでキャッシュは既定のまま |
| `next.config.ts` | Workers 向けのトレース設定（`pg-cloudflare` と Prisma の edge 版を含める）・`serverExternalPackages` |
| `src/lib/prisma.ts` | Workers ではリクエストごとに Prisma クライアントを作る（下記） |

### Prisma まわりの約束

- 生成先は `node_modules/.prisma/client`（既定の場所）で、import は **`@prisma/client`** から行う。
  Workers ではパッケージの `workerd` 条件で edge 版に解決され、WASM が事前コンパイル済みモジュールとして読まれる。
  `src/generated/...` のような独自の出力先に戻すと、Workers 上で
  `WebAssembly.Module(): Wasm code generation disallowed by embedder` になって DB に触れなくなる
- Workers ではリクエストをまたいでソケットを使い回せないため、`src/lib/prisma.ts` は
  Workers 上では React の `cache()` で「1リクエストに1クライアント」を作る。
  呼び出し側は今までどおり `import prisma from "@/lib/prisma"` でよい
- `scripts/` や `prisma/` のスクリプト（Node.js / tsx で動く）は自前で `PrismaClient` を作っており、影響を受けない

---

## 11.2 環境変数・シークレット

Worker の「設定 → 変数とシークレット」、または `npx wrangler secret put <名前>` で設定する。
`wrangler.jsonc` には書かない。

| 名前 | 必須 | 内容 |
| --- | --- | --- |
| `DATABASE_URL` | ○ | Supabase の接続文字列。**Supavisor の Transaction モード（ポート 6543）** を推奨（Workers はリクエストごとに接続を張るため） |
| `JWT_SECRET` | ○ | セッション JWT の署名鍵（Vercel で使っていたものと同じ値にすればログイン状態を引き継げる） |
| `CF_ACCESS_TEAM_DOMAIN` / `CF_ACCESS_AUD` | ○ | 管理画面の Access 検証（[10-admin.md](./10-admin.md)） |
| `ADMIN_EMAILS` | | 管理者の許可リスト（任意） |

ローカルで Worker として動かすときは、リポジトリ直下に `.dev.vars`（git 管理外）を作って同じ名前で書く。

### Hyperdrive（任意）

Supabase へ毎回新しく TCP 接続を張るより速くしたい場合は Hyperdrive を使う。

1. `npx wrangler hyperdrive create tukekan-db --connection-string="<Supabase の Session モード/直接接続の URL>"`
2. 返ってきた ID を `wrangler.jsonc` の `hyperdrive` に `{"binding": "HYPERDRIVE", "id": "..."}` で追加
3. `src/lib/prisma.ts` はバインディングがあれば自動でそちらを優先する（コード変更は不要）

---

## 11.3 コマンド

| コマンド | 内容 |
| --- | --- |
| `npm run dev` | 従来どおり `next dev`（Node.js）で開発 |
| `npm run preview` | OpenNext でビルドし、ローカルの workerd（本番と同じランタイム）で動かす。`.dev.vars` を読む |
| `npm run deploy` | 手元からビルドして Cloudflare にデプロイ（`wrangler login` 済みか `CLOUDFLARE_API_TOKEN` が必要）。通常は GitHub Actions に任せる |
| `npm run cf-typegen` | `wrangler.jsonc` のバインディングから `CloudflareEnv` の型を生成 |

ビルド時も `postinstall` の `prisma generate` が `DATABASE_URL` を要求する（値はダミーでもよい）。

---

## 11.4 デプロイ方法（GitHub Actions）

`main` への push で [`.github/workflows/deploy.yml`](../.github/workflows/deploy.yml) が走り、
`opennextjs-cloudflare build` → `opennextjs-cloudflare deploy` で本番の Worker「tukekan」を更新する。
Actions タブから手動実行（`workflow_dispatch`）もできる。

- 必要な Repository secrets: `CLOUDFLARE_ACCOUNT_ID` / `CLOUDFLARE_API_TOKEN`
  （トークンには「Workers Scripts: 編集」相当の権限が要る）
- ビルド時の `DATABASE_URL` はワークフロー内のダミー値（`prisma generate` が要求するだけで、DB にはつながない）
- Worker の実行時シークレット（11.2）は Cloudflare 側に保存されており、デプロイしても消えない。
  変更するときは `npx wrangler secret put <名前>` かダッシュボードで行う
- デプロイ先: `https://tukekan.okumuradaichi2007.workers.dev`（カスタムドメインを付けるまで）

---

## 11.5 切り替え手順（Vercel → Workers）

1. Workers にデプロイし（済）、`*.workers.dev` の URL でログイン・取引登録・共有リンク・`/admin` の 403 を確認する
2. Worker の「設定 → ドメインとルート」で本番ドメインをカスタムドメインとして追加する
   （DNS の向き先が Vercel から Worker に切り替わる）
3. Cloudflare Access の管理画面アプリ（`<本番ドメイン>/admin`）がそのまま効いていることを確認する
4. 問題がなければ `wrangler.jsonc` に `"workers_dev": false` と `"preview_urls": false` を足して、
   Access を通らない `*.workers.dev` からの入り口を閉じる（[10-admin.md](./10-admin.md) の「オリジンへの直接アクセス」の注意に相当）
5. しばらく並行稼働させてから Vercel のプロジェクトを削除する

利子ジョブ（`weekly-interest.yml`）と Supabase の ping（`keep-supabase-alive.yml`）は
DB に直接つなぐ GitHub Actions なので、ホスティングの移行とは無関係にそのまま動く。

---

## 11.6 今後の候補

- 利子ジョブを GitHub Actions から Worker の **Cron Triggers** に移す（カスタム Worker エントリで `scheduled` を足す）
- DB を Supabase から **D1** に移す（`Decimal` の持ち替え、`mode: "insensitive"` の書き換え、トランザクションの扱いの確認が必要）
