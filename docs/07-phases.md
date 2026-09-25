# 7. 開発フェーズ

## フェーズ設計の考え方

```
Phase 1-1: 基盤構築
    ↓ 全ての土台。これがないと何も作れない
Phase 1-2: 認証機能
    ↓ ユーザー識別がないとデータを誰のものか区別できない
Phase 1-3: コア機能
    ↓ アプリの主目的。最小限の価値を提供
Phase 1-4: MVP完成
    ↓ コア機能を補完し、実用レベルに
Phase 2: 機能拡張
    ↓ MVPで十分使える状態になってから
Phase 3: UX向上
      既存機能が安定してから
```

**ポイント**: 各フェーズ終了時点で「動くもの」ができる。Phase 1-3終了時点で最低限使えるアプリになる。

---

## Phase 1-1: 基盤構築

- [ ] プロジェクトセットアップ（Next.js 16 + TypeScript + Tailwind）
- [ ] DBスキーマ定義・マイグレーション（当初は Prisma + Supabase。現在は Drizzle + D1）
- [ ] shadcn/ui導入
- [ ] 基本レイアウト（ヘッダー、ボトムバー、FAB）

---

## Phase 1-2: 認証機能

- [ ] ログイン Server Action（JWT発行、Cookie設定）
- [ ] ログアウト Server Action
- [ ] セッション取得ユーティリティ
- [ ] ログイン画面UI
- [ ] 新規登録画面UI
- [ ] 初期ユーザー作成（当初は prisma/seed.ts。D1 移行時に廃止）

---

## Phase 1-3: コア機能（自分の貸借管理）

- [ ] Partner作成 Server Action
- [ ] Transaction作成 Server Action
- [ ] ホーム画面（残高タブ）Server Component
- [ ] 取引登録モーダル
- [ ] 取引履歴画面

---

## Phase 1-4: MVP完成

- [ ] ホーム画面（履歴タブ）
- [ ] 設定画面
- [ ] 説明サジェスト機能

---

## Phase 2: 機能拡張

- [ ] 全額精算機能
- [ ] 取引タイプ（LEND/BORROW/REPAYMENT）追加
- [ ] 複数人での割り勘機能
- [ ] CSVエクスポート機能

---

## Phase 3: UX向上

- [ ] 通知機能（PWA Push）
- [ ] グラフ表示
