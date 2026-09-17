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
├── transactionLabelPreset  取引ボタンの名目ラベル（BOTH / LENDER / BORROWER）
├── partners[]      自分が管理するパートナー
├── transactions[]  自分が記録した取引
└── ledgerNotes[]   自分が書いたメモ

Partner
├── id
├── name          相手の表示名（オーナー内でunique）
├── isArchived    アーカイブ済みフラグ
├── shareToken           公開ページ用トークン（unique・任意）
├── shareTokenExpiresAt  公開リンクの有効期限
├── ownerId       このPartnerを所有するAccount
├── ledgers[]
└── transactions[]

Ledger（口座）
├── id
├── title                    自由記述（例: "通常", "利子つき"）
├── annualInterestRate       年利(%)。0 = 無利子。週の利息額は 年利 ÷ 52
├── interestAccrualWeekday   利息が発生する曜日（JST。0=日 〜 6=土。既定 3=水）
├── interestCompounding      true = 複利（元本+未払利息に課金） / false = 単利
├── lastInterestAccruedAt    最後に利息を発生させた日時（同日二重発生の防止）
├── partnerId
├── transactions[]
└── notes[]

Transaction
├── id
├── amount        整数（円）※ + は貸し / - は借り or 返済
├── purpose       用途（任意、1行・100文字以内。例: 麻雀、ランチ、返済）
├── description   メモ（任意、複数行可・1000文字以内の詳細テキスト）
├── date          取引日（UTC保存、表示時にJST変換）
├── kind          "NORMAL"（通常の貸し借り） | "INTEREST"（自動発生した利息）
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
- **利率は年利で持つ**: 週ごとの利息額は「年利 ÷ 52」で計算する。利率・発生曜日・単複利は口座ごとの設定
- **利息は元本と分離**: 利息は `kind = "INTEREST"` の取引として記録し、元本残高には足さず「未払利息」として別勘定に積む。
  返済（マイナス取引）はまず未払利息に充当され、余りが元本の返済になる（`src/lib/ledger-balance.ts`）。
  **合計残高 = 元本 + 未払利息 = 全取引の金額合計** は常に成り立つ

---

## 認証・セキュリティ

- JWTをHttpOnly Cookieに保存（有効期限90日）
- セッション情報: `{ userId, email, name }`
- ログイン: email + パスワードで認証
- データは全て `ownerId`（セッションのuserId）でスコープされ、他ユーザーのデータは参照できない
- 相手ごとの共有リンク（`/share/[token]`）のみ、未認証で読み取り専用の閲覧が可能

---

## 画面構成・ルーティング

```
/login                        ログイン画面
/register                     新規登録

/share/[token]                共有リンク（未認証・読み取り専用）

/(main)                       認証済みレイアウト（Header + BottomBar + FAB）
  /                           ホーム（相手ごとの残高一覧）
  /transactions               すべての取引
  /statistics                 統計
  /statistics/accounts        口座別の統計
  /partners/[id]              相手の詳細（合計残高・口座一覧・共有リンク・メモ・全口座の取引）
  /partners/[id]/edit         相手の編集（名前・アーカイブ・削除）
  /partners                   `/` へのリダイレクト（旧URL互換）
  /ledgers/[id]/settings      口座の設定（口座名・年利・利息の発生曜日・単利/複利・削除）
  /menu                       メニュー
  /settings                   設定（プロフィール・取引ボタン表示・外観）
  /help                       ヘルプ
```

---

## ナビゲーション

BottomBar（固定フッター）に4タブ:

1. **相手** (`/`) — 相手ごとの残高・相手の追加
2. **すべての取引** (`/transactions`) — 全取引の一覧・絞り込み
3. **統計** (`/statistics`) — 相手別・口座別の集計
4. **メニュー** (`/menu`) — 統計（口座別）・設定・ヘルプ

---

## 主要機能

### 取引管理
- 取引の作成・編集・アーカイブ・削除（Server Actions）
- 相手・口座・金額・用途・メモ・日付を入力
- 金額の符号は「名目ラベル」の2ボタンで選ぶ。ラベルの言い方は設定から3プリセットで切替（`src/lib/transaction-labels.ts`）
- 用途は1行、メモは複数行（1000文字以内）の詳細テキスト
- 過去の用途からサジェスト機能（使用頻度順上位10件）
- 口座ごとの残高 + 累計残高表示

### 相手（Partner）管理
- 相手の追加・編集・アーカイブ・削除
- 相手ページに「合計残高」「口座ごとの残高（利子ありの口座は元本／未払利息の内訳）」「全口座の取引履歴」をまとめて表示
- 取引履歴は口座ごとに絞り込める（口座カードをタップ。状態はURLの `?ledger=` に持つ）

### 口座（Ledger）管理
- Partnerごとに複数の口座を作成・削除。基本は相手ごとに1口座。設定は口座の設定ページ（`/ledgers/[id]/settings`）
- 口座単位で 年利(%)・利息の発生曜日・単利/複利 を設定
- 利息は選んだ曜日に週1回（9:00 JST）発生し、未払利息として元本と分けて積まれる
- 次回の利子発生日・見込み額のプレビュー表示
- 口座ごとのメモ（LedgerNote）

### 共有リンク
- 相手ごとに共有トークンを発行・失効
- `/share/[token]` で相手にすべての口座の残高・取引履歴・メモを読み取り専用で共有
- 公開ページでも口座ごとに絞り込める
- 有効期限切れ・失効後はアクセス不可

### 統計
- 相手別・口座別の貸借集計、月次推移、利子付き口座の一覧

---

## Server Actions 一覧

| ファイル | アクション |
|---------|-----------|
| `actions/auth.ts` | `login`, `register`, `logout`, `getCurrentUser`, `updateProfile`, `getTransactionLabelPreset`, `updateTransactionLabelPreset` |
| `actions/partner/queries.ts` | `getPartners`, `getPartnerById`, `getPartnersWithBalance`, `getPartnerBalance` |
| `actions/partner/mutations.ts` | `createPartner`, `updatePartner`, `archivePartner`, `unarchivePartner`, `deletePartner` |
| `actions/partner/share.ts` | `generatePartnerShareToken`, `revokePartnerShareToken`, `getPartnerByShareToken` |
| `actions/ledger.ts` | `getLedgersByPartner`, `getLedgerOptions`, `getLedgerById`, `createLedger`, `updateLedger`, `deleteLedger` |
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
│   ├── ledger-interest.ts  年利⇄週利の換算・次回利子日の算出・説明文の生成
│   ├── ledger-balance.ts   元本／未払利息の内訳計算（返済の利息充当・相手単位の合算）
│   ├── transaction-kind.ts 取引種別（NORMAL / INTEREST）
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
2. **amount符号の意味**: `+` = 自分の債権が増える（貸した／返済した）、`-` = 自分の債務が増える（借りた／返済された）。
   実質は2択だが名目は4通りあるため、ボタンのラベルは `Account.transactionLabelPreset` で切り替える（符号の意味は不変）
3. **色は「見ている人」の視点で一貫**: 緑 = 見ている人の債権 / 赤 = 見ている人の債務。
   アプリ内はユーザー視点、公開URL（`/share/[token]`）は相手視点に符号を反転して表示する（`src/lib/balance-wording.ts`）
   口座カードの符号の反転は `LedgerCard` の `viewpoint` プロパティが担当する
4. **`Transaction.ledgerId` は nullable**: 既存データの口座移行が完了するまで null を許容している
5. **利子付与はGitHub Actionsの定期実行**: 毎日 9:00 JST に起動し、その日が発生曜日の口座だけを処理する。
   詳細は [09-github-actions.md](./09-github-actions.md) を参照
6. **利息の充当は導出**: 元本／未払利息の内訳は取引を日付順に走査して都度計算する（充当結果はDBに保存しない）。
   そのため過去の取引を編集・アーカイブすると内訳も自動で計算し直される
7. **テストなし**: 現状テストコードは存在しない（Playwrightはスクリーンショット生成用）
