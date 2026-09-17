# ツケカン アプリ概要

## プロダクト概要

**ツケカン**は、友人・家族などとのお金の貸し借りを管理するWebアプリ。
各ユーザーが「自分視点」で取引を記録し、相手（Partner）ごと・口座（Ledger）ごとの残高を追跡する。

- **バージョン**: 2.1.0
- **ホスティング**: Supabase (PostgreSQL) + Vercel想定
- **対象デバイス**: スマートフォン中心

---

## 技術スタック

| 領域 | 技術 |
|------|------|
| フレームワーク | Next.js 16.1.0 (App Router) |
| 言語 | TypeScript 5 |
| DB ORM | Prisma 7.8 |
| DB | PostgreSQL (via `@prisma/adapter-pg`) |
| 認証 | JWT (jose) + HttpOnly Cookie |
| UI | Radix UI + Tailwind CSS v4 |
| フォーム | react-hook-form |
| URL状態管理 | nuqs |
| バリデーション | Zod v4 |
| パスワード | bcryptjs |
| ID生成 | @paralleldrive/cuid2 |
| トースト | sonner |
| テーマ | next-themes (ダーク/ライト) |
| スクリーンショット | Playwright + shot-kit |

---

## データモデル

```
Account
├── id
├── email         ログインID（unique）
├── name          表示名
├── passwordHash
├── partners[]      自分が管理するパートナー
├── transactions[]  自分が記録した取引
└── ledgerNotes[]   自分が書いたメモ

Partner
├── id
├── name          相手の表示名（オーナー内でunique）
├── isArchived    アーカイブ済みフラグ
├── ownerId       このPartnerを所有するAccount
├── ledgers[]
└── transactions[]

Ledger（口座）
├── id
├── title                        自由記述（例: "通常", "5000円貸しパターン"）
├── weeklyInterestRateUnder5000  残高5000円未満に適用する週利率(%)
├── weeklyInterestRateFrom5000   残高5000円以上に適用する週利率(%)
├── shareToken                   共有リンク用トークン（unique・任意）
├── shareTokenExpiresAt          共有リンクの有効期限
├── partnerId
├── transactions[]
└── notes[]

Transaction
├── id
├── amount        整数（円）※ + は貸し / - は借り or 返済
├── purpose       用途（任意、1行・100文字以内。例: 麻雀、ランチ、返済）
├── description   メモ（任意、複数行可・1000文字以内の詳細テキスト）
├── date          取引日（UTC保存、表示時にJST変換）
├── isArchived    アーカイブ済みフラグ
├── ownerId       記録者のAccount
├── partnerId     取引相手のPartner
└── ledgerId      紐づく口座（移行期間中は null 許容）

LedgerNote
├── id
├── content
├── ownerId
└── ledgerId
```

### データモデルの重要な概念

- **Partner** は「自分が管理する相手」であり、ユーザーごとに独立して存在する（アプリ未登録の相手も登録可）
- **Ledger（口座）** は Partner ごとに複数持てる。貸し借りのパターンごとに口座を分けて管理する
- **取引は一方的**: 自分が記録した取引のみを扱い、相手側のアカウントとは連動しない
- **週利率は残高帯で2段階**: 残高（絶対値）が5000円未満か以上かで適用レートが切り替わる

---

## 認証・セキュリティ

- JWTをHttpOnly Cookieに保存（有効期限90日）
- セッション情報: `{ userId, email, name }`
- ログイン: email + パスワードで認証
- データは全て `ownerId`（セッションのuserId）でスコープされ、他ユーザーのデータは参照できない
- 口座の共有リンク（`/share/[token]`）のみ、未認証で読み取り専用の閲覧が可能

---

## 画面構成・ルーティング

```
/login                        ログイン画面
/register                     新規登録

/share/[token]                共有リンク（未認証・読み取り専用）

/(main)                       認証済みレイアウト（Header + BottomBar + FAB）
  /                           ホーム（口座ごとの残高一覧）
  /transactions               すべての取引
  /statistics                 統計
  /statistics/accounts        口座別の統計
  /ledgers/[id]               口座の詳細（取引履歴・メモ・共有設定）
  /partners                   相手の一覧
  /partners/[id]              相手の詳細（口座一覧）
  /partners/[id]/edit         相手の編集
  /menu                       メニュー
  /settings                   設定（プロフィール・外観）
  /help                       ヘルプ
```

---

## ナビゲーション

BottomBar（固定フッター）に4タブ:

1. **口座** (`/`) — 口座ごとの残高・取引
2. **すべての取引** (`/transactions`) — 全取引の一覧・絞り込み
3. **統計** (`/statistics`) — 相手別・口座別の集計
4. **メニュー** (`/menu`) — 相手管理・設定・ヘルプ

---

## 主要機能

### 取引管理
- 取引の作成・編集・アーカイブ・削除（Server Actions）
- 相手・口座・金額・用途・メモ・日付を入力
- 用途は1行、メモは複数行（1000文字以内）の詳細テキスト
- 過去の用途からサジェスト機能（使用頻度順上位10件）
- 口座ごとの残高 + 累計残高表示

### 口座（Ledger）管理
- Partnerごとに複数の口座を作成・編集・削除
- 口座単位で週利率を設定（残高5000円未満／以上の2段階）
- 次回の利子付与日（毎週水曜 9:00 JST）のプレビュー表示
- 口座ごとのメモ（LedgerNote）

### 共有リンク
- 口座ごとに共有トークンを発行・失効
- `/share/[token]` で相手に残高・取引履歴・メモを読み取り専用で共有
- 有効期限切れ・失効後はアクセス不可

### 統計
- 相手別・口座別の貸借集計、月次推移、利子付き口座の一覧

---

## Server Actions 一覧

| ファイル | アクション |
|---------|-----------|
| `actions/auth.ts` | `login`, `register`, `logout`, `getCurrentUser`, `updateProfile` |
| `actions/partner/queries.ts` | `getPartners`, `getPartnerById`, `getPartnersWithBalance` |
| `actions/partner/mutations.ts` | `createPartner`, `updatePartner`, `archivePartner`, `unarchivePartner`, `deletePartner` |
| `actions/ledger.ts` | `getLedgersByPartner`, `getLedgersForHome`, `getLedgerById`, `createLedger`, `updateLedger`, `deleteLedger`, `generateLedgerShareToken`, `revokeLedgerShareToken`, `getLedgerByShareToken`, `getLedgerPartnerMap` |
| `actions/ledger-note.ts` | `createLedgerNote`, `updateLedgerNote`, `deleteLedgerNote` |
| `actions/transaction.ts` | `getTransactions`, `getDescriptionSuggestions`, `createTransaction`, `updateTransaction`, `archiveTransaction`, `unarchiveTransaction`, `deleteTransaction` |
| `actions/stats.ts` | `getPartnerStats`, `getOverallStats`, `getMonthlyStats` |
| `actions/ledger-stats.ts` | `getPartnerLedgerStats`, `getOverallLedgerStats`, `getInterestBearingLedgers` |

---

## ファイル構成

```
src/
├── actions/          Server Actions（DB操作・バリデーション）
├── app/
│   ├── (auth)/       login, register
│   ├── (main)/       認証済みページ群
│   ├── share/[token] 共有リンクページ
│   └── layout.tsx    ルートレイアウト（ThemeProvider）
├── components/
│   ├── features/     機能別コンポーネント
│   │   ├── ledger/
│   │   ├── partner/
│   │   ├── settings/
│   │   ├── stats/
│   │   └── transaction/
│   ├── layouts/      BottomBar, MobileHeader, FAB, ThemeProvider
│   └── ui/           shadcn/ui ベースの汎用コンポーネント
├── hooks/
├── lib/
│   ├── auth.ts             JWT / Cookie処理
│   ├── password.ts         bcrypt
│   ├── prisma.ts           Prismaクライアントシングルトン
│   ├── ledger-interest.ts  週利率の判定・次回利子日の算出
│   ├── calc-running-balance.ts
│   ├── date-utils.ts / date-picker-utils.ts
│   ├── revalidate.ts
│   └── utils.ts            cn()
├── types/
└── generated/prisma  Prismaクライアント自動生成
```

---

## 既知の設計上の特徴・制約

1. **単一ユーザー視点**: データは全て記録者本人にスコープされ、ユーザー間でのデータ共有は共有リンク経由の読み取りのみ
2. **amount符号の意味**: `+` = 貸し（相手が借りている）、`-` = 借り・返済（自分が返す側）
3. **`Transaction.ledgerId` は nullable**: 既存データの口座移行が完了するまで null を許容している
4. **利子付与はGitHub Actionsの定期実行**: 詳細は [09-github-actions.md](./09-github-actions.md) を参照
5. **テストなし**: 現状テストコードは存在しない（Playwrightはスクリーンショット生成用）
