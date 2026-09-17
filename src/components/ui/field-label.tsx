"use client";

import * as React from "react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type Props = React.ComponentProps<typeof Label> & {
  /** 必須項目なら平常時にラベル右へ「必須」チップを出す */
  required?: boolean;
  /** バリデーションエラー文言。あるときは「必須」チップと差し替えて赤字で表示する */
  error?: string;
};

/**
 * ラベル右端の同じ枠を「必須」チップとエラー文言で使い回すフィールドラベル。
 * 差し替え方式なのでエラー表示でレイアウトがずれない。
 */
export function FieldLabel({
  required = false,
  error,
  className,
  children,
  ...props
}: Props) {
  return (
    <div className="flex items-baseline justify-between gap-2">
      <Label className={className} {...props}>
        {children}
      </Label>
      {(error || required) && (
        <span
          className={cn(
            "shrink-0 text-xs leading-none",
            error ? "font-medium text-destructive" : "text-muted-foreground/70",
          )}
        >
          {error ?? "必須"}
        </span>
      )}
    </div>
  );
}
