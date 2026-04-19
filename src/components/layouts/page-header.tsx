import type { ReactNode } from "react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

type Props = {
  title: string;
  description?: string;
  action?: ReactNode;
  backHref?: string;
};

export function PageHeader({ title, description, action, backHref }: Props) {
  return (
    <header className="fixed top-0 left-0 right-0 z-40 border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="mx-auto flex min-h-14 w-full max-w-lg items-center justify-between px-4 py-2">
        <div className="flex items-center gap-1 min-w-0">
          {backHref && (
            <Link
              href={backHref}
              className="shrink-0 -ml-1 p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              aria-label="戻る"
            >
              <ChevronLeft className="h-5 w-5" />
            </Link>
          )}
          <div className="min-w-0">
            <h1 className="font-bold leading-tight mb-1.5">{title}</h1>
            {description && (
              <p className="text-xs text-muted-foreground">{description}</p>
            )}
          </div>
        </div>
        {action}
      </div>
    </header>
  );
}
