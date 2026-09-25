import Link from "next/link";
import { ChevronLeft } from "lucide-react";

type Props = {
  title: string;
  description: React.ReactNode;
  /** 前のステップ。最初のステップでは渡さない */
  backHref?: string;
  children: React.ReactNode;
};

/** オンボーディングの各ステップの見出しと本文 */
export function OnboardingStep({ title, description, backHref, children }: Props) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        {backHref && (
          <Link
            href={backHref}
            className="-ml-1 inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="h-4 w-4" />
            戻る
          </Link>
        )}
        <h1 className="text-xl font-bold">{title}</h1>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {description}
        </p>
      </div>
      {children}
    </div>
  );
}
