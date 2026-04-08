import { redirect } from "next/navigation";
import { getCurrentUser } from "@/actions/auth";
import { PageHeader } from "@/components/layouts/page-header";
import {
  BookOpen,
  ArrowLeftRight,
  Archive,
  Users,
  HandCoins,
  BarChart2,
  Share2,
  Settings,
} from "lucide-react";

export default async function HelpPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <div className="flex flex-col">
      <PageHeader title="ヘルプ" description="ツケカンの使い方" />
      <main className="px-4 pt-4 pb-20 md:pb-4 space-y-4">
        {/* ツケカンとは */}
        <section>
          <h2 className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1.5">
            <BookOpen className="h-3.5 w-3.5" />
            ツケカンとは
          </h2>
          <div className="bg-card rounded-lg border border-border p-4 space-y-1.5">
            <p className="text-sm">
              友人や家族との間のお金の貸し借りを、自分ひとりで記録・管理するアプリです。
            </p>
            <p className="text-sm text-muted-foreground">
              誰にいくら貸したか・借りたかをサクッとメモして、残高をいつでも確認できます。
            </p>
          </div>
        </section>

        {/* 基本的な使い方 */}
        <section>
          <h2 className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1.5">
            <ArrowLeftRight className="h-3.5 w-3.5" />
            基本的な使い方
          </h2>
          <div className="bg-card rounded-lg border border-border overflow-hidden">
            <div className="flex items-start gap-3 p-4 border-b border-border">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold">
                1
              </span>
              <div>
                <div className="text-sm font-medium">相手を登録する</div>
                <div className="text-sm text-muted-foreground">
                  「相手」ページで貸し借りをする相手を追加します。
                </div>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 border-b border-border">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold">
                2
              </span>
              <div>
                <div className="text-sm font-medium">取引を記録する</div>
                <div className="text-sm text-muted-foreground">
                  「取引」ページで貸した・借りたを入力します。
                </div>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold">
                3
              </span>
              <div>
                <div className="text-sm font-medium">残高を確認する</div>
                <div className="text-sm text-muted-foreground">
                  「統計」ページで残高や累計金額をチェックします。
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 取引について */}
        <section>
          <h2 className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1.5">
            <ArrowLeftRight className="h-3.5 w-3.5" />
            取引について
          </h2>
          <div className="bg-card rounded-lg border border-border overflow-hidden">
            <div className="p-4 border-b border-border space-y-0.5">
              <div className="text-sm font-medium">貸し・借りの考え方</div>
              <div className="text-sm text-muted-foreground">
                「貸し」は相手にお金を貸したとき、「借り」は相手からお金を借りたときに選びます。
              </div>
            </div>
            <div className="p-4 border-b border-border space-y-0.5">
              <div className="text-sm font-medium">メモ</div>
              <div className="text-sm text-muted-foreground">
                任意で100文字以内のメモを残せます（例:「ランチ代」「映画チケット」）。過去に入力したメモがサジェストされるので入力が楽になります。
              </div>
            </div>
            <div className="p-4 space-y-0.5">
              <div className="text-sm font-medium">日時</div>
              <div className="text-sm text-muted-foreground">
                取引が発生した日時を記録できます。入力しない場合は現在の日時が使われます。
              </div>
            </div>
          </div>
        </section>

        {/* 取引のアーカイブ */}
        <section>
          <h2 className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1.5">
            <Archive className="h-3.5 w-3.5" />
            取引のアーカイブ
          </h2>
          <div className="bg-card rounded-lg border border-border overflow-hidden">
            <div className="p-4 border-b border-border space-y-0.5">
              <div className="text-sm font-medium">アーカイブとは</div>
              <div className="text-sm text-muted-foreground">
                アーカイブすると残高の計算対象から外れます。取引一覧にはグレーで表示され、フィルタで非表示にもできます。
              </div>
            </div>
            <div className="p-4 space-y-0.5">
              <div className="text-sm font-medium">削除との違い</div>
              <div className="text-sm text-muted-foreground">
                削除すると完全に消えますが、アーカイブは記録として残ります。アーカイブ解除すると再び計算対象に戻ります。
              </div>
            </div>
          </div>
        </section>

        {/* 相手の管理 */}
        <section>
          <h2 className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5" />
            相手の管理
          </h2>
          <div className="bg-card rounded-lg border border-border overflow-hidden">
            <div className="p-4 border-b border-border space-y-0.5">
              <div className="text-sm font-medium">追加・編集</div>
              <div className="text-sm text-muted-foreground">
                「相手」ページで貸し借りの相手を追加・編集できます。
              </div>
            </div>
            <div className="p-4 space-y-0.5">
              <div className="text-sm font-medium">相手のアーカイブ</div>
              <div className="text-sm text-muted-foreground">
                相手をアーカイブすると、その相手との取引がすべて一覧・統計から非表示になります。「もうこの人とのやり取りは終わった」というときに使うと便利です。アーカイブ解除で元に戻ります。
              </div>
            </div>
          </div>
        </section>

        {/* 精算 */}
        <section>
          <h2 className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1.5">
            <HandCoins className="h-3.5 w-3.5" />
            精算
          </h2>
          <div className="bg-card rounded-lg border border-border overflow-hidden">
            <div className="p-4 border-b border-border space-y-0.5">
              <div className="text-sm font-medium">精算のやり方</div>
              <div className="text-sm text-muted-foreground">
                「相手」ページから精算できます。精算すると、現在の残高をゼロにする取引が自動で作成されます。
              </div>
            </div>
            <div className="p-4 space-y-0.5">
              <div className="text-sm font-medium">精算後の取引</div>
              <div className="text-sm text-muted-foreground">
                例えば相手に500円貸している状態で精算すると、500円借りた取引が自動で作られて残高がゼロになります。作られた取引は通常の取引と同じなので、後から編集やアーカイブもできます。
              </div>
            </div>
          </div>
        </section>

        {/* 統計の見方 */}
        <section>
          <h2 className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1.5">
            <BarChart2 className="h-3.5 w-3.5" />
            統計の見方
          </h2>
          <div className="bg-card rounded-lg border border-border overflow-hidden">
            <div className="p-4 border-b border-border space-y-0.5">
              <div className="text-sm font-medium">相手タブ</div>
              <div className="text-sm text-muted-foreground">
                相手ごとの現在残高・累計の貸した金額・累計の借りた金額・取引回数を確認できます。
              </div>
            </div>
            <div className="p-4 border-b border-border space-y-0.5">
              <div className="text-sm font-medium">全体タブ</div>
              <div className="text-sm text-muted-foreground">
                すべての相手を合計した現在残高・累計の貸した金額・累計の借りた金額を確認できます。
              </div>
            </div>
            <div className="p-4 space-y-0.5">
              <div className="text-sm font-medium">集計対象</div>
              <div className="text-sm text-muted-foreground">
                アーカイブ済みの取引・相手は統計に含まれません。
              </div>
            </div>
          </div>
        </section>

        {/* 共有リンク */}
        <section>
          <h2 className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1.5">
            <Share2 className="h-3.5 w-3.5" />
            共有リンク
          </h2>
          <div className="bg-card rounded-lg border border-border overflow-hidden">
            <div className="p-4 border-b border-border space-y-0.5">
              <div className="text-sm font-medium">共有リンクとは</div>
              <div className="text-sm text-muted-foreground">
                「相手」ページから共有リンクを発行できます。リンクを知っている人はログインなしでその相手との残高と取引履歴を見ることができます。
              </div>
            </div>
            <div className="p-4 border-b border-border space-y-0.5">
              <div className="text-sm font-medium">有効期限・再生成</div>
              <div className="text-sm text-muted-foreground">
                有効期限は90日間です。リンクを再生成すると古いリンクは無効になります。
              </div>
            </div>
            <div className="p-4 space-y-0.5">
              <div className="text-sm font-medium">プライバシー</div>
              <div className="text-sm text-muted-foreground">
                共有ページにはアカウント名やメールアドレスは表示されません。
              </div>
            </div>
          </div>
        </section>

        {/* アカウント設定 */}
        <section>
          <h2 className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1.5">
            <Settings className="h-3.5 w-3.5" />
            アカウント設定
          </h2>
          <div className="bg-card rounded-lg border border-border p-4 space-y-0.5">
            <div className="text-sm text-muted-foreground">
              設定ページで表示名・パスワード・テーマ（ダーク/ライト）を変更できます。
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
