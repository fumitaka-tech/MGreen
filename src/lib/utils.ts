export const APP_TIMEZONE = "Asia/Tokyo";

/** datetime-local 入力用（JST） */
export function toDatetimeLocalValue(
  date: Date = new Date(),
  timeZone = APP_TIMEZONE
): string {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const parts = formatter.formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}`;
}

/** datetime-local の値を JST として ISO 文字列に変換 */
export function parseDatetimeLocalAsJST(value: string): string {
  const normalized = value.length === 16 ? `${value}:00` : value;
  return new Date(`${normalized}+09:00`).toISOString();
}

export function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("ja-JP", {
    timeZone: APP_TIMEZONE,
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function formatDateTime(dateString: string) {
  return new Date(dateString).toLocaleString("ja-JP", {
    timeZone: APP_TIMEZONE,
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function areaTypeLabel(type: "outdoor" | "indoor") {
  return type === "outdoor" ? "屋外" : "室内";
}

let idCounter = 0;

/** crypto.randomUUID 非対応環境（HTTP アクセス等）向け */
export function createId(): string {
  if (typeof globalThis.crypto?.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }
  idCounter += 1;
  return `${Date.now()}-${idCounter}-${Math.random().toString(36).slice(2, 9)}`;
}
