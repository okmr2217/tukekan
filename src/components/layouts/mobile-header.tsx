import type { ReactNode } from "react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

type Props = {
  title: string;
  action?: ReactNode;
  backHref?: string;
};

export function MobileHeader({ title, action, backHref }: Props) {
  return (
    <header className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur-sm">
      <div className="flex h-[52px] items-center gap-1 px-4 max-w-lg mx-auto">
        <div className="flex items-center gap-1 min-w-0 flex-1">
          {backHref && (
            <Link
              href={backHref}
              className="shrink-0 -ml-1 p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              aria-label="戻る"
            >
              <ChevronLeft className="h-5 w-5" />
            </Link>
          )}
          <h1 className="font-semibold leading-tight truncate">{title}</h1>
        </div>
        {action}
      </div>
    </header>
  );
}
