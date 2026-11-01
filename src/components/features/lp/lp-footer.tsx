import Link from "next/link";
import { LpCtaButton } from "./lp-nav";
import { LpLogo } from "./lp-section";

/** 最終CTA。CTAは HERO とここの2か所に絞る */
export function LpFinalCta({ isLoggedIn }: { isLoggedIn: boolean }) {
  return (
    <section className="border-t border-border">
      <div className="mx-auto max-w-[1160px] px-4 py-16 text-center md:px-8 md:py-24">
        <p className="text-[22px] leading-[1.5] font-extrabold tracking-tight text-foreground md:text-[28px]">
          <span className="text-[#e07326]">ツケ</span>は、
          <span className="text-primary">ツケカン</span>に。
        </p>
        <div className="mt-8">
          <LpCtaButton isLoggedIn={isLoggedIn} size="lg" />
        </div>
        {!isLoggedIn && (
          <p className="mt-5 text-[13px] leading-relaxed text-muted-foreground">
            登録はメールアドレスとパスワードだけ。最初の設定は4ステップで案内します。
          </p>
        )}
      </div>
    </section>
  );
}

/** フッター。利用規約・プライバシーポリシーはまだないので載せない */
export function LpFooter() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-[1160px] flex-wrap items-center justify-between gap-4 px-4 py-8 md:px-8">
        <div className="flex flex-col gap-1">
          <LpLogo />
          <p className="text-xs text-muted-foreground">ツケは、ツケカンに。</p>
        </div>
        <nav className="flex flex-wrap gap-x-6 gap-y-2">
          <Link
            href="/help"
            className="text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            使い方ガイド
          </Link>
          <Link
            href="/login"
            className="text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            ログイン
          </Link>
        </nav>
      </div>
    </footer>
  );
}
