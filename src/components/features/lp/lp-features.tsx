import {
  Archive,
  BellRing,
  FileSearch,
  Search,
  Smartphone,
  WalletCards,
} from "lucide-react";
import { LpHeading, LpSection } from "./lp-section";

const FEATURES = [
  {
    icon: WalletCards,
    title: "口座",
    subcopy: "立て替えと、まとまった貸し借りを別々に。",
    body: "1人の相手との貸し借りを口座に分けて、残高も利子も別々に管理できます。",
  },
  {
    icon: Search,
    title: "検索・絞り込み",
    subcopy: "あの日の「ランチ」、すぐ見つかる。",
    body: "用途・メモで検索、相手で絞り込み、金額順にも並べ替えられます。",
  },
  {
    icon: Archive,
    title: "アーカイブ",
    subcopy: "消さずに、片付ける。",
    body: "取引も相手も、アーカイブならいつでも元に戻せます。",
  },
  {
    icon: FileSearch,
    title: "取引の詳細",
    subcopy: "この取引で、残高がどう変わったか。",
    body: "取引をタップすると、取引の前と後の残高を確かめられます。",
  },
  {
    icon: BellRing,
    title: "動きのない貸し借り",
    subcopy: "忘れかけたツケに、気づける。",
    body: "残高が残ったまま60日以上取引がない相手が、統計に出ます。",
  },
  {
    icon: Smartphone,
    title: "ホーム画面に追加",
    subcopy: "アプリみたいに、すぐ開ける。",
    body: "iPhone・Android のホーム画面に追加できます。インストールはいりません。",
  },
] as const;

/** ほかの機能の一言紹介。訴求の主力ではなく「一応紹介しておく」位置づけ（docs/13-lp-draft.md 8章） */
export function LpFeatures() {
  return (
    <LpSection>
      <LpHeading lines={["そのほかの機能"]} align="center" />
      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map(({ icon: Icon, title, subcopy, body }) => (
          <div key={title} className="flex flex-col gap-3 rounded-3xl border bg-card p-6">
            <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Icon className="size-5" />
            </span>
            <div>
              <h3 className="text-sm font-bold text-foreground">{title}</h3>
              <p className="mt-0.5 text-xs font-semibold text-primary">{subcopy}</p>
            </div>
            <p className="text-xs leading-[1.7] text-muted-foreground">{body}</p>
          </div>
        ))}
      </div>
    </LpSection>
  );
}
