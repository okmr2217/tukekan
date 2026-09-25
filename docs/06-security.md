# 6. セキュリティ・非機能要件

## 6.1 認証・認可

### パスワード管理

- bcryptでハッシュ化（cost factor: 12）
- パスワード要件: 8文字以上

### セッション管理

- JWTトークンをHTTP-Only Cookieに保存
- トークン有効期限: 90日間
- リフレッシュトークンは実装しない（シンプルさ優先）

### アクセス制御

```typescript
// Server Actions/Server Componentsで認証チェック
// 読み書きともに自分のデータのみ許可

// 例: Server Action での認証チェック
export async function createTransaction(formData: FormData) {
  const session = await getSession();
  if (!session) {
    throw new Error("Unauthorized");
  }

  // ownerId は必ず session.userId を使用
  await prisma.transaction.create({
    data: {
      ...data,
      ownerId: session.userId, // 自分のデータのみ作成可能
    },
  });
}
```

### 管理画面（/admin）の認可

管理画面はアプリ本体のログイン（JWT + Cookie）を使わず、**Cloudflare Access** で認証する。
本体のアカウントに管理者フラグを足す方式は、ユーザーの乗っ取りがそのまま管理者権限の奪取に
つながるため採らない。詳細は [10-admin.md](./10-admin.md)。

```typescript
// 管理画面のページ・Server Action は必ず先頭で requireAdmin() を呼ぶ
// （src/proxy.ts の入り口のゲートがあっても省かない）
export async function revokeShareTokenAsAdmin(partnerId: string) {
  const actor = await requireAdmin(); // Cloudflare Access の JWT を検証する

  // ... 変更を加えたあと、必ず監査ログに残す
  await prisma.adminAuditLog.create({
    data: { actorEmail: actor.email, action: "REVOKE_SHARE_TOKEN", summary, ... },
  });
}
```

- Access の JWT（`Cf-Access-Jwt-Assertion` ヘッダー / `CF_Authorization` Cookie）を
  チーム用 JWKS で検証し、`iss` と `aud` を突き合わせる
- 検証を通らないリクエストは Cloudflare を経由していないので必ず拒否する
- `ADMIN_EMAILS` を設定すると、Access のポリシーに加えてメールアドレスの許可リストで二重に絞れる
- `ADMIN_DEV_EMAIL`（ローカル用の抜け道）は `NODE_ENV=production` では読まれない

---

## 6.2 入力バリデーション

| 項目       | ルール                                |
| ---------- | ------------------------------------- |
| 金額       | 整数のみ、-10,000,000 〜 10,000,000円 |
| 説明       | 最大100文字                           |
| 日付       | 未来日は登録不可                      |
| ユーザー名 | 3〜20文字、英数字とアンダースコアのみ |
| パスワード | 8文字以上                             |

### バリデーションの実装箇所

1. **クライアント側**: フォーム入力時のリアルタイムチェック
2. **サーバー側**: Server Actions で必ず再検証

```typescript
// Zodを使用したバリデーション例
import { z } from "zod";

const transactionSchema = z.object({
  partnerId: z.string().min(1, "相手を選択してください"),
  amount: z
    .number()
    .int("整数で入力してください")
    .min(1, "金額を入力してください")
    .max(10000000, "金額は1,000万円以下で入力してください"),
  description: z
    .string()
    .max(100, "説明は100文字以内で入力してください")
    .optional(),
  date: z.date().max(new Date(), "未来の日付は選択できません"),
});
```

---

## 6.3 非機能要件

| 項目         | 要件                                   |
| ------------ | -------------------------------------- |
| レスポンス   | 画面表示 2秒以内                       |
| 対応デバイス | スマートフォン（iOS/Android）、PC      |
| ブラウザ     | Chrome, Safari, Edge (最新2バージョン) |
| 可用性       | Cloudflare Workers/Supabaseの標準SLA               |

---

## 6.4 セキュリティチェックリスト

### 認証・セッション

- [ ] パスワードはbcryptでハッシュ化して保存
- [ ] JWTはHTTP-Only Cookieに保存
- [ ] JWTのシークレットキーは環境変数で管理
- [ ] トークン有効期限の設定

### データアクセス

- [ ] 全ての書き込み操作で認証チェック
- [ ] ownerId は必ずセッションから取得（リクエストパラメータを信用しない）
- [ ] SQLインジェクション対策（Prismaの使用で自動対応）

### 入力処理

- [ ] 全ての入力値をサーバー側でバリデーション
- [ ] XSS対策（Reactの使用で自動エスケープ）

### 管理画面

- [ ] 管理画面のページ・Server Actionはすべて `requireAdmin()` を呼んでいる
- [ ] 管理画面からの書き込みはすべて `AdminAuditLog` に記録される
- [ ] 共有リンクのトークンの値を管理画面に表示していない
- [ ] `ADMIN_DEV_EMAIL` が本番で効かないこと（`NODE_ENV=production` で無効）

### 環境変数

- [ ] DATABASE_URL
- [ ] JWT_SECRET
- [ ] NODE_ENV
- [ ] CF_ACCESS_TEAM_DOMAIN（管理画面）
- [ ] CF_ACCESS_AUD（管理画面）
- [ ] ADMIN_EMAILS（管理画面・任意）
