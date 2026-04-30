/**
 * DataForSEO API — TypeScript types per i 4 use case attivi in REZEN Sites v.2.
 *
 * Reference docs: https://docs.dataforseo.com/v3/
 * I types coprono solo i campi consumati dal nostro stack — NON sono lo schema
 * completo. Estendere quando un nuovo campo serve.
 */

export type DfsLocation = {
  /** Codice ISO 3166-1 alpha-2 (es. "IT", "CH"). */
  countryCode: string;
  /** Codice lingua (es. "it", "en"). */
  languageCode: string;
};

// ── SERP — rank tracking ──────────────────────────────────────────────────

export type SerpKeywordRequest = {
  keyword: string;
  location: DfsLocation;
  device?: "desktop" | "mobile";
  /** Per ora supportiamo solo Google. */
  searchEngine?: "google";
};

export type SerpResultItem = {
  rankAbsolute: number;
  title: string;
  url: string;
  domain: string;
  isAd: boolean;
  type: "organic" | "paid" | "featured_snippet" | "people_also_ask" | "other";
};

export type SerpResponse = {
  keyword: string;
  location: DfsLocation;
  totalResults: number;
  fetchedAt: string;
  items: SerpResultItem[];
};

// ── Keyword data ──────────────────────────────────────────────────────────

export type KeywordOverviewRequest = {
  keywords: string[];
  location: DfsLocation;
};

export type KeywordOverviewItem = {
  keyword: string;
  searchVolume: number;
  cpc: number;
  competition: number;
  competitionLevel: "low" | "medium" | "high";
  monthlySearches: { year: number; month: number; searchVolume: number }[];
};

// ── Backlinks ─────────────────────────────────────────────────────────────

export type BacklinkOverviewRequest = {
  target: string; // dominio o URL
};

export type BacklinkOverviewResponse = {
  target: string;
  rank: number; // domain rank 0-100
  backlinks: number;
  referringDomains: number;
  referringMainDomains: number;
  brokenBacklinks: number;
  fetchedAt: string;
};

// ── Domain analytics (Authority + traffic) ────────────────────────────────

export type DomainOverviewRequest = {
  target: string;
  location: DfsLocation;
};

export type DomainOverviewResponse = {
  target: string;
  authorityScore: number; // 0-100
  organicTraffic: number; // sessioni stimate /mese
  organicKeywords: number;
  paidKeywords: number;
  referringDomains: number;
  fetchedAt: string;
};

// ── Common ────────────────────────────────────────────────────────────────

export type DfsClientMode = "live" | "stub";

export type DfsClientConfig = {
  mode: DfsClientMode;
  /** In live mode: credenziali Basic auth. */
  login?: string;
  password?: string;
  /** Timeout per chiamata in ms (default 30s — DataForSEO è lento, 4-5s media). */
  timeoutMs?: number;
};

export class DfsApiError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly statusMessage: string,
    public readonly endpoint: string,
  ) {
    super(`DataForSEO ${statusCode} ${statusMessage} on ${endpoint}`);
    this.name = "DfsApiError";
  }
}
