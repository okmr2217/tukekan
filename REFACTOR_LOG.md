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

---

## スキップ項目と理由

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
