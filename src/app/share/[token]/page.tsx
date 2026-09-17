import type { Metadata } from "next";
import Link from "next/link";
import { getPartnerByShareToken } from "@/actions/partner";
import { SharedPartnerView } from "./shared-partner-view";

type Props = {
  params: Promise<{ token: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { token } = await params;
  const result = await getPartnerByShareToken(token);
  if (result.data) {
    return {
      title: `${result.data.partnerName}さんとの取引状況 - ツケカン`,
    };
  }
  return { title: "ツケカン" };
}

export default async function SharePage({ params }: Props) {
  const { token } = await params;
  const result = await getPartnerByShareToken(token);

  if (result.error || !result.data) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="text-center">
          <p className="text-4xl mb-4">🔗</p>
          <h1 className="text-xl font-semibold mb-2">
            このリンクは無効または期限切れです
          </h1>
          <p className="text-sm text-muted-foreground">
            リンクの発行者に新しいリンクを依頼してください。
          </p>
        </div>
      </div>
    );
  }

  const data = result.data;

  return (
    <div className="min-h-screen">
      {/* Page header */}
      <div className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
        <div className="mx-auto flex min-h-14 max-w-lg flex-col justify-center px-4 py-2">
          <h1 className="font-medium leading-tight mb-1.5">
            {data.partnerName}さんとの取引
          </h1>
          <p className="text-xs text-muted-foreground">
            読み取り専用 · {data.partnerName}さんから見た表示 · アクセス時点のデータ
          </p>
        </div>
      </div>

      <SharedPartnerView data={data} />

      <div className="mx-auto w-full max-w-lg px-4 pb-6 space-y-6">
        {/* Promotion */}
        <div className="rounded-lg border bg-card p-5 shadow-sm text-center space-y-3">
          <p className="text-sm text-muted-foreground">
            友人間の貸し借りをかんたん管理
          </p>
          <Link
            href="/register"
            className="inline-flex w-full items-center justify-center rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow hover:bg-primary/90 transition-colors"
          >
            ツケカンに無料登録する
          </Link>
          <a
            href="https://paritto-dev-diary.vercel.app/products/tukekan"
            target="_blank"
            rel="noopener noreferrer"
            className="block text-xs text-muted-foreground hover:text-foreground underline underline-offset-4 transition-colors"
          >
            ツケカンについて詳しく見る
          </a>
        </div>

        {/* Footer note */}
        <p className="text-center text-xs text-muted-foreground pb-4">
          ツケカン — 友人間の貸し借り管理アプリ
        </p>
      </div>
    </div>
  );
}
