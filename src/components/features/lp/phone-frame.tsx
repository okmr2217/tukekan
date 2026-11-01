import type { ReactNode } from "react";
import { BarChart2, ChevronLeft, Home, List, Menu, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

/*
 * LP のモックアップに使うスマホ枠と、その中に置くアプリの部品（docs/14-lp-visual-assets.md 1-3）。
 *
 * 枠は角丸の太いベゼルだけ。特定の機種のノッチやステータスバーは真似せず、アプリのヘッダーから始める。
 * 中身はアプリと同じコンポーネントで描き、押しても動かないよう inert にする（中のスクロールだけは効く）。
 * アプリの BottomBar・FAB は画面に fixed で置かれるので、ここでは枠の中に収まる見た目だけを再現する。
 *
 * 画面の中身はいつも幅 390px で描き、LP の幅が足りないときは枠ごと縮小する（zoom）。
 * 中身を狭い幅で描き直すと、実物のスマホより窮屈な見た目になってしまうため。
 * 縮小率は、左右16pxの余白を引いた幅に枠（410px）が収まるよう段階的に決めている。
 * JS で測らないのは、描画直後に一瞬はみ出して見えるのを避けるため。
 */

const FRAME_ZOOM =
  "max-[441px]:[zoom:0.97] max-[429px]:[zoom:0.93] max-[413px]:[zoom:0.87] max-[389px]:[zoom:0.83] max-[374px]:[zoom:0.8] max-[359px]:[zoom:0.7]";

type PhoneFrameProps = {
  children: ReactNode;
  /** 画面の高さ。中身がこれより長ければ、scrollable のときだけ中をスクロールできる */
  screenClassName?: string;
  /** 中を縦にスクロールできるようにする（ホーム・公開ページ） */
  scrollable?: boolean;
  /** 下にボトムバーを出す。値はアクティブなタブ */
  bottomBar?: MockTab;
  /** 右下の「＋」を出す */
  fab?: boolean;
  /** スクロールできる枠の読み上げ用の名前 */
  label: string;
  className?: string;
};

export function PhoneFrame({
  children,
  screenClassName = "h-[600px]",
  scrollable = false,
  bottomBar,
  fab = false,
  label,
  className,
}: PhoneFrameProps) {
  return (
    <div
      className={cn(
        "mx-auto w-[410px] rounded-[2.75rem] border-[10px] border-zinc-900 bg-zinc-900 shadow-2xl shadow-zinc-900/20 dark:border-zinc-700 dark:bg-zinc-700 dark:shadow-black/40",
        FRAME_ZOOM,
        className,
      )}
    >
      <div
        className={cn(
          "relative overflow-hidden rounded-[2.1rem] bg-background",
          screenClassName,
        )}
      >
        <div
          role={scrollable ? "region" : undefined}
          aria-label={scrollable ? label : undefined}
          tabIndex={scrollable ? 0 : undefined}
          className={cn(
            "h-full",
            scrollable
              ? "overflow-y-auto overscroll-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              : "overflow-hidden",
            bottomBar && "pb-16",
          )}
        >
          <div inert>{children}</div>
        </div>
        {fab && <MockFab />}
        {bottomBar && <MockBottomBar active={bottomBar} />}
      </div>
    </div>
  );
}

/** アプリの MobileHeader と同じ見た目。リンクにはしない */
export function MockAppHeader({
  title,
  back = false,
  actions,
}: {
  title: string;
  back?: boolean;
  actions?: ReactNode;
}) {
  return (
    <header className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur-sm">
      <div className="flex h-[52px] items-center gap-1 px-4">
        <div className="flex min-w-0 flex-1 items-center gap-1">
          {back && (
            <span className="-ml-1 shrink-0 p-1 text-muted-foreground">
              <ChevronLeft className="h-5 w-5" />
            </span>
          )}
          <p className="truncate font-semibold leading-tight">{title}</p>
        </div>
        {actions && (
          <div className="-mr-1.5 flex shrink-0 items-center gap-0.5 text-muted-foreground">
            {actions}
          </div>
        )}
      </div>
    </header>
  );
}

/** ヘッダー右端のアイコン1つぶん */
export function MockHeaderIcon({ children }: { children: ReactNode }) {
  return <span className="p-1.5 [&_svg]:h-5 [&_svg]:w-5">{children}</span>;
}

type MockTab = "home" | "transactions" | "statistics" | "menu";

const TABS: Array<{ key: MockTab; label: string; icon: typeof Home }> = [
  { key: "home", label: "ホーム", icon: Home },
  { key: "transactions", label: "すべての取引", icon: List },
  { key: "statistics", label: "統計", icon: BarChart2 },
  { key: "menu", label: "メニュー", icon: Menu },
];

/** アプリの BottomBar と同じ見た目 */
function MockBottomBar({ active }: { active: MockTab }) {
  return (
    <div
      aria-hidden
      className="absolute inset-x-0 bottom-0 z-20 flex h-16 items-center justify-around border-t bg-background"
    >
      {TABS.map(({ key, label, icon: Icon }) => (
        <span
          key={key}
          className={cn(
            "flex flex-1 flex-col items-center justify-center gap-1 py-2 text-xs",
            key === active ? "text-primary" : "text-muted-foreground",
          )}
        >
          <Icon className="h-5 w-5" />
          <span>{label}</span>
        </span>
      ))}
    </div>
  );
}

/** アプリの FAB と同じ見た目 */
function MockFab() {
  return (
    <span
      aria-hidden
      className="absolute right-4 bottom-20 z-20 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg"
    >
      <Plus className="h-6 w-6" />
    </span>
  );
}
