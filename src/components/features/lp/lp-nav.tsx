import Link from "next/link";
import { LpLogo } from "./lp-section";

/**
 * LP のナビ。未ログインなら「ログイン」と「無料ではじめる」、ログイン中は「アプリを開く」だけ。
 * セッションが切れた既存のユーザーも / に来るので、「ログイン」は必ず出す（docs/14-lp-visual-assets.md 12-1）。
 */
export function LpNav({ isLoggedIn }: { isLoggedIn: boolean }) {
  return (
    <header className="border-b border-border">
      <div className="mx-auto flex max-w-[1160px] items-center justify-between gap-3 px-4 py-4 md:px-8 md:py-5">
        <LpLogo />
        <nav className="flex items-center gap-1 md:gap-3">
          {isLoggedIn ? (
            <Link
              href="/home"
              className="rounded-lg bg-primary px-4 py-2 text-sm font-bold whitespace-nowrap text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 md:px-5 md:py-2.5"
            >
              アプリを開く
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-lg px-3 py-2 text-sm font-medium whitespace-nowrap text-muted-foreground transition-colors hover:text-foreground"
              >
                ログイン
              </Link>
              <Link
                href="/register"
                className="rounded-lg bg-primary px-4 py-2 text-sm font-bold whitespace-nowrap text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 md:px-5 md:py-2.5"
              >
                無料ではじめる
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

/** HERO と最終CTAのボタン。ログイン中は「アプリを開く」にする */
export function LpCtaButton({
  isLoggedIn,
  size = "md",
}: {
  isLoggedIn: boolean;
  size?: "md" | "lg";
}) {
  return (
    <Link
      href={isLoggedIn ? "/home" : "/register"}
      className={
        size === "lg"
          ? "inline-block rounded-2xl bg-primary px-11 py-5 text-[17px] font-bold text-primary-foreground shadow-lg shadow-primary/25 transition-colors hover:bg-primary/90"
          : "inline-block rounded-xl bg-primary px-[30px] py-[15px] text-[15px] font-bold text-primary-foreground shadow-lg shadow-primary/25 transition-colors hover:bg-primary/90"
      }
    >
      {isLoggedIn ? "アプリを開く" : "無料ではじめる"}
    </Link>
  );
}
