"use client";

import { useState } from "react";
import {
  ArrowRight,
  BarChart2,
  CircleHelp,
  Copy,
  Eye,
  MoreHorizontal,
  Plus,
  Settings,
  Settings2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toJST } from "@/lib/date-utils";
import {
  BalanceCard,
  buildLatestSummary,
} from "@/components/features/partner/balance-card";
import { TransactionCard } from "@/components/features/transaction/transaction-card";
import {
  ownerBalanceStatement,
  partnerBalanceStatement,
} from "@/lib/balance-wording";
import { MockAppHeader, MockHeaderIcon, PhoneFrame } from "./phone-frame";
import type { LpPartnerDemo } from "./demo-data";

/** 共有リンクの有効期限（発行から90日） */
const SHARE_LINK_DAYS = 90;
const DAY_MS = 24 * 60 * 60 * 1000;

type Props = {
  partner: LpPartnerDemo;
  ownerName: string;
  shareNote: string;
  now: Date;
};

type Viewer = "owner" | "partner";

/** 2台を並べる幅（lg）でも 1280px 未満では収まらないので、少し縮める */
const SIDE_BY_SIDE_ZOOM = "lg:max-xl:[zoom:0.9]";

/**
 * 共有リンクの「視点の反転」（docs/14-lp-visual-assets.md 7-1）。
 * 左に記録する人の画面（相手のページ）、右に相手が開く公開ページを並べ、間を「リンクを送る」でつなぐ。
 * 幅が狭いときは2台を並べられないので、切り替えタブで1台の中身を入れ替える。
 */
export function ShareScreens({ partner, ownerName, shareNote, now }: Props) {
  const [viewer, setViewer] = useState<Viewer>("owner");
  const viewers: Array<{ key: Viewer; label: string }> = [
    { key: "owner", label: `${ownerName}の画面` },
    { key: "partner", label: `${partner.name}さんの画面` },
  ];

  return (
    <div>
      <div
        role="tablist"
        aria-label="どちらの画面を見るか"
        className="mx-auto mb-5 flex max-w-[410px] rounded-xl bg-muted p-1 lg:hidden"
      >
        {viewers.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={viewer === key}
            onClick={() => setViewer(key)}
            className={cn(
              "flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              viewer === key
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="flex items-start justify-center gap-6 xl:gap-10">
        <div className={cn("w-fit lg:block", viewer !== "owner" && "hidden")}>
          <p className="mb-3 hidden text-center text-sm font-bold text-foreground lg:block">
            {ownerName}の画面
          </p>
          <PhoneFrame
            label={`${ownerName}の画面`}
            screenClassName="h-[640px]"
            className={SIDE_BY_SIDE_ZOOM}
          >
            <OwnerScreen partner={partner} shareNote={shareNote} now={now} />
          </PhoneFrame>
        </div>

        <SendLinkArrow />

        <div className={cn("w-fit lg:block", viewer !== "partner" && "hidden")}>
          <p className="mb-3 hidden text-center text-sm font-bold text-foreground lg:block">
            {partner.name}さんの画面（共有リンク）
          </p>
          <PhoneFrame
            label={`${partner.name}さんの画面（スクロールできます）`}
            screenClassName="h-[640px]"
            className={SIDE_BY_SIDE_ZOOM}
            scrollable
          >
            <PartnerScreen partner={partner} ownerName={ownerName} shareNote={shareNote} />
          </PhoneFrame>
        </div>
      </div>
    </div>
  );
}

/** 2台のあいだの「リンクを送る」。汎用のトーク画面風の吹き出しにURLが貼られている */
function SendLinkArrow() {
  return (
    <div className="hidden w-40 shrink-0 flex-col items-center gap-3 self-center lg:flex">
      <div className="w-full rounded-2xl border bg-card p-2.5 shadow-sm">
        <div className="ml-auto w-fit max-w-full rounded-2xl rounded-tr-sm bg-primary px-3 py-2 text-[11px] leading-snug text-primary-foreground">
          さっきのチケット代、ここで見られるよ
          <span className="mt-1 block underline underline-offset-2">
            tukekan.paritto.dev
            <br />
            /share/…
          </span>
        </div>
      </div>
      <p className="flex items-center gap-1 text-xs font-bold text-muted-foreground">
        リンクを送る
        <ArrowRight className="size-4" />
      </p>
    </div>
  );
}

function formatExpiry(date: Date): string {
  const jst = toJST(date);
  return `${jst.getFullYear()}年${jst.getMonth() + 1}月${jst.getDate()}日`;
}

/** 記録する人が見る相手のページ（/partners/[id]） */
function OwnerScreen({
  partner,
  shareNote,
  now,
}: {
  partner: LpPartnerDemo;
  shareNote: string;
  now: Date;
}) {
  const balance = partner.summary.balance;
  const expiresAt = new Date(now.getTime() + SHARE_LINK_DAYS * DAY_MS);

  return (
    <>
      <MockAppHeader
        title={partner.name}
        back
        actions={
          <>
            <MockHeaderIcon>
              <BarChart2 />
            </MockHeaderIcon>
            <MockHeaderIcon>
              <Settings />
            </MockHeaderIcon>
            <MockHeaderIcon>
              <CircleHelp />
            </MockHeaderIcon>
          </>
        }
      />
      <div className="space-y-5 px-4 pt-3 pb-4">
        <BalanceCard
          balance={balance}
          statement={ownerBalanceStatement(balance, partner.name)}
          latestSummary={buildLatestSummary(partner.transactions[0])}
          ledgers={partner.ledgers}
          ledgersAction={
            <span className="-mr-1 flex items-center gap-1 rounded-md px-2 py-1 text-[11px] text-muted-foreground">
              <Plus className="size-3.5" />
              追加
            </span>
          }
          renderLedgerAction={() => (
            <span className="shrink-0 rounded-md p-1.5 text-muted-foreground">
              <Settings2 className="size-4" />
            </span>
          )}
        />

        {/* 共有リンクのカード。実物は Server Action に依存するので見た目だけ */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs font-medium tracking-widest text-muted-foreground uppercase">
              共有
            </p>
            <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <CircleHelp className="size-3.5" />
              共有リンクの使い方
            </span>
          </div>
          <div className="rounded-2xl border bg-card p-4">
            <div className="flex items-center gap-2">
              <span className="flex h-9 flex-1 items-center justify-center gap-1.5 rounded-md bg-primary px-2.5 text-[13px] font-medium whitespace-nowrap text-primary-foreground ring-4 ring-primary/25 sm:text-sm">
                <Copy className="size-4" />
                リンクをコピー
              </span>
              <span className="flex h-9 flex-1 items-center justify-center gap-1.5 rounded-md border bg-background px-2.5 text-[13px] font-medium whitespace-nowrap shadow-xs sm:text-sm dark:border-input dark:bg-input/30">
                <Eye className="size-4" />
                プレビュー
              </span>
              {/* 枠が狭いとき（LPをスマホで見たとき）は収まらないので省く */}
              <span className="hidden size-9 shrink-0 items-center justify-center rounded-md border bg-background shadow-xs sm:flex dark:border-input dark:bg-input/30">
                <MoreHorizontal className="size-4" />
              </span>
            </div>
            <p className="mt-2 text-[11px] text-muted-foreground">
              有効期限：{formatExpiry(expiresAt)}まで
            </p>
            <div className="mt-4">
              <p className="mb-1.5 text-xs font-medium text-muted-foreground">共有メモ</p>
              <p className="rounded-lg border px-3 py-2 text-sm text-foreground">
                {shareNote}
              </p>
            </div>
          </div>
        </div>

        <div>
          <p className="mb-2 text-xs font-medium tracking-widest text-muted-foreground uppercase">
            取引一覧
          </p>
          <div className="space-y-2">
            {partner.transactions.map((t) => (
              <TransactionCard
                key={t.id}
                transaction={t}
                runningBalance={t.runningBalance}
                viewpoint="owner"
              />
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

/** 相手が開く公開ページ（/share/[token]）。言葉も色も相手の立場に入れ替わる */
function PartnerScreen({
  partner,
  ownerName,
  shareNote,
}: {
  partner: LpPartnerDemo;
  ownerName: string;
  shareNote: string;
}) {
  const balance = partner.summary.balance;

  return (
    <>
      <div className="sticky top-0 z-10 w-full border-b bg-background/95 backdrop-blur">
        <div className="flex min-h-14 flex-col justify-center px-4 py-2">
          <p className="mb-1.5 leading-tight font-medium">{partner.name}さんとの取引</p>
          <p className="text-xs text-muted-foreground">
            読み取り専用 · {partner.name}さんから見た表示 · アクセス時点のデータ
          </p>
        </div>
      </div>

      <div className="space-y-6 px-4 pt-3 pb-6">
        <BalanceCard
          balance={balance}
          statement={partnerBalanceStatement(balance, ownerName, partner.name)}
          ledgers={partner.ledgers}
          viewpoint="partner"
        />

        <div>
          <p className="mb-2 text-xs font-medium tracking-widest text-muted-foreground uppercase">
            {ownerName}さんからのメモ
          </p>
          <div className="rounded-xl border bg-card px-4 py-3.5 shadow-sm">
            <p className="text-sm break-words whitespace-pre-wrap text-foreground">
              {shareNote}
            </p>
          </div>
        </div>

        <div>
          <p className="mb-3 text-sm font-semibold text-muted-foreground">
            取引履歴（{partner.transactions.length}件）
          </p>
          <div className="space-y-2">
            {partner.transactions.map((t) => (
              <TransactionCard
                key={t.id}
                transaction={t}
                runningBalance={t.runningBalance}
                viewpoint="partner"
              />
            ))}
          </div>
        </div>

        <div className="space-y-3 rounded-lg border bg-card p-5 text-center shadow-sm">
          <p className="text-sm text-muted-foreground">友人間の貸し借りをかんたん管理</p>
          <span className="inline-flex w-full items-center justify-center rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow">
            ツケカンに無料登録する
          </span>
        </div>
      </div>
    </>
  );
}
