import type { ReactNode } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

/*
 * LP のセクションの共通の枠と見出し。
 * 幅は Clipnote の LP と同じ 1160px。スマホでは左右16pxの余白にする。
 */

export function LpSection({
  id,
  tinted = false,
  className,
  children,
}: {
  id?: string;
  /** 背景を薄く敷いて、前後のセクションと区切る */
  tinted?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      className={cn(tinted && "border-y border-border bg-muted/40")}
    >
      <div
        className={cn(
          "mx-auto max-w-[1160px] px-4 py-16 md:px-8 md:py-24",
          className,
        )}
      >
        {children}
      </div>
    </section>
  );
}

/** セクションの見出し。lines は見出しの改行位置（スマホでもこの位置で折り返す） */
export function LpHeading({
  lines,
  eyebrow,
  align = "left",
  className,
}: {
  lines: string[];
  /** 見出しの上に添える小さなラベル */
  eyebrow?: string;
  align?: "left" | "center";
  className?: string;
}) {
  return (
    <div className={cn(align === "center" && "text-center", className)}>
      {eyebrow && (
        <p className="mb-3 text-xs font-bold tracking-widest text-primary">
          {eyebrow}
        </p>
      )}
      <h2 className="text-[26px] leading-[1.4] font-extrabold tracking-tight text-foreground md:text-[34px]">
        {lines.map((line, i) => (
          <span key={line}>
            {i > 0 && <br />}
            {line}
          </span>
        ))}
      </h2>
    </div>
  );
}

/** 見出しの下の本文 */
export function LpBody({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <p
      className={cn(
        "text-[15px] leading-[1.9] text-muted-foreground md:text-base",
        className,
      )}
    >
      {children}
    </p>
  );
}

/** ロゴ。ログイン画面と同じく「ツケ」をオレンジ、「カン」をエメラルドにする */
export function LpLogo({ size = "md" }: { size?: "md" | "lg" }) {
  const icon = size === "lg" ? 40 : 32;
  return (
    <span className="flex items-center gap-1">
      <Image src="/icon-192.png" alt="" width={icon} height={icon} />
      <span
        className={cn(
          "font-logo tracking-tight text-primary",
          size === "lg" ? "text-3xl" : "text-2xl",
        )}
      >
        <span className="text-[#e07326]">ツケ</span>カン
      </span>
    </span>
  );
}
