import type { KeywordIntent } from "@/lib/seo/seo-types";

/**
 * Lookup volumi keyword stub (S6d). Placeholder per DataForSEO Keywords Data API
 * (`keywords_data/google_ads/search_volume/live`) che sarà bundlato in S5.3-bis.
 *
 * Strategia stub:
 *  - hash deterministic della keyword → bucket di volume
 *  - long-tail (>3 parole) → range 30-300
 *  - mid-tail (2-3 parole) → range 200-1500
 *  - head (1 parola) → range 1000-8000
 *  - Boost se contiene location keyword italiana (lugano, ticino, milano, ecc.)
 *  - Intent classificato da pattern: "come"/"cos'è" → informational, "comprare"/"prezzo" → transactional, "migliore"/"vs" → commercial
 */

const LOCATION_BOOST_KW = [
  "lugano", "ticino", "svizzera", "milano", "roma", "torino", "italia", "zurigo",
];

const INFO_PATTERNS = [/^come\s/i, /^cos'?è/i, /^cosa\s/i, /^perché/i, /\?$/];
const TRANS_PATTERNS = [/prezzo/i, /preventivo/i, /comprare/i, /acquistare/i, /noleggio/i, /pricing/i];
const COMM_PATTERNS = [/migliore/i, /miglior\s/i, /\svs\s/i, /confronto/i, /alternativa/i, /recensione/i];

export function lookupKeywordsStub(
  keywords: string[],
): Array<{ keyword: string; searchVolume: number; intent: KeywordIntent }> {
  return keywords.map((kw) => {
    const trimmed = kw.trim().toLowerCase();
    return {
      keyword: kw.trim(),
      searchVolume: estimateVolume(trimmed),
      intent: classifyIntent(trimmed),
    };
  });
}

function estimateVolume(kw: string): number {
  const words = kw.split(/\s+/).filter(Boolean);
  const seed = hash(kw);
  const rand = seedRand(seed);

  let base: number;
  if (words.length >= 4) base = 30 + Math.floor(rand() * 270);
  else if (words.length >= 2) base = 200 + Math.floor(rand() * 1300);
  else base = 1000 + Math.floor(rand() * 7000);

  const hasLocation = LOCATION_BOOST_KW.some((loc) => kw.includes(loc));
  if (hasLocation) base = Math.round(base * 0.6); // location keyword più nicchiate
  return Math.max(10, base);
}

function classifyIntent(kw: string): KeywordIntent {
  if (TRANS_PATTERNS.some((p) => p.test(kw))) return "transactional";
  if (COMM_PATTERNS.some((p) => p.test(kw))) return "commercial";
  if (INFO_PATTERNS.some((p) => p.test(kw))) return "informational";
  // default commercial (più comune nel B2B target)
  return "commercial";
}

function hash(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return h >>> 0;
}

function seedRand(seed: number): () => number {
  let s = seed || 1;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
}

/**
 * Suggerisce competitor da SERP simulata. In live mode userà DataForSEO SERP API
 * (`serp/google/organic/live`) sui top 10 per le top 5 keyword e aggrega i domini
 * più ricorrenti. Stub: ritorna 3 placeholder deterministici da hash dominio.
 */
export function suggestCompetitorsStub(input: {
  domain: string;
  keywords: string[];
}): string[] {
  const { domain, keywords } = input;
  const seed = hash(`${domain}|${keywords.slice(0, 5).join("|")}`);
  const rand = seedRand(seed);
  const pool = [
    "webflow.com",
    "squarespace.com",
    "framer.com",
    "wix.com",
    "shopify.com",
    "wordpress.com",
    "ghost.org",
    "contentful.com",
    "sanity.io",
    "strapi.io",
  ].filter((d) => d !== domain);
  // Shuffle deterministico
  const shuffled = [...pool].sort(() => rand() - 0.5);
  return shuffled.slice(0, 3);
}
