# ツケカン アプリ概要

## プロダクト概要

**ツケカン**は、グループ（家族・友人など）内でのお金の貸し借りを管理するWebアプリ。
各ユーザーが「自分視点」で取引を記録し、相手ごとの残高を追跡する。

- **バージョン**: 1.0.0
- **ホスティング**: Supabase (PostgreSQL) + Vercel想定
- **対象デバイス**: スマートフォン中心（PWA対応）

---

## 技術スタック

| 領域 | 技術 |
|------|------|
| フレームワーク | Next.js 16.1.0 (App Router) |
| 言語 | TypeScript 5 |
| DB ORM | Prisma 7.2 |
| DB | PostgreSQL (via `@prisma/adapter-pg`) |
| 認証 | JWT (jose) + HttpOnly Cookie |
| UI | Radix UI + Tailwind CSS v4 |
| バリデーション | Zod v4 |
| パスワード | bcryptjs |
| ID生成 | @paralleldrive/cuid2 |
| トースト | sonner |
| テーマ | next-themes (ダーク/ライト) |
| E2Eテスト | Playwright |

---

## データモデル

```
Group
├── id
├── name          グループ名
├── inviteCode    招待コード（unique）
└── accounts[]    メンバー一覧

Account
├── id
├── name          表示名（グループ内unique）
├── passwordHash
├── groupId       所属グループ
├── role          ADMIN | MEMBER
├── transactions[]  自分が記録した取引
├── partners[]      自分が管理するパートナー (OwnerPartners)
└── linkedFrom[]    自分がリンクされているパートナー (LinkedAccount)

Partner
├── id
├── name          相手の表示名
├── ownerId       このPartnerを所有するAccount
├── linkedAccountId  グループ内の別Accountへのリンク（任意）
└── transactions[]

Transaction
├── id
├── amount        整数（円）※ + は貸し / - は借り or 返済
├── description   メモ（任意、100文字以内）
├── date          取引日
├── ownerId       記録者のAccount
└── partnerId     取引相手のPartner
```

### データモデルの重要な概念

- **Partner** は「自分が管理する相手」であり、ユーザーごとに独立して存在する
- グループ内のメンバーが招待で参加すると、既存全メンバーと双方向で `Partner` レコードが自動生成される
- `linkedAccountId` によって、同グループ内の実アカウントと紐付けられる（グループ外の相手はリンクなしで登録可）
- **取引は一方的**: AがBを相手に記録した取引は、BからAを相手にした取引とは別物

---

## 認証・セキュリティ

- JWTをHttpOnly Cookieに保存（有効期限90日）
- セッション情報: `{ userId, name }`
- ログイン: userId（Account.id）+ パスワードで認証
- 招待制: グループへの参加は招待コード（URL）経由のみ
- 管理者のみ: 招待コード再生成、グループ名変更、メンバー削除

---

## 画面構成・ルーティング

```
/login                        ログイン画面
/invite/[code]                招待経由の新規登録

/(main)                       認証済みレイアウト（Header + BottomBar）
  /                           ホーム（自分の残高・取引履歴）
  /partners/[id]              特定パートナーとの取引詳細
  /from-members               相手が記録した「自分宛ての」取引一覧
  /from-members/[memberId]    特定メンバーからの取引詳細
  /group                      グループ管理
  /group/members              管理者向けメンバー管理
  /account                    アカウント設定（名前変更・パスワード変更）
```

---

## ナビゲーション

BottomBar（固定フッター）に3タブ:
1. **自分** (`/`) — 自分が記録した残高・取引
2. **相手から** (`/from-members`) — 相手が自分宛てに記録した取引
3. **グループ** (`/group`) — グループ情報・メンバー管理

---

## 主要機能

### 取引管理（`/` および `/partners/[id]`）
- 取引の作成・編集・削除（Server Actions）
- 相手の選択・金額・メモ・日付を入力
- 過去のメモからサジェスト機能（使用頻度順上位10件）
- 相手ごとの残高 + 累計残高表示
- 取引履歴のクリップボードコピー機能

### 相手から見た取引（`/from-members`）
- 他メンバーが「自分」を相手に記録した取引を読み取り専用で閲覧
- 自分の `Account.id` に `linkedAccountId` が紐づくトランザクションを集計

### グループ管理
- 招待リンクの発行・再生成（管理者のみ）
- メンバー追加は招待URL経由
- メンバー削除時はPartnerのリンクを解除してからAccount削除

---

## Server Actions 一覧

| ファイル | アクション |
|---------|-----------|
| `actions/auth.ts` | `login`, `logout`, `getCurrentUser`, `updateProfile` |
| `actions/group.ts` | `getGroupByInviteCode`, `registerWithInvite`, `regenerateInviteCode`, `updateGroupName`, `removeMember`, `getGroupMembers` |
| `actions/partner.ts` | `getPartners`, `createPartner` |
| `actions/transaction.ts` | `getDescriptionSuggestions`, `createTransaction`, `updateTransaction`, `deleteTransaction` |
| `actions/from-members.ts` | `getMemberBalancesForMe`, `getTransactionsForMe`, `getTotalBalanceForMe`, `getTransactionsFromMember` |
| `actions/member.ts` | （メンバー取得系） |

---

## ファイル構成

```
src/
├── actions/          Server Actions（DB操作・バリデーション）
├── app/
│   ├── (auth)/login/ ログイン画面
│   ├── (main)/       認証済みページ群
│   ├── invite/[code] 招待登録ページ
│   ├── generated/    Prismaクライアント自動生成
│   └── layout.tsx    ルートレイアウト（ThemeProvider）
├── components/
│   ├── features/     機能別コンポーネント
│   │   ├── balance/
│   │   ├── from-members/
│   │   ├── group/
│   │   ├── member/
│   │   ├── partner/
│   │   ├── settings/
│   │   └── transaction/
│   ├── layouts/      Header, BottomBar, FAB, ThemeToggle
│   └── ui/           shadcn/ui ベースの汎用コンポーネント
└── lib/
    ├── auth.ts       JWT / Cookie処理
    ├── password.ts   bcrypt
    ├── prisma.ts     Prismaクライアントシングルトン
    ├── dateUtils.ts
    └── utils.ts      cn()
```

---

## 既知の設計上の特徴・制約

1. **グループ必須**: ユーザーは必ず1つのグループに所属。グループ作成フローは現在UIなし（初期データ投入で対応）
2. **Partnerの二重管理**: グループメンバー間では双方向Partnerが自動生成されるが、取引は一方向（自分視点のみ）
3. **amount符号の意味**: `+` = 貸し（相手が借りている）、`-` = 借り・返済（自分が返す側）
4. **グループを超えた取引は不可**: `linkedAccountId` は同一グループ内のみ
5. **テストなし**: 現状テストコードは存在しない

---
