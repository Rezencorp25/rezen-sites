/**
 * UTC-stable date formatters. date-fns `format()` uses the runtime
 * timezone, which differs between SSR (UTC) and CSR (browser local),
 * causing React hydration error #418 for any timestamp near midnight.
 *
 * These helpers render in UTC consistently, so SSR and CSR agree.
 */

const MONTHS_IT = [
  "gen", "feb", "mar", "apr", "mag", "giu",
  "lug", "ago", "set", "ott", "nov", "dic",
];

export function fmtDateShort(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return `${date.getUTCDate()} ${MONTHS_IT[date.getUTCMonth()]}`;
}

export function fmtTime(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return `${String(date.getUTCHours()).padStart(2, "0")}:${String(date.getUTCMinutes()).padStart(2, "0")}`;
}

export function fmtDateTime(d: Date | string): string {
  return `${fmtDateShort(d)} · ${fmtTime(d)}`;
}

export function fmtDateLong(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return `${date.getUTCDate()} ${MONTHS_IT[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
}

export function fmtDateTimeLong(d: Date | string): string {
  return `${fmtDateLong(d)} alle ${fmtTime(d)}`;
}

export function fmtDateOnlyIso(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return `${String(date.getUTCDate()).padStart(2, "0")}/${String(date.getUTCMonth() + 1).padStart(2, "0")}/${date.getUTCFullYear()}`;
}
