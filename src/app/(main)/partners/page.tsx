import { redirect } from "next/navigation";

/**
 * 相手の一覧はホーム（/）に統合した。
 * 古いブックマークやリンクのためにリダイレクトだけ残している。
 */
export default function PartnersPage() {
  redirect("/");
}
