import { BellOff, Link2, UserRound } from "lucide-react";

const ITEMS = [
  {
    icon: UserRound,
    title: "記録するのは、あなただけ",
    body: "相手の登録や了承はいりません",
  },
  {
    icon: BellOff,
    title: "相手に通知はいきません",
    body: "こっそりつけておける、自分用の記録です",
  },
  {
    icon: Link2,
    title: "見せたいときだけ、リンクで",
    body: "送った相手だけが、ログインなしで見られます",
  },
] as const;

/**
 * 考え方の帯。「相手を巻き込まないと使えないのでは」という不安を先回りして消す
 * （docs/13-lp-draft.md 0-5・2章）。
 */
export function LpPrinciples() {
  return (
    <section className="border-y border-border bg-muted/40">
      <ul className="mx-auto grid max-w-[1160px] grid-cols-1 gap-6 px-4 py-10 md:grid-cols-3 md:gap-8 md:px-8 md:py-12">
        {ITEMS.map(({ icon: Icon, title, body }) => (
          <li key={title} className="flex items-start gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Icon className="size-5" />
            </span>
            <div className="min-w-0">
              <p className="text-[15px] font-bold text-foreground">{title}</p>
              <p className="mt-0.5 text-[13px] leading-relaxed text-muted-foreground">
                {body}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
