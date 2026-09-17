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

### Account（認証ユーザー）

| カラム       | 型            | 説明                                       |
| ------------ | ------------- | ------------------------------------------ |
| id           | String (cuid) | 一意のID                                   |
| name         | String        | ユーザー名（ログイン用・表示用、ユニーク） |
| passwordHash | String        | bcryptでハッシュ化されたパスワード         |
| createdAt    | DateTime      | 作成日時                                   |

### Partner（貸借相手）

ユーザーが管理する「貸借相手」。アプリ未登録の友人も登録可能。

| カラム    | 型            | 説明                          |
| --------- | ------------- | ----------------------------- |
| id        | String (cuid) | 一意のID                      |
| name      | String        | 相手の名前                    |
| ownerId   | String        | この相手を登録したAccountのID |
| createdAt | DateTime      | 作成日時                      |

### Ledger（口座）

Partner ごとに複数持てる「貸し借りのまとまり」。利子のルールは口座単位で設定する。

| カラム                 | 型            | 説明                                                         |
| ---------------------- | ------------- | ------------------------------------------------------------ |
| id                     | String (cuid) | 一意のID                                                     |
| title                  | String        | 口座名（例: "通常", "利子つき"）                             |
| annualInterestRate     | Decimal(6,2)? | 年利(%)。0 = 無利子。1週間ぶんの利息は「年利 ÷ 52」で計算する |
| interestAccrualWeekday | Int           | 利息が発生する曜日（JST。0=日 〜 6=土）。既定は 3（水）        |
| interestCompounding    | Boolean       | true = 複利（元本＋未払利息に課金） / false = 単利（元本のみ） |
| lastInterestAccruedAt  | DateTime?     | 最後に利息を発生させた日時。同じ日の二重発生を防ぐために使う  |
| shareToken             | String?       | 共有リンク用トークン（unique）                               |
| shareTokenExpiresAt    | DateTime?     | 共有リンクの有効期限                                         |
| partnerId              | String        | 相手（Partner）のID                                          |

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

## 3.3 Prisma Schema

> このセクションは初期設計時のスナップショット。Ledger / LedgerNote や `kind`・`isArchived` などの
> 後から追加されたフィールドは含まれていない。**実際のスキーマは
> [`prisma/schema.prisma`](../prisma/schema.prisma) が正**。

```prisma
model Account {
  id           String   @id @default(cuid())
  name         String   @unique  // ログイン用・表示用
  passwordHash String
  createdAt    DateTime @default(now())

  // Relations
  transactions Transaction[]
  partners     Partner[]
}

model Partner {
  id              String   @id @default(cuid())
  name            String
  createdAt       DateTime @default(now())

  // Relations
  ownerId         String
  owner           Account  @relation(fields: [ownerId], references: [id])

  transactions    Transaction[]

  @@unique([ownerId, name]) // 同一オーナー内で名前の重複を防ぐ
}

model Transaction {
  id          String   @id @default(cuid())
  amount      Int      // +は貸し、-は借り/返済
  purpose     String?
  description String?
  date        DateTime @default(now())
  createdAt   DateTime @default(now())

  // Relations
  ownerId     String
  owner       Account  @relation(fields: [ownerId], references: [id])

  partnerId   String
  partner     Partner  @relation(fields: [partnerId], references: [id])

  @@index([ownerId])
  @@index([partnerId])
  @@index([date])
}
```

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

## 3.5 データアクセスパターン（Prisma）

### 自分の相手ごとの貸借残高を取得

```typescript
const balances = await prisma.transaction.groupBy({
  by: ["partnerId"],
  where: { ownerId: currentUserId },
  _sum: { amount: true },
});

// Partner情報と結合
const partnersWithBalance = await Promise.all(
  balances.map(async (b) => {
    const partner = await prisma.partner.findUnique({
      where: { id: b.partnerId },
    });
    return {
      partner,
      balance: b._sum.amount ?? 0,
    };
  }),
);
```

### 特定の相手との取引履歴を取得

```typescript
const transactions = await prisma.transaction.findMany({
  where: {
    ownerId: currentUserId,
    partnerId: partnerId,
  },
  orderBy: { date: "desc" },
  include: { partner: true },
});
```

### 自分の全取引履歴を取得

```typescript
const allTransactions = await prisma.transaction.findMany({
  where: { ownerId: currentUserId },
  orderBy: { date: "desc" },
  include: { partner: true },
});
```

### 説明のサジェスト（過去履歴から頻度順）

```typescript
const suggestions = await prisma.transaction.groupBy({
  by: ["purpose"],
  where: {
    ownerId: currentUserId,
    purpose: { not: null },
  },
  _count: { purpose: true },
  orderBy: { _count: { purpose: "desc" } },
  take: 10,
});
// → ["麻雀", "ドライブ", "ランチ", ...]
```
