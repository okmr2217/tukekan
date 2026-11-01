import { cn } from "@/lib/utils";
import { toJST } from "@/lib/date-utils";
import { FieldLabel } from "@/components/ui/field-label";
import { Label } from "@/components/ui/label";
import {
  AMOUNT_SIDE_BASE,
  AMOUNT_SIDE_CLASSES,
} from "@/components/features/transaction/transaction-tone";
import type { TransactionLabelOption } from "@/lib/transaction-labels";

/*
 * 「新しい取引」フォームの見た目だけを再現したもの。
 * 実物（TransactionModal）は react-hook-form と Server Action に依存するので、
 * 同じクラス名で組み直している（docs/14-lp-visual-assets.md 1-1）。
 */

/** 金額の下の2つのボタン。並びはいつも「渡した」が左、「受け取った」が右 */
export function MockSideButtons({
  option,
  isLending,
  className,
}: {
  option: TransactionLabelOption;
  isLending: boolean;
  className?: string;
}) {
  return (
    <div className="flex gap-2">
      <span
        className={cn(
          AMOUNT_SIDE_BASE,
          "text-center whitespace-nowrap",
          className,
          isLending
            ? AMOUNT_SIDE_CLASSES.lending.selected
            : AMOUNT_SIDE_CLASSES.lending.unselected,
        )}
      >
        {option.lendingLabel}
      </span>
      <span
        className={cn(
          AMOUNT_SIDE_BASE,
          "text-center whitespace-nowrap",
          className,
          !isLending
            ? AMOUNT_SIDE_CLASSES.borrowing.selected
            : AMOUNT_SIDE_CLASSES.borrowing.unselected,
        )}
      >
        {option.borrowingLabel}
      </span>
    </div>
  );
}

/** 相手のボタン（PartnerPickerField と同じ見た目） */
export function MockPartnerChip({
  name,
  selected,
}: {
  name: string;
  selected: boolean;
}) {
  return (
    <span
      className={cn(
        "truncate rounded-xl border px-3 py-2 text-center text-sm font-medium",
        selected
          ? "border-primary/40 bg-primary/10 text-primary"
          : "border-transparent bg-muted text-foreground/80",
      )}
    >
      {name}
    </span>
  );
}

/** 入力欄の見た目（Input と同じ枠） */
function MockInput({
  children,
  focused = false,
}: {
  children: React.ReactNode;
  focused?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex h-9 w-full items-center rounded-md border border-input bg-transparent px-3 text-sm shadow-xs dark:bg-input/30",
        focused && "border-ring ring-[3px] ring-ring/50",
      )}
    >
      {children}
    </div>
  );
}

function hoursMinutesJst(date: Date): string {
  const jst = toJST(date);
  return `${String(jst.getHours()).padStart(2, "0")}:${String(jst.getMinutes()).padStart(2, "0")}`;
}

type Annotation = 1 | 2 | 3;

/** 注釈の番号。枠の外の説明と対応させる */
export function AnnotationMark({ n, className }: { n: Annotation; className?: string }) {
  return (
    <span
      className={cn(
        "flex size-5 shrink-0 items-center justify-center rounded-full bg-foreground text-[11px] font-bold text-background",
        className,
      )}
    >
      {n}
    </span>
  );
}

/**
 * スマホで画面の下から開いた「新しい取引」。
 * 健太が選ばれ、¥3,000 を入れて、用途の候補リストが開いて「麻雀」にカーソルが乗っている瞬間。
 * メモ欄は省く（必ず入れるのは相手と金額だけ、を見せたいので）。
 */
export function MockTransactionSheet({
  partners,
  option,
  suggestions,
  now,
}: {
  partners: string[];
  option: TransactionLabelOption;
  suggestions: string[];
  now: Date;
}) {
  return (
    <div className="flex h-full flex-col bg-black/40">
      {/* シートの上に、後ろのホームが少しだけ見えている */}
      <div className="h-10 shrink-0" />
      <div className="flex min-h-0 flex-1 flex-col rounded-t-[10px] border-t bg-background">
        <div className="mx-auto mt-4 h-2 w-[100px] shrink-0 rounded-full bg-muted" />
        <p className="px-4 pt-3 pb-2 text-center font-semibold">新しい取引</p>

        <div className="space-y-5 px-4 pb-2">
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5">
              <AnnotationMark n={1} />
              <div className="flex-1"><FieldLabel required>相手</FieldLabel></div>
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {partners.map((name, i) => (
                <MockPartnerChip key={name} name={name} selected={i === 0} />
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5">
              <AnnotationMark n={2} />
              <div className="flex-1"><FieldLabel required>金額</FieldLabel></div>
            </div>
            <MockInput>
              <span className="mr-2 text-muted-foreground">¥</span>
              <span className="tabular-nums">3000</span>
            </MockInput>
            <MockSideButtons option={option} isLending={option.defaultIsLending} />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5">
              <AnnotationMark n={3} />
              <div className="flex-1"><Label>用途</Label></div>
            </div>
            <MockInput focused>
              <span className="mr-px h-4 w-px animate-pulse bg-foreground motion-reduce:animate-none" />
              <span className="text-muted-foreground">例: 麻雀、ランチ、返済</span>
            </MockInput>
            {/* 実物は入力欄の下に重ねて開くリスト。モックでは下の欄を押し下げて置く */}
            <ul className="rounded-md border border-border bg-popover shadow-md">
              {suggestions.map((s) => (
                <li
                  key={s}
                  className={cn(
                    "px-3 py-2 text-sm",
                    s === "麻雀" && "bg-accent text-accent-foreground",
                  )}
                >
                  {s}
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-1.5">
            <Label>日時</Label>
            <div className="flex gap-2">
              <span className="flex-1 rounded-lg bg-primary px-3 py-2 text-center text-xs font-medium text-primary-foreground">
                現在 ({hoursMinutesJst(now)})
              </span>
              <span className="flex-1 rounded-lg bg-muted px-3 py-2 text-center text-xs font-medium text-muted-foreground">
                日時を指定
              </span>
            </div>
          </div>
        </div>

        <div className="mt-auto border-t px-4 py-3">
          <span className="flex h-9 w-full items-center justify-center rounded-md bg-primary text-sm font-medium text-primary-foreground">
            登録
          </span>
        </div>
      </div>
    </div>
  );
}
