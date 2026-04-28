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
 * コンパクトな日時表示（JST基準）
 * 60分以内 → "N分前"
 * 今日 → "HH:mm"
 * 昨日 → "昨日 HH:mm"
 * それ以前 → "M/d HH:mm"
 */
export function formatCompactTime(date: Date): string {
  const now = new Date();
  const jst = new Date(date.toLocaleString("en-US", { timeZone: "Asia/Tokyo" }));
  const jstNow = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Tokyo" }));

  const diffMinutes = Math.floor((jstNow.getTime() - jst.getTime()) / (1000 * 60));
  const hours = String(jst.getHours()).padStart(2, "0");
  const minutes = String(jst.getMinutes()).padStart(2, "0");

  if (diffMinutes >= 0 && diffMinutes < 60) {
    return `${diffMinutes}分前`;
  }

  const sameDate = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  if (sameDate(jst, jstNow)) {
    return `${hours}:${minutes}`;
  }

  const yesterday = new Date(jstNow);
  yesterday.setDate(yesterday.getDate() - 1);
  if (sameDate(jst, yesterday)) {
    return `昨日 ${hours}:${minutes}`;
  }

  return `${jst.getMonth() + 1}/${jst.getDate()} ${hours}:${minutes}`;
}

/**
 * 「M/d」形式の短い日付（JST基準）
 */
export function formatShortDate(date: Date): string {
  const jst = new Date(date.toLocaleString("en-US", { timeZone: "Asia/Tokyo" }));
  return `${jst.getMonth() + 1}/${jst.getDate()}`;
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
