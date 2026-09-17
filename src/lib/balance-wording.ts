/**
 * 残高の説明文と色。
 *
 * 残高（balance）は常に「記録者（オーナー）視点」で保存されている。
 *   balance > 0 : オーナーの債権（相手が借りている）
 *   balance < 0 : オーナーの債務（オーナーが借りている）
 *
 * 表示は「そのページを見ている人」の視点に揃える。
 *   - 口座の取引一覧ページ : 見ているのはオーナー本人
 *   - 公開URLのページ     : 見ているのは相手
 *
 * 色は常に「見ている人にとって債権なら緑 / 債務なら赤」で一貫させる。
 * アプリ内の取引カードや残高表示も同じ規約（+ = 緑 / - = 赤）。
 */

export type BalanceTone = "credit" | "debt" | "settled";

export type BalanceStatement = {
  /** 見ている人から見た債権/債務。そのまま色に対応する */
  tone: BalanceTone;
  /** 残高カードに出す説明文 */
  message: string;
};

/** オーナー本人が見るときの表現 */
export function ownerBalanceStatement(
  balance: number,
  partnerName: string,
): BalanceStatement {
  if (balance === 0) {
    return { tone: "settled", message: `${partnerName}さんとは精算済みです` };
  }
  if (balance > 0) {
    return { tone: "credit", message: `${partnerName}さんから受け取ります` };
  }
  return { tone: "debt", message: `${partnerName}さんに返します` };
}

/** 公開URLで相手が見るときの表現 */
export function partnerBalanceStatement(
  balance: number,
  ownerName: string,
  partnerName: string,
): BalanceStatement {
  if (balance === 0) {
    return {
      tone: "settled",
      message: `${partnerName}さんと${ownerName}さんは精算済みです`,
    };
  }
  if (balance > 0) {
    // オーナーの債権 = 相手の債務
    return {
      tone: "debt",
      message: `${partnerName}さんは${ownerName}さんに返します`,
    };
  }
  return {
    tone: "credit",
    message: `${partnerName}さんは${ownerName}さんから受け取ります`,
  };
}
