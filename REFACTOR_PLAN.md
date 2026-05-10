# REFACTOR_PLAN.md

調査範囲: `src/` 配下（`src/app/generated/prisma` を除く 7,946 行）。
コードは未変更。発見順ではなく観点順に整理。

---

## 1. 重複コード

### 1-A. `/stats` と `/statistics` がほぼ完全重複
- **場所**: `src/app/(main)/stats/page.tsx:1-227` ／ `src/app/(main)/statistics/page.tsx:1-224`
- **問題**: `diff` 結果は関数名と 3 行のコメントのみ。`bottom-bar.tsx:11` が参照しているのは `/statistics` のみ。
- **リスク**: `/stats` 経由でアクセス可能なゾンビページ。片方を直してももう片方が古いまま。
- **コスト**: S / **効果**: M

### 1-B. 取引カードの描画ロジックが 3 箇所
- **場所**: `src/components/features/transaction/transaction-card.tsx:1-114` ／ `src/components/features/transaction/transaction-list.tsx:1-135` ／ `src/app/share/[token]/page.tsx:96-160`（インライン）
- **問題**: 「貸し/借りバッジ＋金額＋残高」の表示が 3 通りに重複。`transaction-list.tsx` は未使用（後述 6 章）。
- **リスク**: 表示崩れ・色定義の不整合。
- **コスト**: M / **効果**: M

### 1-C. 相対日付フォーマッタが 4 種類
- **場所**: `src/lib/dateUtils.ts:34` (`formatCompactTime`) ／ `src/components/features/partner/partner-home-card.tsx:8-30` (`formatRelativeDay`) ／ `src/components/features/partner/balance-card.tsx:13-19` (`formatRelativeDate`) ／ `src/components/features/partner/partner-card.tsx:11-16` (`formatDate`)
- **問題**: 「今日／昨日／N日前」のロジックを別々に書いている。
- **コスト**: S / **効果**: M

### 1-D. JST 変換イディオムの大量重複
- **場所**: `new Date(date.toLocaleString("en-US", { timeZone: "Asia/Tokyo" }))` が src 内 12 箇所
- **問題**: パフォーマンス（locale parse は遅い）かつ実装ミスが起きやすい。1 つの `toJST(date)` ヘルパに集約すべき。
- **コスト**: S / **効果**: M

### 1-E. 取引登録／編集モーダルの重複
- **場所**: `src/components/features/transaction/transaction-modal.tsx:1-192` ／ `src/components/features/transaction/transaction-edit-modal.tsx:1-220`
- **問題**: Partner ピッカー・state 群（partnerId/isLending/amount/description/dateMode/otherDate/selectedTime/error）・FormData 構築 がほぼ同形。`transaction-edit-modal.tsx:153-179` の Partner ボタングリッドと `transaction-modal.tsx:128-152` は重複。
- **コスト**: M / **効果**: L

### 1-F. 「相手の名前変更フォーム」が 3 箇所
- **場所**: `src/components/features/partner/add-partner-dialog.tsx:1-102` ／ `src/components/features/partner/edit-partner-dialog.tsx:1-103`（**未使用**） ／ `src/components/features/partner/partner-detail-client.tsx:96-129`
- **問題**: useActionState＋Input＋Loader2 ボタンの形が 3 回出現。
- **コスト**: M / **効果**: M

### 1-G. server action の認可チェックが 16 箇所重複
- **場所**: `src/actions/partner.ts` ／ `src/actions/transaction.ts` ／ `src/actions/partner-note.ts`
- **問題**: 「`getSession()` → `findUnique()` → `ownerId !== session.userId`」を毎回手書き。`requirePartnerOwnership(id)` のようなヘルパに集約すべき。
- **リスク**: 認可漏れの温床。1 箇所書き忘れたら即権限昇格バグ。
- **コスト**: M / **効果**: L

### 1-H. `revalidatePath` の連打が 44 箇所
- **場所**: 全 server actions
- **問題**: `revalidatePath("/")` ＋ `"/transactions"` ＋ `"/partners"` のセットを毎回直書き。1 つの `revalidatePartnerScope(partnerId)` ユーティリティで吸収すべき。
- **コスト**: S / **効果**: M

### 1-I. ローディングボタンのパターン重複
- **場所**: settings-client / add-partner / edit-partner / partner-detail-client / partner-note-form-dialog / partner-note-card / transaction-edit-modal / transaction-modal / transaction-card-list の **9 箇所**
- **問題**: `{isPending ? <Loader2 /> 〜中... : "ラベル"}` を毎回ベタ書き。
- **コスト**: S / **効果**: S

### 1-J. `BalanceCard` ／ `SharedBalanceCard` のラッパー二重化
- **場所**: `src/components/features/partner/balance-card.tsx:84-115`（`BalanceCard`）と `:117-130`（`SharedBalanceCard`）
- **問題**: 内部 `BalanceDisplay` を呼ぶラッパー 2 個。1 つに統合し `lenderName/borrowerName` を呼び出し側に出す方が見通しが良い。
- **コスト**: S / **効果**: S

---

## 2. 責務が大きすぎるファイル / 関数 / コンポーネント

### 2-A. `src/actions/partner.ts` 531 行
- 取得系 4 種（`getPartners`, `getPartnersForHome`, `getPartnerById`, `getPartnersWithBalance`）＋ CRUD 5 種＋ 共有トークン 3 種が同居。
- 分割案: `actions/partner/queries.ts` ／ `actions/partner/mutations.ts` ／ `actions/partner/share.ts`。
- **コスト**: M / **効果**: M

### 2-B. `src/actions/transaction.ts` 386 行
- `createTransaction:120-184` と `updateTransaction:204-282` の FormData 解析（amount/date 変換）が完全重複。
- `getTransactions:30-83` で sortOrder の振り分けが「DB 側 orderBy」と「アプリ側 sort」に分かれていて読みにくい。
- **コスト**: S / **効果**: M

### 2-C. `src/components/features/settings/settings-client.tsx` 342 行
- 表示名ダイアログ・パスワードダイアログ・テーマトグル・ヘルプリンク・ログアウト・バージョン表示を 1 ファイルに詰め込み。
- 分割: `account-section.tsx` / `theme-section.tsx` / `other-section.tsx`。
- **コスト**: M / **効果**: M

### 2-D. `src/components/features/transaction/transaction-filter-sheet.tsx` 254 行
- `FilterForm` ＋ `FilterButton` ＋ メディアクエリ判定 ＋ URL 同期。`useEffect(() => { setDraft(committed); }, [])` (line 67) は eslint-disable で抑制した不健全パターン。
- **コスト**: S / **効果**: M

### 2-E. `src/app/(main)/help/page.tsx` 247 行
- ハードコードされた長文 `<section>` の羅列。8 セクションを `HELP_SECTIONS` データ駆動 + ループ描画にすれば ~80 行。
- **コスト**: S / **効果**: M

---

## 3. 型定義の重複・`any` の濫用

### 3-A. `any` の濫用は無い
- 直接の `: any` / `as any` ヒットなし。`as unknown as { prisma: PrismaClient }` (`src/lib/prisma.ts:4`) は標準パターンで OK。

### 3-B. `Partner` 型が 4 種類に分裂
- **場所**: `src/actions/partner.ts` で `Partner` (line 8) / `PartnerWithBalance` (line 47) / `PartnerForHome` (line 56) / `PartnerById` (line 117)
- **問題**: `transactions/page.tsx:51` で `partnersWithBalance.filter(...).map(p => ({id, name}))` のように shape を落として渡している。基底型＋拡張のスキーマ設計が不在。
- **コスト**: M / **効果**: M

### 3-C. `transactionFilterParsers` シンボル衝突
- **場所**: `src/components/features/transaction/transaction-filters.tsx:11`（未使用）と `src/components/features/transaction/transaction-filter-sheet.tsx:38`（使用中）
- **問題**: **同名 export だが shape が違う**（filters は `partnerIds/showArchived/showArchivedPartners`、filter-sheet は `q/partnerIds/sortOrder`）。誤 import すると型はパスするが動作がおかしくなる。
- **リスク**: 高（バグ温床）
- **コスト**: S / **効果**: M

### 3-D. `Transaction` 型の重複定義
- `src/components/features/transaction/transaction-list.tsx:8-15` の `Transaction` と `src/actions/transaction.ts:8-19` の `TransactionWithPartner` が別モノ。前者は未使用なので削除で解消。

---

## 4. 古い書き方 / 不要な useEffect / Props バケツリレー

### 4-A. `eslint-disable react-hooks/exhaustive-deps` で抑制された useEffect
- `src/components/features/transaction/transaction-modal.tsx:64`（form reset）／ `src/components/features/transaction/transaction-filter-sheet.tsx:67`（draft 初期化）
- **問題**: `Dialog` の `key={open}` で remount するか、`onOpenChange` で reset すれば不要。
- **コスト**: S / **効果**: S

### 4-B. グローバル keydown を useEffect で直接登録
- **場所**: `src/components/features/transaction/transaction-modal.tsx:67-83`（"N" でモーダル open）
- **問題**: 共通 `useKeyboardShortcut` フックに切り出すべき。
- **コスト**: S / **効果**: S

### 4-C. `add-partner-dialog.tsx` ／ `edit-partner-dialog.tsx` の useEffect 二重
- 「open 時に name をリセット」「success 時に toast＆close」が `useEffect` 2 個。Dialog の `onOpenChange` ＋ action ハンドラで完結可能。

### 4-D. `transaction-edit-modal.tsx` の Props バケツリレー
- **場所**: `src/components/features/transaction/transaction-edit-modal.tsx:177-194` で `TransactionFormFields` に **setter を 11 個渡している**。
- **改善**: `useReducer` で 1 つの state に集約、または `react-hook-form` 導入。
- **コスト**: M / **効果**: L

### 4-E. `transaction-form-fields.tsx` の自作 click-outside
- **場所**: `:62-72` の `mousedown` リスナ。Radix Popover ／ shadcn の `Command`（コンボボックス）に置き換え可能。
- **コスト**: M / **効果**: M

### 4-F. `partner-detail-client.tsx` で `useActionState` と `useTransition` が混在
- `:36-42` で update は `useActionState`、archive/unarchive/delete は `useTransition` ＋ 個別関数。スタイルがファイル内で揃っていない。

### 4-G. `revalidatePath("/partners/${partnerId}")` などへ毎回 partnerId を渡している
- これも 1-H と関連。

---

## 5. ディレクトリ構成の歪み

### 5-A. `components/features/balance/` ディレクトリにファイル 1 つ・しかも未使用
- `src/components/features/balance/total-balance-card.tsx` のみ。削除推奨。

### 5-B. `getSession` の二重 export
- `src/lib/auth.ts:51` で定義され、`src/actions/auth.ts:218` でも `export { getSession }`。コード内で両 import パスが混在。一元化すべき（`@/lib/auth` のみ public）。

### 5-C. `lib/` 配下の命名規則不統一
- `dateUtils.ts`（camel）／ `date-picker-utils.ts`（kebab）／ `calc-running-balance.ts`（kebab）。kebab に統一推奨（`date-utils.ts`）。

### 5-D. `app/generated/prisma/` が `src/app` の下にある
- `tsconfig.json` の include は `**/*.ts` なので generated 型もコンパイル対象。`src/generated/` または `src/app/generated/` から外し `tsconfig.exclude` に追加するのが安全。
- `tsconfig.tsbuildinfo` のサイズが 220KB あるのは generated を取り込んでいる影響の可能性。

### 5-E. `components/layouts/menu-bottom-sheet.tsx` が「メニュー機能」なのに layouts 配下、かつ未使用
- `components/features/menu/` か削除。

---

## 6. 未使用ファイル・export・依存パッケージ

### 6-A. 未使用ファイル（grep で参照ゼロ確認済み）
| ファイル | 行数 |
|---|---|
| `src/app/(main)/stats/page.tsx` | 227 |
| `src/components/features/balance/total-balance-card.tsx` | 28 |
| `src/components/features/transaction/transaction-list.tsx` | 135 |
| `src/components/features/transaction/transaction-filters.tsx` | 111 |
| `src/components/features/partner/edit-partner-dialog.tsx` | 103 |
| `src/components/features/settings/profile-form.tsx` | 83 |
| `src/components/features/settings/logout-button.tsx` | 35 |
| `src/components/layouts/menu-bottom-sheet.tsx` | 56 |
| `src/components/layouts/theme-toggle.tsx` | 37 |
| **合計** | **~815 行** |

### 6-B. 依存の重複
- **`radix-ui` (meta-package)** と **`@radix-ui/react-*`（個別）** が両方 `package.json` にいる。`badge.tsx` と `sheet.tsx` だけが `radix-ui` 経由、残りは個別。**どちらかに統一**（個別の方がツリーシェイクに優しい）。
- `dotenv` は Next.js が `.env` を自動読み込みするので `screenshots` スクリプト等で使っていなければ削除可（要確認）。

### 6-C. `actions/auth.ts:218` の `export { getSession }` は再 export のみで実装重複ではないが、5-B の通り削除推奨。

---

## 7. shadcn/ui ／ Tailwind の標準逸脱

### 7-A. 生 `<textarea>` ／ 生 `<select>`
- `src/components/features/partner/partner-note-form-dialog.tsx:64-77`（textarea）
- `src/components/features/transaction/transaction-form-fields.tsx:188-199`（select、しかも `@/components/ui/select` は既に存在）
- **コスト**: S / **効果**: M

### 7-B. 自作 Switch コンポーネント
- `src/components/features/transaction/transaction-filters.tsx:65-100`（未使用ファイルだが、構造として shadcn `Switch` 不在を示唆）

### 7-C. emerald カラーの直書きが散在
- balance-card / share-link-section / share/[token]/page.tsx で `bg-emerald-50 dark:bg-emerald-950 …` の組がコピペされている。CSS 変数（`--success`, `--success-bg`）化推奨。

### 7-D. Tailwind 標準にない値
- `mt-0.75` (`transaction-card.tsx:74`, `transaction-form-fields.tsx`) ／ `bottom-37` (`transaction-filter-sheet.tsx:240`)
- 任意値は意図が読みにくい。`mt-1` ／ `bottom-36` ／ `bottom-40` 等の標準値か、theme で名前を付けるべき。

### 7-E. Form ライブラリが未導入
- 全フォームが素手で書かれている。バリデーションは server action 側のみ＝ クライアントは送信して初めてエラーが分かる。`react-hook-form + zod`（既に `zod` は依存にある）で UX 改善余地あり。

---

## 8. Prisma クエリの非効率

### 8-A. `getPartnerStats` の N+1
- **場所**: `src/actions/stats.ts:30-69`
- **問題**: パートナー全件取得後、**各パートナーごとに 4 クエリ** (`aggregate × 3 + count`) を Promise.all。10 人なら 41 クエリ。
- **改善**: `prisma.transaction.groupBy({ by: ['partnerId'], _sum: { amount: true }, _count: true, where })` を貸し/借り分の 2 クエリに集約。
- **コスト**: M / **効果**: L

### 8-B. `getMonthlyStats` で 12 ヶ月分の transaction を全 fetch
- **場所**: `src/actions/stats.ts:120-189`
- **問題**: SELECT で 12 ヶ月の取引を全部ダウンロード → JS で月集計。
- **改善**: `$queryRaw` で `DATE_TRUNC('month', date AT TIME ZONE 'Asia/Tokyo') AS month, SUM(CASE WHEN amount>0 THEN amount END), SUM(CASE WHEN amount<0 THEN -amount END) GROUP BY 1`。
- **コスト**: M / **効果**: M

### 8-C. `getPartnersForHome` の過剰 fetch
- **場所**: `src/actions/partner.ts:69-108`
- **問題**: 各パートナーの **全取引** を select（amount/description/date）して JS で sum と先頭 1 件を取り出す。
- **改善**: balance は `_sum`、`lastTransaction` は `take: 1` の relation query を使用。
- **コスト**: M / **効果**: M（取引数が増えると効く）

### 8-D. `getOverallStats` の 4 連続 aggregate
- **場所**: `src/actions/stats.ts:80-117`
- **改善**: `groupBy` 1 回 ＋ `count` 1 回に集約。`partnerId: { in: [...] }` を `partner: { ownerId, isArchived: false }` のリレーション制約に変えれば事前 fetch も不要。
- **コスト**: S / **効果**: M

### 8-E. `getPartnerById` の transactions 全 fetch
- **場所**: `src/actions/partner.ts:124-153`
- **問題**: balance 計算のため全取引を取得。さらに同じ partner の取引はページ側で `getTransactions({ partnerIds: [id] })` でも再度取得しており **二重 fetch**。
- **改善**: `getPartnerById` 側は `_sum` のみに（または `getTransactions` 結果を呼び出し側で reduce して再利用）。
- **コスト**: M / **効果**: M

### 8-F. `updateTransaction` の二重 findUnique
- **場所**: `src/actions/transaction.ts:240-265`
- **改善**: `findUnique({ include: { partner: true } })` で 1 回に。
- **コスト**: S / **効果**: S

### 8-G. `getTransactions` のソート分岐
- **場所**: `src/actions/transaction.ts:46-83`
- **問題**: `amount_*` のとき DB は date 順で取得し JS で再ソート → 大量データだと重い。
- **改善**: `$queryRaw` か Prisma 側で `orderBy: { amount: 'desc' }` の絶対値ソートを raw で。
- **コスト**: S / **効果**: S（取引数が小さい間は許容）

### 8-H. `createPartner` ／ `updatePartner` の事前重複名チェック
- **場所**: `src/actions/partner.ts:200-211, 268-279`
- **改善**: compound unique 制約でエラーを catch → 1 クエリ削減。
- **コスト**: S / **効果**: S

---

## 先にやるべき TOP5

### #1. 未使用ファイル一括削除（9 ファイル / ~815 行）
**対象**: 6-A の表のファイル全部。
**理由**: ノーリスクで 10% のコード量削減。特に `transaction-filters.tsx` には **稼働中の `transaction-filter-sheet.tsx` と同名・別 shape の `transactionFilterParsers` が export されており（3-C）誤 import で確実にバグる**。早く消したい。
**コスト**: S / **効果**: M

### #2. server actions の認可ヘルパー & revalidate ヘルパー抽出
**対象**: 1-G（16 箇所）／ 1-H（44 箇所）／ 8-F。
**理由**: **セキュリティ**にダイレクトに効く。`requireOwnedPartner(id)` ／ `revalidatePartnerScope(partnerId)` を共通化すれば、認可漏れを「型」で防げる。コード量も 30〜40% 減。
**コスト**: M / **効果**: L

### #3. `getPartnerStats` ／ `getMonthlyStats` の N+1 解消
**対象**: 8-A ／ 8-B（必要なら 8-C, 8-E も）。
**理由**: 統計ページは集計処理。将来パートナー数・取引数が増えると一番先に詰まる。`groupBy` 1〜2 クエリに収束させるだけ。
**コスト**: M / **効果**: L

### #4. JST／日付フォーマッタの一元化
**対象**: 1-C（4 種類の相対日付）／ 1-D（12 箇所の JST 変換イディオム）／ 5-C（命名統一）。
**理由**: バグの温床トップ。表示の一貫性も向上。`lib/date-utils.ts` を 1 つに集約 → 全コンポーネントが恩恵。
**コスト**: S / **効果**: M

### #5. 取引フォーム再構成（modal × 2 ＋ form-fields）
**対象**: 1-E ／ 4-D ／ 4-A ／ 4-B ／ 7-A ／ 7-E。
**理由**: ユーザーが一番触る機能。約 600 行の重複・props バケツリレー。`react-hook-form + zod`（依存追加なし、`zod` は既存）導入＋ Partner ピッカー切り出しで 600 → ~300 行。
**コスト**: L / **効果**: L

---

## 補足（後回しで良いもの）

- `/stats` 削除は #1 に含む（単独でも S/M）。
- `help/page.tsx` のデータ駆動化（2-E）：見栄えの改善で機能には影響しない。
- shadcn 不採用部分（生 textarea/select、自作 Switch）は #5 と一緒にやると相性が良い。
- 依存の整理（`radix-ui` vs `@radix-ui/react-*`）は #1 のあとに `npm dedupe` 込みで。
