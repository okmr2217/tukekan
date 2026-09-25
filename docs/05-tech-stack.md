# 5. 技術スタック・ディレクトリ構成

## 5.1 技術スタック

| カテゴリ  | 技術                     | 選定理由                                   |
| --------- | ------------------------ | ------------------------------------------ |
| Framework | Next.js 16 (App Router)  | SSR/SSG対応、Server Components/Actions活用 |
| Language  | TypeScript               | 型安全性、開発効率                         |
| UI        | Tailwind CSS + shadcn/ui | 高速開発、一貫したデザイン                 |
| Database  | Cloudflare D1 (SQLite)   | Worker からバインディングで直接つながる。接続の管理が要らない（[11-cloudflare-workers.md](./11-cloudflare-workers.md)） |
| ORM       | Drizzle ORM              | 型安全なDB操作。Workers で軽く、D1 の batch をそのまま使える |
| Auth      | 自前実装（bcrypt + JWT） | シンプルな要件に適合、依存を減らす         |
| Hosting   | Cloudflare Workers（OpenNext） | Cloudflare Access と一体で運用できる（[11-cloudflare-workers.md](./11-cloudflare-workers.md)） |

---

## 5.2 ディレクトリ構成

Server Components と Server Actions のみで実装。API Routesは使用しない。
例外は Cron Triggers から Worker 内部で呼ぶ `src/app/api/cron/`（外からは 404。[11-cloudflare-workers.md](./11-cloudflare-workers.md) の 11.5）。

```
src/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # 認証ルートグループ（未ログイン）
│   │   ├── login/
│   │   │   └── page.tsx
│   │   └── register/
│   │       └── page.tsx
│   ├── (main)/                   # メイン機能ルートグループ（ログイン必須）
│   │   ├── layout.tsx            # 共通レイアウト（ヘッダー、ボトムバー、FAB）
│   │   ├── page.tsx              # ホーム（残高 + 履歴タブ）
│   │   ├── partners/
│   │   │   └── [id]/
│   │   │       └── page.tsx      # 取引履歴
│   │   └── settings/
│   │       └── page.tsx          # 設定
│   ├── admin/                    # 管理画面（Cloudflare Access で認証・docs/10-admin.md）
│   │   ├── layout.tsx            # サイドバー構成のPC向けレイアウト
│   │   ├── page.tsx              # ダッシュボード
│   │   ├── accounts/
│   │   ├── ledgers/
│   │   ├── transactions/
│   │   ├── share-links/
│   │   ├── jobs/
│   │   └── audit/
│   └── layout.tsx                # ルートレイアウト
├── proxy.ts                      # /admin の入り口のゲート（Next.js 16 で middleware.ts から改称）
├── actions/                      # Server Actions
│   ├── auth.ts                   # ログイン、ログアウト、セッション取得
│   ├── transaction.ts            # 取引の作成
│   ├── partner.ts                # 相手の作成
│   └── admin/                    # 管理画面の読み書き（types / queries / mutations）
├── components/
│   ├── ui/                       # shadcn/ui コンポーネント
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── dialog.tsx
│   │   ├── combobox.tsx
│   │   └── ...
│   ├── features/                 # 機能別コンポーネント
│   │   ├── transaction/
│   │   │   ├── transaction-form.tsx      # 取引登録フォーム
│   │   │   ├── transaction-list.tsx      # 取引一覧
│   │   │   └── transaction-item.tsx      # 取引アイテム
│   │   └── partner/
│   │       ├── partner-select.tsx        # 相手選択コンボボックス
│   │       └── partner-balance-list.tsx  # 残高一覧
│   │   └── admin/                        # 管理画面のサイドバー・テーブル・操作ボタン
│   └── layouts/
│       ├── header.tsx
│       ├── bottom-bar.tsx                # ボトムバーナビゲーション
│       └── fab.tsx
├── lib/
│   ├── db.ts                     # DB クライアント（Drizzle + D1）
│   ├── auth.ts                   # JWT検証・生成、セッション管理
│   ├── password.ts               # bcryptハッシュ化
│   ├── cf-access.ts              # Cloudflare Access の JWT 検証（管理画面）
│   ├── admin-auth.ts             # requireAdmin() など管理画面の認可
│   ├── admin-audit.ts            # 管理画面の監査ログの操作種別
│   ├── interest-job.ts           # 週次利子ジョブの本体（cron と管理画面で共用）
│   └── utils.ts                  # 汎用ユーティリティ
├── db/
│   ├── schema.ts                 # DB スキーマ（Drizzle）
│   └── sql.ts                    # クエリ用の小さなヘルパー（部分一致検索など）
└── types/
    └── index.ts                  # 共通型定義

drizzle/                          # マイグレーション SQL（drizzle-kit が生成、wrangler が適用）
```

---

## 5.3 Server Actions の設計

全ての書き込み操作と認証操作は Server Actions で実装する。

### 認証関連 (`actions/auth.ts`)

```typescript
'use server'
import { cookies } from 'next/headers'

// ログイン
export async function login(formData: FormData) {
  const name = formData.get('name') as string
  const password = formData.get('password') as string

  // 認証処理...
  const token = generateJWT(...)

  cookies().set('token', token, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 90, // 90日
  })

  redirect('/')
}

// ログアウト
export async function logout() {
  cookies().delete('token')
  redirect('/login')
}

// セッション取得
export async function getSession() {
  const token = cookies().get('token')?.value
  if (!token) return null
  return verifyJWT(token)
}
```

### 取引関連 (`actions/transaction.ts`)

```typescript
"use server";

export async function createTransaction(formData: FormData) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  // 取引作成処理...
  revalidatePath("/");
}
```

---

## 5.4 データ取得の設計

読み取り操作は Server Components から `actions/` の関数を呼び、その中で `src/lib/db.ts` の `db`（Drizzle）を使う。
クエリの書き方は [03-data-design.md](./03-data-design.md) の 3.5 を参照。

```typescript
// actions/partner/queries.ts
import { and, asc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { partner } from "@/db/schema";

export async function getPartners() {
  const session = await getSession();
  if (!session) return [];

  return db.query.partner.findMany({
    where: and(eq(partner.ownerId, session.userId), eq(partner.isArchived, false)),
    columns: { id: true, name: true },
    orderBy: asc(partner.name),
  });
}
```

---

## 5.5 開発用のデータ

seed スクリプトはない。ローカルでは `npm run db:migrate:local` でテーブルを作ったあと、
`npm run dev` で起動して画面から登録する（`/register`）。まとまったデータが必要なときは
`npx wrangler d1 execute tukekan-db --local --command 'INSERT ...'` で直接入れる。
