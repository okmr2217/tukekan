"use client";

import { useSyncExternalStore } from "react";
import { CircleCheck, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

/**
 * ホーム画面に追加（PWA としてインストール）する案内。`/app` のページとオンボーディングの
 * 最初のステップで共有する。判定と手順の構成は clipnote の案内（pwa-install-guide.tsx）にならう。
 */

export type InstallPlatform = "iosSafari" | "iosChrome" | "androidChrome";

/** Chromium 系だけが投げるイベント。標準の型定義にはないので必要な分だけ書く */
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

type InstallState = {
  /** サーバー描画とハイドレーション中は false（UA や表示モードはブラウザでしか分からない） */
  ready: boolean;
  /** UA から粗く判定した環境。初期表示のタブを決めるだけなので、外れても利用者が切り替えられる。PC は null */
  platform: InstallPlatform | null;
  /** ホーム画面アプリとして開いている、またはこのページでインストールした */
  installed: boolean;
  /** `beforeinstallprompt` を受け取れたときだけ入る（iOS では常に null） */
  prompt: BeforeInstallPromptEvent | null;
};

const SERVER_STATE: InstallState = { ready: false, platform: null, installed: false, prompt: null };

let state = SERVER_STATE;
const listeners = new Set<() => void>();

function update(patch: Partial<InstallState>) {
  state = { ...state, ...patch };
  listeners.forEach((listener) => listener());
}

function detectPlatform(): InstallPlatform | null {
  const ua = navigator.userAgent;
  if (/android/i.test(ua)) return "androidChrome";
  // iPadOS は Mac の UA を名乗るため、タッチ対応で見分ける
  const ios = /iPhone|iPad|iPod/.test(ua) || (ua.includes("Macintosh") && navigator.maxTouchPoints > 1);
  if (ios) return /CriOS/.test(ua) ? "iosChrome" : "iosSafari";
  return null;
}

function isStandalone() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

// `beforeinstallprompt` はページの読み込み直後に来ることがあるため、コンポーネントのマウントを待たずに
// モジュールの読み込み時点で受け始める
if (typeof window !== "undefined") {
  state = { ready: true, platform: detectPlatform(), installed: isStandalone(), prompt: null };
  window.addEventListener("beforeinstallprompt", (event) => {
    // ブラウザ既定のミニ情報バーは出さず、ページ内のボタンから出す
    event.preventDefault();
    update({ prompt: event as BeforeInstallPromptEvent });
  });
  window.addEventListener("appinstalled", () => update({ installed: true, prompt: null }));
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function usePwaInstall() {
  const current = useSyncExternalStore(
    subscribe,
    () => state,
    () => SERVER_STATE,
  );

  /** インストールのダイアログを出す。`prompt()` は1イベント1回しか呼べないため、結果にかかわらず捨てる */
  async function install() {
    const event = state.prompt;
    if (!event) return;
    update({ prompt: null });
    await event.prompt();
    const { outcome } = await event.userChoice;
    if (outcome === "accepted") update({ installed: true });
  }

  return {
    ready: current.ready,
    platform: current.platform,
    installed: current.installed,
    canInstall: current.prompt !== null,
    install,
  };
}

type PlatformGuide = {
  label: string;
  requirement: string;
  steps: string[];
};

const RELOGIN_STEP =
  "ホーム画面のツケカンから開き、ログインし直します（ブラウザとはログイン状態が分かれています）";

const GUIDES: Record<InstallPlatform, PlatformGuide> = {
  iosSafari: {
    label: "iPhone・Safari",
    requirement: "iPhone・iPad に最初から入っている Safari で開いてください。",
    steps: [
      "Safari でツケカンを開きます",
      "画面下の共有ボタン（四角から矢印が出たアイコン）をタップします。iOS 26 以降はアドレスバー右の「…」から「共有」を選びます",
      "メニューを下にスクロールして「ホーム画面に追加」を選びます",
      "「Webアプリとして開く」はオンのまま、右上の「追加」をタップします",
      RELOGIN_STEP,
    ],
  },
  iosChrome: {
    label: "iPhone・Chrome",
    requirement: "iOS 16.4 以降の Chrome で使えます。",
    steps: [
      "Chrome でツケカンを開きます",
      "アドレスバー右端の共有ボタンをタップします",
      "メニューから「ホーム画面に追加」を選びます",
      "右上の「追加」をタップします",
      RELOGIN_STEP,
    ],
  },
  androidChrome: {
    label: "Android・Chrome",
    requirement: "Android の Chrome で開いてください。",
    steps: [
      "Chrome でツケカンを開きます",
      "画面下に「アプリをインストール」が出たらタップします。出ないときは右上の︙をタップします",
      "「ホーム画面に追加」を選びます",
      "「インストール」をタップします",
      "ホーム画面またはアプリ一覧のツケカンから開きます",
    ],
  },
};

const PLATFORMS = Object.keys(GUIDES) as InstallPlatform[];

/**
 * 環境ごとの手順。タブの初期値は検出した環境（PC などで分からなければ iPhone・Safari）。
 * `compact` はオンボーディング用の詰めた表示（「前提」の一文を省き、カード枠を外す）。
 */
export function PwaPlatformSteps({
  platform,
  compact = false,
}: {
  platform: InstallPlatform | null;
  compact?: boolean;
}) {
  return (
    // 検出結果はハイドレーション後に入るので、変わったらタブを選び直す
    <Tabs key={platform ?? "none"} defaultValue={platform ?? "iosSafari"}>
      <TabsList className="w-full" aria-label="お使いの端末">
        {PLATFORMS.map((key) => (
          <TabsTrigger key={key} value={key} className="text-xs">
            {GUIDES[key].label}
            {key === platform && <span className="sr-only">（お使いの環境）</span>}
          </TabsTrigger>
        ))}
      </TabsList>
      {PLATFORMS.map((key) => {
        const guide = GUIDES[key];
        return (
          <TabsContent
            key={key}
            value={key}
            className={cn("space-y-3", !compact && "rounded-xl border bg-card p-4 shadow-sm")}
          >
            {!compact && (
              <p className="text-xs text-muted-foreground">
                {key === platform && (
                  <span className="mr-1.5 font-medium text-primary">お使いの環境</span>
                )}
                {guide.requirement}
              </p>
            )}
            <ol className="space-y-2.5">
              {guide.steps.map((step, index) => (
                <li key={step} className="flex gap-2.5 text-sm leading-relaxed">
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary tabular-nums">
                    {index + 1}
                  </span>
                  <span className="pt-0.5">{step}</span>
                </li>
              ))}
            </ol>
          </TabsContent>
        );
      })}
    </Tabs>
  );
}

/** インストール済みの表示 */
export function InstalledNotice() {
  return (
    <p
      role="status"
      className="flex items-center gap-2 rounded-xl bg-primary/10 px-4 py-3 text-sm font-medium"
    >
      <CircleCheck className="h-4 w-4 shrink-0 text-primary" />
      ホーム画面のアプリとして開いています
    </p>
  );
}

/** ページ内のインストールボタン（Chromium 系で `beforeinstallprompt` を受け取れたときだけ出す） */
export function InstallButton({ onClick }: { onClick: () => void }) {
  return (
    <Button type="button" className="w-full" onClick={onClick}>
      <Download className="h-4 w-4" />
      アプリをインストール
    </Button>
  );
}

/** `/app` ページ用の組み立て。インストール済みの表示かインストールボタン、続けて手順 */
export function PwaInstallGuide() {
  const { ready, platform, installed, canInstall, install } = usePwaInstall();

  return (
    <div className="space-y-4">
      {installed && <InstalledNotice />}
      {!installed && canInstall && <InstallButton onClick={() => void install()} />}
      {ready && !platform && !installed && (
        <p className="text-sm text-muted-foreground">
          スマートフォンでツケカンを開き、次の手順で追加できます。
        </p>
      )}
      <PwaPlatformSteps platform={platform} />
    </div>
  );
}
