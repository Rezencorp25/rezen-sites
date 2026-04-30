import type {
  SerpResponse,
  KeywordOverviewItem,
  BacklinkOverviewResponse,
  DomainOverviewResponse,
  SerpKeywordRequest,
  KeywordOverviewRequest,
  BacklinkOverviewRequest,
  DomainOverviewRequest,
} from "./dataforseo-types";

/**
 * Mock data deterministici per stub-mode.
 *
 * Funzione hash semplice per generare valori riproducibili a partire da
 * input testuali — così i test non sono flaky e gli sviluppatori vedono
 * sempre gli stessi numeri per lo stesso progetto.
 */
function seedFrom(input: string): number {
  let h = 0;
  for (let i = 0; i < input.length; i++) {
    h = (h << 5) - h + input.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

function pickRange(seed: number, min: number, max: number): number {
  return min + (seed % (max - min + 1));
}

export function mockSerpResponse(req: SerpKeywordRequest): SerpResponse {
  const seed = seedFrom(req.keyword + req.location.countryCode);
  const totalResults = 100_000 + (seed % 900_000);
  const items = Array.from({ length: 10 }, (_, i) => ({
    rankAbsolute: i + 1,
    title: `Result ${i + 1} for "${req.keyword}"`,
    url: `https://example-${i + 1}.com/${req.keyword.replace(/\s+/g, "-")}`,
    domain: `example-${i + 1}.com`,
    isAd: i < 2,
    type: (i < 2 ? "paid" : "organic") as "paid" | "organic",
  }));
  return {
    keyword: req.keyword,
    location: req.location,
    totalResults,
    fetchedAt: new Date().toISOString(),
    items,
  };
}

export function mockKeywordOverview(
  req: KeywordOverviewRequest,
): KeywordOverviewItem[] {
  return req.keywords.map((keyword) => {
    const seed = seedFrom(keyword + req.location.countryCode);
    const sv = pickRange(seed, 100, 50_000);
    return {
      keyword,
      searchVolume: sv,
      cpc: Math.round((pickRange(seed, 5, 500) / 100) * 100) / 100,
      competition: pickRange(seed, 10, 95) / 100,
      competitionLevel:
        seed % 3 === 0 ? "low" : seed % 3 === 1 ? "medium" : "high",
      monthlySearches: Array.from({ length: 12 }, (_, m) => ({
        year: new Date().getFullYear() - Math.floor(m / 12),
        month: 12 - m,
        searchVolume: Math.round(sv * (0.7 + (((seed + m) % 60) / 100))),
      })),
    };
  });
}

export function mockBacklinkOverview(
  req: BacklinkOverviewRequest,
): BacklinkOverviewResponse {
  const seed = seedFrom(req.target);
  return {
    target: req.target,
    rank: pickRange(seed, 30, 85),
    backlinks: pickRange(seed, 100, 50_000),
    referringDomains: pickRange(seed, 50, 5_000),
    referringMainDomains: pickRange(seed, 30, 3_000),
    brokenBacklinks: pickRange(seed, 0, 200),
    fetchedAt: new Date().toISOString(),
  };
}

export function mockDomainOverview(
  req: DomainOverviewRequest,
): DomainOverviewResponse {
  const seed = seedFrom(req.target);
  return {
    target: req.target,
    authorityScore: pickRange(seed, 25, 80),
    organicTraffic: pickRange(seed, 500, 250_000),
    organicKeywords: pickRange(seed, 50, 25_000),
    paidKeywords: pickRange(seed, 0, 500),
    referringDomains: pickRange(seed, 30, 5_000),
    fetchedAt: new Date().toISOString(),
  };
}
