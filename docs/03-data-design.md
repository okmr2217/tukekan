# 3. データ設計

## 3.1 ER図（概念）

```
┌─────────────┐       ┌─────────────────┐
│   Account   │       │   Transaction   │
├─────────────┤       ├─────────────────┤
│ id (PK)     │──┐    │ id (PK)         │
│ name        │  │    │ amount          │
│ passwordHash│  │    │ purpose         │
│ createdAt   │  │    │ description     │
└─────────────┘  │    │ date            │
                 │    │ createdAt       │
                 │    │                 │
                 │    │ ownerId (FK)    │──> Account
┌─────────────┐  │    │ partnerId (FK)  │──> Partner
│   Partner   │  │    └─────────────────┘
├─────────────┤  │
│ id (PK)     │──┘
│ name        │
│ ownerId (FK)│──> Account
│ createdAt   │
└─────────────┘
```

---

## 3.2 テーブル定義

> 型は概念上のもの。DB は Cloudflare D1（SQLite）で、実際の列の持ち方は 3.3 を参照。

### Account（認証ユーザー）

| カラム       | 型            | 説明                                       |
| ------------ | ------------- | ------------------------------------------ |
| id           | String (cuid) | 一意のID                                   |
| name         | String        | ユーザー名（ログイン用・表示用、ユニーク） |
| passwordHash | String        | bcryptでハッシュ化されたパスワード         |
| createdAt    | DateTime      | 作成日時                                   |

### Partner（貸借相手）

ユーザーが管理する「貸借相手」。アプリ未登録の友人も登録可能。

| カラム              | 型            | 説明                          |
| ------------------- | ------------- | ----------------------------- |
| id                  | String (cuid) | 一意のID                      |
| name                | String        | 相手の名前                    |
| ownerId             | String        | この相手を登録したAccountのID |
| shareToken          | String?       | 公開ページ（`/share/[token]`）用トークン（unique） |
| shareTokenExpiresAt | DateTime?     | 公開リンクの有効期限          |
| createdAt           | DateTime      | 作成日時                      |

### Ledger（口座）

Partner ごとに複数持てる「貸し借りのまとまり」。利子のルールは口座単位で設定する。

| カラム                 | 型            | 説明                                                         |
| ---------------------- | ------------- | ------------------------------------------------------------ |
| id                     | String (cuid) | 一意のID                                                     |
| title                  | String        | 口座名（例: "通常", "利子つき"）                             |
| annualInterestRateBp   | Int           | 年利をベーシスポイント（0.01% 単位の整数）で持つ。例: 5.25% → 525。0 = 無利子。1週間ぶんの利息は「年利 ÷ 52」で計算する |
| interestAccrualWeekday | Int           | 利息が発生する曜日（JST。0=日 〜 6=土）。既定は 3（水）        |
| interestCompounding    | Boolean       | true = 複利（元本＋未払利息に課金） / false = 単利（元本のみ） |
| lastInterestAccruedAt  | DateTime?     | 最後に利息を発生させた日時。同じ日の二重発生を防ぐために使う  |
| partnerId              | String        | 相手（Partner）のID                                          |

> 公開リンクは相手（Partner）単位。以前は口座ごとに `shareToken` を持っていたが、Partner へ移した。
>
> 年利は Supabase（PostgreSQL）時代は `annualInterestRate Decimal(6,2)`（%）だった。SQLite には Decimal がないため、
> D1 への移行で整数のベーシスポイントに持ち替えた。アプリ内では `toInterestSettings()` で % に直してから使う。

### Transaction（取引）

金額の正負で貸し借りを区別。返済も借りもマイナス金額で記録（purposeで区別可能）。

| カラム      | 型            | 説明                            |
| ----------- | ------------- | ------------------------------- |
| id          | String (cuid) | 一意のID                        |
| amount      | Int           | 金額（+は貸し、-は借り/返済）   |
| purpose     | String?       | 用途（麻雀、ドライブ、返済 等）。1行・100文字以内 |
| description | String?       | メモ（詳細テキスト）。複数行可・1000文字以内 |
| date        | DateTime      | 取引発生日                      |
| kind        | String        | 種別。`NORMAL`（通常の貸し借り） / `INTEREST`（自動発生した利息）。既定は `NORMAL` |
| ownerId     | String        | 取引を登録したAccountのID       |
| ledgerId    | String?       | 紐づく口座（Ledger）のID        |
| partnerId   | String        | 相手（Partner）のID             |
| createdAt   | DateTime      | 作成日時                        |

---

## 3.3 スキーマ（Drizzle ORM / Cloudflare D1）

**実際のスキーマは [`src/db/schema.ts`](../src/db/schema.ts) が正**。マイグレーション SQL は `drizzle/` にある
（手順は [11-cloudflare-workers.md](./11-cloudflare-workers.md) の 11.2）。
テーブル名・カラム名は Supabase（PostgreSQL + Prisma）時代と同じ。

| 概念上の型 | SQLite の列 | Drizzle の定義 | 備考 |
| --- | --- | --- | --- |
| String (cuid) | `text` | `text().primaryKey().$defaultFn(createId)` | ID はアプリ側で `@paralleldrive/cuid2` で振る |
| DateTime | `integer` | `integer({ mode: "timestamp_ms" })` | UNIX ミリ秒。Drizzle が `Date` に変換する |
| Boolean | `integer` | `integer({ mode: "boolean" })` | 0 / 1 |
| 年利 | `integer` | `integer("annualInterestRateBp")` | ベーシスポイント（3.2） |
| `updatedAt` | `integer` | `$onUpdateFn(() => new Date())` | 更新時にアプリ側で入れる |

外部キー:

| 列 | 参照先 | 削除時 |
| --- | --- | --- |
| `Partner.ownerId` | `Account.id` | 制限（相手が残っているアカウントは消せない） |
| `Ledger.partnerId` | `Partner.id` | 連動して削除 |
| `Transaction.ownerId` | `Account.id` | 制限 |
| `Transaction.partnerId` | `Partner.id` | 制限（取引が残っている相手は消せない） |
| `Transaction.ledgerId` | `Ledger.id` | null にする |

一意制約: `Account.email`、`Partner.shareToken`、`Partner(ownerId, name)`。

### AdminAuditLog（管理画面の操作記録）

管理画面（`/admin`）から行った書き込み操作と、Cron からの自動実行の記録。操作者は Cloudflare Access が認証した
メールアドレス（自動実行は `"cron"`）で、`Account` とはひも付かないためリレーションを張らない。詳細は [10-admin.md](./10-admin.md)。

| カラム | 型 | 説明 |
| --- | --- | --- |
| id | String (cuid) | 一意のID |
| actorEmail | String | Cloudflare Access が認証したメールアドレス。自動実行は `"cron"` |
| action | String | `REVOKE_SHARE_TOKEN` / `RUN_INTEREST_JOB` / `DRY_RUN_INTEREST_JOB` / `SCHEDULED_INTEREST_JOB` |
| targetType | String? | `"Partner"` / `"Job"` |
| targetId | String? | 対象のID |
| summary | String | 人が読むための要約 |
| createdAt | DateTime | 作成日時（索引あり。`actorEmail` にも索引） |

---

## 3.4 残高の内訳（元本と未払利息）

利息は元本に足さず、別勘定の「未払利息」として積む。内訳はDBに保存せず、
取引を日付順（同値なら作成順）に走査して毎回導出する（[`src/lib/ledger-balance.ts`](../src/lib/ledger-balance.ts)）。

| 取引 | 挙動 |
| --- | --- |
| `kind = "INTEREST"` | 未払利息を増やす |
| プラスの通常取引（貸し） | 元本を増やす |
| マイナスの取引（返済・借り） | **まず未払利息に充当**し、余りを元本から引く |

```
貸し 10,000 → 利息 500 → 返済 3,000
  元本 7,500 / 未払利息 0（返済のうち 500 が利息、2,500 が元本に充当される）
```

**不変条件**: `元本 + 未払利息 = 全取引の金額合計`。
つまり合計残高は利息を分離する前と変わらず、増えるのは内訳だけ。

利息額は「対象額 × 年利 ÷ 52（四捨五入）」。対象額は単利なら元本、複利なら元本＋未払利息で、
対象額が0以下の口座では利息は発生しない（[`src/lib/ledger-interest.ts`](../src/lib/ledger-interest.ts)）。

---

## 3.5 データアクセスパターン（Drizzle）

`db` は `src/lib/db.ts`、テーブルは `src/db/schema.ts` から import する。

### 自分の相手ごとの貸借残高を取得

```typescript
const balances = await db
  .select({
    partnerId: transaction.partnerId,
    balance: sql<number>`coalesce(sum(${transaction.amount}), 0)`.mapWith(Number),
  })
  .from(transaction)
  .where(and(eq(transaction.ownerId, currentUserId), eq(transaction.isArchived, false)))
  .groupBy(transaction.partnerId);
```

### 特定の相手との取引履歴を取得（相手の名前つき）

```typescript
const rows = await db
  .select({ transaction, partnerName: partner.name })
  .from(transaction)
  .innerJoin(partner, eq(transaction.partnerId, partner.id))
  .where(and(eq(transaction.ownerId, currentUserId), eq(transaction.partnerId, partnerId)))
  .orderBy(desc(transaction.date), desc(transaction.createdAt));
```

### 口座と取引をまとめて取得（リレーショナルクエリ）

```typescript
const ledgers = await db.query.ledger.findMany({
  where: eq(ledger.partnerId, partnerId),
  orderBy: asc(ledger.createdAt),
  with: {
    transactions: {
      where: (t, { eq }) => eq(t.isArchived, false),
      columns: { amount: true, kind: true, date: true, createdAt: true },
    },
  },
});
```

### 用途のサジェスト（過去履歴から頻度順）

```typescript
const suggestions = await db
  .select({ purpose: transaction.purpose })
  .from(transaction)
  .where(and(eq(transaction.ownerId, currentUserId), isNotNull(transaction.purpose)))
  .groupBy(transaction.purpose)
  .orderBy(desc(count()))
  .limit(10);
// → ["麻雀", "ドライブ", "ランチ", ...]
```

### 複数の書き込みをまとめる

D1 は対話的なトランザクション（`db.transaction()`）を使えない。全部成功か全部失敗かにしたい書き込みは `db.batch()` にまとめる。

```typescript
await db.batch([
  db.insert(transaction).values({ amount, kind: "INTEREST", /* ... */ }),
  db.update(ledger).set({ lastInterestAccruedAt: now }).where(eq(ledger.id, ledgerId)),
]);
```
