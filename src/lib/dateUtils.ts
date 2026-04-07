/**
 * 日本標準時(JST)での日付をYYYY-MM-DD形式で取得
 * @param date - 変換する日付（省略時は現在時刻）
 * @returns YYYY-MM-DD形式の日付文字列
 */
export function formatDateToJST(date: Date = new Date()): string {
  const jstDate = date.toLocaleString('ja-JP', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).split('/').join('-');
  
  return jstDate;
}

export function formatDateForDisplay(date: Date): string {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const weekdays = ["日", "月", "火", "水", "木", "金", "土"];
  const weekday = weekdays[date.getDay()];
  return `${year}年${month}月${day}日(${weekday})`;
}

/**
 * 日時を JST に変換して「YYYY年M月D日(曜) HH:MM」形式で返す
 */
export function formatDateTimeForDisplay(date: Date): string {
  const jst = new Date(date.toLocaleString("en-US", { timeZone: "Asia/Tokyo" }));
  const year = jst.getFullYear();
  const month = jst.getMonth() + 1;
  const day = jst.getDate();
  const weekdays = ["日", "月", "火", "水", "木", "金", "土"];
  const weekday = weekdays[jst.getDay()];
  const hours = String(jst.getHours()).padStart(2, "0");
  const minutes = String(jst.getMinutes()).padStart(2, "0");
  return `${year}年${month}月${day}日(${weekday}) ${hours}:${minutes}`;
}
