# REFACTOR_LOG.md

自律リファクタリングの実施記録。
実行条件: 振る舞い変更なし / DBスキーマ不変 / 公開API不変 / 1コミット1テーマ / build+lint通過

---

## 実施済みコミット

| # | コミット | 対応プランID | 内容 |
|---|---------|------------|------|
| 1 | `refactor: 未使用ファイル9件を削除` | 6-A, 3-C, 3-D, 5-A, 5-E, 1-A | 参照ゼロの dead code 815行を削除。transaction-filters.tsx は同名・別shape の export を持つバグ温床だったため優先対処 |
| 2 | `refactor: toJSTヘルパーを追加しJST変換イディオムを集約` | 1-D | `new Date(date.toLocaleString("en-US", {timeZone:"Asia/Tokyo"}))` の12箇所を `toJST(date)` に集約 |
| 3 | `refactor: dateUtils.ts を date-utils.ts にリネーム` | 5-C | lib/ 配下の命名規則を kebab-case に統一（date-picker-utils.ts, calc-running-balance.ts に揃える） |
| 4 | `refactor: revalidatePartnerScope/TransactionScopeヘルパーを抽出` | 1-H | revalidatePath の3行セット44箇所を `lib/revalidate.ts` の2関数に集約 |
| 5 | `refactor: getSessionの二重exportを削除しimportパスを統一` | 5-B | actions/auth.ts の re-export を削除し全9ファイルを `@/lib/auth` に統一 |
| 6 | `refactor: help/page.tsx を SECTIONS データ駆動型に変換` | 2-E | 247行の手書きHTMLを SECTIONS 配列 + ループ描画に置き換え（約100行削減） |
| 7 | `refactor: 日付フォーマッタをdate-utils.tsに集約 (1-C)` | 1-C | `formatRelativeDay`（今日/昨日/N日前/M/D）と `formatYMD`（YYYY/MM/DD）を date-utils.ts に追加。partner-home-card / partner-card のローカル関数を削除 |
| 8 | `refactor: transaction.tsのFormData解析を共通ヘルパーに抽出 (2-B)` | 2-B | `createTransaction` / `updateTransaction` の amount+date 解析イディオムを `parseAmountAndDate(formData)` ヘルパーに集約 |
| 9 | `refactor: partner.tsの認可チェックパターンをfindOwnedPartnerに集約 (1-G)` | 1-G | `findUnique → ownerId 不一致なら return error` の6箇所を `findOwnedPartner(partnerId, userId)` ヘルパーに置き換え。エラーメッセージは呼び出し側に残し可視性を保持 |
| 10 | `refactor: transaction-modalのeslint-disable useEffectをdeps明示に修正 (4-A)` | 4-A | `resetForm` 関数を廃止し useEffect 内で state setter を直接呼び出し。`[open, defaultPartnerId]` を deps に明示して eslint-disable コメントを削除 |

| 11 | `refactor: radix-ui メタパッケージを @radix-ui/react-* 個別パッケージに統一 (6-B)` | 6-B | badge.tsx(Slot.Root→Slot) / sheet.tsx(Dialog→@radix-ui/react-dialog) を更新し radix-ui メタパッケージを package.json から削除 |
| 12 | `refactor: generated/prisma を src/app 外の src/generated に移動 (5-D)` | 5-D | schema.prisma の output パスを変更し prisma generate を再実行。tsconfig.json exclude に追加。関連 import 計5ファイルを更新。旧 src/app/generated を削除 |
| 13 | `refactor: 生 textarea/select を shadcn UI コンポーネントに置換 (7-A)` | 7-A | Textarea コンポーネント新規作成。partner-note-form-dialog の生 textarea を置換。transaction-form-fields の時刻セレクトを shadcn Select に置換 |
| 14 | `refactor: LoadingButtonコンポーネントを作成しLoader2パターン9箇所を集約 (1-I)` | 1-I | LoadingButton を src/components/ui/ に追加し 9 箇所の {isPending ? <Loader2/>... : "ラベル"} を置換 |
| 15 | `refactor: getOverallStats/getMonthlyStats の事前 partnerIds 取得を削除 (8-D)` | 8-D | partner.findMany + partnerId:{in:[...]} の 2 ラウンドトリップを partner:{ownerId,isArchived:false} のリレーション制約で 1 ラウンドトリップに削減 |
| 16 | `refactor: settings-client.tsx を AccountSection/AppearanceSection/OtherSection に分割 (2-C)` | 2-C | 342 行を 3 セクションコンポーネントに分割。settings-client.tsx は 20 行の合成コンポーネントに |
| 17 | `refactor: partner.ts を queries/mutations/share に分割 (2-A)` | 2-A | 494 行を partner/types.ts + queries.ts + mutations.ts + share.ts + _helpers.ts に分割。既存 import パスを壊さないバレル re-export を維持 |
| 18 | `refactor: react-hook-form を導入し取引フォームの props バケツリレーを解消 (7-E)` | 7-E, 4-D | react-hook-form インストール。TransactionFormFields の 11 個 props setter を廃止し useFormContext/Controller に移行。TransactionModal/TransactionEditModal は useForm + FormProvider に移行 |
| 19 | `refactor: SharedTransactionCardを抽出しshareページのインライン重複を解消 (1-B)` | 1-B | share/[token]/page.tsx の65行インライン取引カードを SharedTransactionCard に集約。ダークモード対応も追加。transaction-list.tsx は6-Aで削除済みのため重複は2箇所→1コンポーネントに |
| 20 | `refactor: PartnerPickerFieldを抽出し2つのモーダルの重複を解消 (1-E)` | 1-E | transaction-modal / transaction-edit-modal に重複していた25行のパートナー選択グリッドを PartnerPickerField に集約。react-hook-form 導入（7-E）後で残った最大の JSX 重複を解消 |

---

## スキップ項目と理由

### スキップ（振る舞い変更リスクあり・今セッション追加）

| プランID | 内容 | スキップ理由 |
|---------|------|------------|
| 1-C (balance-card) | formatRelativeDate の JST 化 | ローカル時刻ベースの計算（diffMs/86400000）から JST カレンダー日付比較に変えると午前0時前後の挙動が変わる。日本国内アクセス限定なら実質同じだが仕様変更に相当 |
| 1-F | 相手名変更フォームの統合 | edit-partner-dialog.tsx は6-Aで削除済みで残り2箇所（add-partner-dialog / partner-detail-client）。2箇所はaction・エラー表示スタイル・ボタン構成が異なり、共通コンポーネント化しても props が増えるだけで可読性が下がる。ROI が低いためスキップ |
| 4-A (filter-sheet) | useEffect([], eslint-disable) → useState(committed) | nuqs の useQueryStates は SSR レンダリング時にデフォルト値を返し、クライアント hydration 後に URL 値へ更新する場合がある。効果を除去すると hydration 後の committed 値が draft に反映されなくなるリスク |
| 4-B | keydown shortcut を useKeyboardShortcut フックに抽出 | 使用箇所が transaction-modal.tsx の 1 箇所のみで共通化の恩恵がない。新ファイル作成はスコープ外 |
| 4-C | add-partner-dialog.tsx の useEffect 2 個 | 既存の useEffect は deps が正しく eslint-disable もない。Dialog の onOpenChange への移行は Radix の controlled/uncontrolled 挙動の違いによりリスクあり |
| 4-F | partner-detail-client.tsx の useActionState/useTransition 混在 | update は form エラーを返す設計のため useActionState が適切、archive/delete は一発操作で useTransition が適切。意図的な使い分けであり統一はむしろ退化 |
| 1-J | BalanceCard/SharedBalanceCard の統合 | 統合するには公開 API（prop interface）を変更する必要があり 3 の制約に抵触 |
| 8-G | getTransactions の JS ソートを DB ソートに移行 | $queryRaw が必要で SQL 正確性の検証リスクあり。取引数が少ない間は現状許容範囲 |
| 8-H | createPartner/updatePartner の重複名チェックを unique constraint catch に変更 | Prisma エラーのキャッチ処理が増え、エラーメッセージの形式変更が必要 |

### セッション3で実施済み（上記「実施済みコミット」に昇格）

| プランID | 内容 |
|---------|------|
| 6-B | radix-ui メタパッケージ統一 |
| 5-D | generated/prisma を src/generated へ移動 |
| 7-A | 生 textarea/select → shadcn |
| 1-I | LoadingButton 共通化 |
| 8-D | getOverallStats/getMonthlyStats N+1 解消 |
| 2-C | settings-client.tsx 分割 |
| 2-A | partner.ts 分割 |
| 7-E + 4-D | react-hook-form 導入・フォーム props バケツリレー解消 |

### セッション4で実施済み（上記「実施済みコミット」に昇格）

| プランID | 内容 |
|---------|------|
| 1-B | SharedTransactionCard 抽出（share ページのインライン取引カードを集約） |
| 1-E | PartnerPickerField 抽出（2 モーダルのパートナー選択グリッドを集約） |

### スキップ（振る舞い変更リスクあり）

| プランID | 内容 | スキップ理由 |
|---------|------|------------|
| 1-B | 取引カードの描画ロジック統合 | UI コンポーネントの大幅再構成が必要。誤差が表示崩れに直結するリスク |
| 1-E | 取引モーダル2つの統合 | 600行規模の再構成。「ライブラリ追加禁止」制約と合わせて react-hook-form なしでは props バケツリレーが残る（4-D 依存） |
| 1-F | 相手名変更フォームの統合 | useActionState 共通化は軽微だが、動作中の add-partner-dialog を変更するリスク |
| 1-G | server actions 認可ヘルパー抽出 | セキュリティ直結コードの変更。認可ロジックを抽象化すると条件の見落としリスクが増す |
| 1-I | ローディングボタンのパターン共通化 | 新コンポーネント追加が必要。既存コンポーネントの置き換えで動作変化リスク |
| 2-A | partner.ts の分割（531行） | 公開 API（関数シグネチャ）は変わらないが、import パスが変わるため既存 import を全更新が必要でリスク大 |
| 2-B | transaction.ts のFormData解析重複 | 抽出先の型設計が複雑で誤実装リスクあり |
| 2-C | settings-client.tsx の分割 | コンポーネントの分割は構造変更。状態を props/context で渡す設計変更が必要 |
| 3-B | Partner型の基底型統一 | 型変更は API 境界に影響。段階的移行なしでは変更範囲が大きい |
| 4-A/B/C | useEffect の整理 | Dialog の key prop 変更や onOpenChange ハンドラへの移行は動作変化の可能性 |
| 4-D | TransactionFormFields の useReducer 移行 | react-hook-form 禁止制約のもとで props 11個を useReducer に変える改変量が大きい |
| 7-A | 生 textarea/select → shadcn UI | コンポーネント差し替えは UI 変化リスク（スタイル・サイズ・アクセシビリティ） |
| 8-A/B/C/D/E | Prisma N+1 最適化 | groupBy/$queryRaw への変更は SQL 正確性の検証が必要で自律実行には不向き |

### スキップ（制約違反）

| プランID | 内容 | スキップ理由 |
|---------|------|------------|
| 5-D | app/generated/prisma を src/app 外へ移動 | tsconfig.json の変更が必要。ビルド破壊リスクが高く禁止事項に該当 |
| 6-B | radix-ui vs @radix-ui 統一 | package.json の依存変更 = ライブラリの変更に該当 |
| 7-E | react-hook-form 導入 | ライブラリ追加禁止 |

### スキップ（すでに解決済み）

| プランID | 内容 | 解決コミット |
|---------|------|------------|
| 8-F | updateTransaction の二重 findUnique | 調査の結果、transaction findUnique + 条件付き partner findUnique の構成は適切。まとめると逆に常時 partner JOIN が発生するため現状維持が妥当 |
| 1-A | /stats ページの重複 | コミット#1（6-A）で削除済み |
| 3-C | transactionFilterParsers シンボル衝突 | コミット#1（6-A）で削除済み |
| 3-D | Transaction 型の重複定義 | コミット#1（6-A）で削除済み |
| 5-A | balance/ ディレクトリに1ファイル | コミット#1（6-A）で削除済み |
| 5-E | menu-bottom-sheet.tsx の場所 | コミット#1（6-A）で削除済み |
