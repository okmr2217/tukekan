import Link from "next/link";
import { CircleHelp } from "lucide-react";
import { userGuideHref, type UserGuideSlug } from "@/lib/user-guide-links";

/** ヘッダー右端に置く、その画面の使い方ガイドの記事へのリンク（docs/12-user-guide.md 12.5） */
export function GuideHeaderLink({ slug }: { slug: UserGuideSlug }) {
  return (
    <Link
      href={userGuideHref(slug)}
      aria-label="使い方ガイド"
      className="shrink-0 p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
    >
      <CircleHelp className="h-5 w-5" />
    </Link>
  );
}
