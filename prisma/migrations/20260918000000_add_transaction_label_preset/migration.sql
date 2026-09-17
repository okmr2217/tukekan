-- 取引フォームの金額ボタンに表示する名目ラベルのプリセットをアカウントごとに保持する。
-- "BOTH"     : 貸した・返済した / 借りた・返済された（既定）
-- "LENDER"   : 貸した / 返済された（よく貸す人向け）
-- "BORROWER" : 返済した / 借りた（よく借りる人向け）
-- 符号の意味は変わらず、表示ラベルと初期選択だけが変わる。

-- AlterTable
ALTER TABLE "Account" ADD COLUMN "transactionLabelPreset" TEXT NOT NULL DEFAULT 'BOTH';
