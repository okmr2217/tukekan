import { redirect } from "next/navigation";

/**
 * 口座別の統計は全体の統計（/statistics）と相手ごとの統計（/partners/[id]/statistics）に統合した。
 * 古いブックマークやリンクのためにリダイレクトだけ残している。
 */
export default function AccountStatisticsPage() {
  redirect("/statistics");
}
