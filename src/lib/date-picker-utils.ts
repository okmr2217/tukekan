export type DateMode = "today" | "yesterday" | "other";

export const TIME_OPTIONS: string[] = (() => {
  const options: string[] = [];
  for (let h = 0; h < 24; h++) {
    for (const m of [0, 30]) {
      options.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
    }
  }
  return options;
})();

export function floorToNearest30(date: Date): string {
  const h = date.getHours();
  const m = date.getMinutes() < 30 ? 0 : 30;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function buildDateTime(
  dateMode: DateMode,
  otherDate: string,
  time: string,
): Date {
  const now = new Date();
  let base: Date;

  if (dateMode === "today") {
    base = new Date(now);
  } else if (dateMode === "yesterday") {
    base = new Date(now);
    base.setDate(base.getDate() - 1);
  } else {
    base = new Date(`${otherDate}T00:00:00`);
  }

  const [hours, minutes] = time.split(":").map(Number);
  base.setHours(hours, minutes, 0, 0);
  return base;
}
