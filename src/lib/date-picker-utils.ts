/**
 * 取引フォームの日時選択モード。
 * - now: 送信時点の現在時刻を使う（作成時のデフォルト）
 * - custom: datetime-local で指定した日時を使う
 */
export type DateMode = "now" | "custom";

/**
 * input[type="datetime-local"] の value 形式（"YYYY-MM-DDTHH:mm"）に変換する。
 * datetime-local はローカル時刻を扱うため、ローカルの getter を使う。
 */
export function toDateTimeLocalValue(date: Date): string {
  const y = date.getFullYear();
  const mo = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  const h = String(date.getHours()).padStart(2, "0");
  const mi = String(date.getMinutes()).padStart(2, "0");
  return `${y}-${mo}-${d}T${h}:${mi}`;
}

/**
 * 「現在(HH:MM)」ラベル用の時刻表記。
 */
export function formatHoursMinutes(date: Date): string {
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

/**
 * datetime-local の文字列を Date に変換する。不正な値は null。
 */
export function parseDateTimeLocal(value: string): Date | null {
  if (value === "") return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

/**
 * フォームの選択内容から実際に保存する日時を組み立てる。
 * now の場合は「送信した瞬間」の時刻になる。
 */
export function buildDateTime(dateMode: DateMode, customDateTime: string): Date {
  if (dateMode === "now") return new Date();
  return parseDateTimeLocal(customDateTime) ?? new Date();
}
