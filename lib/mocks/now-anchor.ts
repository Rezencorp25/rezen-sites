/**
 * Fixed timestamp used as "now" for ALL deterministic mock data.
 * Required to keep SSR and CSR output identical (no React hydration
 * errors #418/#419).
 *
 * Pick a date close to current development time so the mock dates feel
 * "recent" but stay stable. Bump only when you want fresh-looking data
 * across the whole demo set.
 */
export const NOW_ANCHOR = new Date("2026-04-28T12:00:00Z").getTime();
