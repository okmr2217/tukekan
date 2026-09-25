import type { ReactNode } from "react";

type Props = {
  title: string;
  /** 見出しの下に添える一言 */
  description?: ReactNode;
  /** 見出しの右端に置くリンクなど */
  action?: ReactNode;
  children: ReactNode;
};

/** 統計ページのセクション。見出しは相手ページと同じ小さな大文字の見出しにそろえる */
export function StatsSection({ title, description, action, children }: Props) {
  return (
    <section>
      <div className="mb-2 flex items-end justify-between gap-2">
        <div className="min-w-0">
          <h2 className="text-xs font-medium tracking-widest text-muted-foreground uppercase">
            {title}
          </h2>
          {description && (
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              {description}
            </p>
          )}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

/** 「12日」「3ヶ月」「1年2ヶ月」のような大まかな長さ。2ヶ月未満は日数で出す */
export function formatDuration(days: number): string {
  const d = Math.max(0, Math.round(days));
  if (d < 60) return `${d}日`;
  if (d < 365) return `${Math.floor(d / 30)}ヶ月`;
  const years = Math.floor(d / 365);
  const months = Math.floor((d % 365) / 30);
  return months > 0 ? `${years}年${months}ヶ月` : `${years}年`;
}
