import type { TrackedKeyword } from "./seo-types";
import type {
  AeoKeywordRow,
  AeoOpportunity,
  AeoOwnershipCounters,
} from "./aeo-types";

/**
 * AEO Score 0-100 = (kw con almeno 1 SERP feature owned) / (kw con almeno 1 SERP feature presente) × 100.
 *
 * Razionale: misura quanto efficacemente il cliente "vince" le SERP feature
 * dove sono in palio. Se una kw non ha SERP feature, non penalizza né premia.
 *
 * Edge case: se nessuna kw ha SERP feature, score = 0 (nessuna opportunità).
 */
export function calcAeoScore(keywords: TrackedKeyword[]): number {
  if (keywords.length === 0) return 0;
  let withFeature = 0;
  let withOwnership = 0;
  for (const kw of keywords) {
    const hasFeature =
      !!(kw.features.aiOverview || kw.features.featuredSnippet || kw.features.paa);
    if (!hasFeature) continue;
    withFeature++;
    if (kw.features.aiOverviewOwner || kw.features.featuredSnippetOwner) {
      withOwnership++;
    }
  }
  if (withFeature === 0) return 0;
  return Math.round((withOwnership / withFeature) * 1000) / 10;
}

export function calcAeoOwnership(keywords: TrackedKeyword[]): AeoOwnershipCounters {
  const counters: AeoOwnershipCounters = {
    aiOverviewOwned: 0,
    featuredSnippetOwned: 0,
    paaPresent: 0,
    aiOverviewPresent: 0,
    featuredSnippetPresent: 0,
  };
  for (const kw of keywords) {
    if (kw.features.aiOverview) counters.aiOverviewPresent++;
    if (kw.features.aiOverviewOwner) counters.aiOverviewOwned++;
    if (kw.features.featuredSnippet) counters.featuredSnippetPresent++;
    if (kw.features.featuredSnippetOwner) counters.featuredSnippetOwned++;
    if (kw.features.paa) counters.paaPresent++;
  }
  return counters;
}

export function buildAeoKeywordRows(
  keywords: TrackedKeyword[],
): AeoKeywordRow[] {
  return keywords.map((kw) => ({
    id: kw.id,
    keyword: kw.keyword,
    searchVolume: kw.searchVolume,
    intent: kw.intent,
    position: kw.position,
    url: kw.url,
    features: kw.features,
    hasAnyOwnership: !!(
      kw.features.aiOverviewOwner || kw.features.featuredSnippetOwner
    ),
  }));
}

/**
 * Stima euristica di probabilità di vincita di una SERP feature.
 * Logica: chi ranka in posizione 1-3 ha alta probabilità (Google tipicamente
 * estrae snippet/AIO da top 3); 4-10 media; 11+ bassa.
 *
 * Per AI Overview, Google considera rilevanza semantica oltre alla posizione,
 * quindi anche kw fuori top 10 hanno chance non nulla.
 */
function winProbability(
  feature: "aiOverview" | "featuredSnippet",
  position: number,
): number {
  if (position === 0) return feature === "aiOverview" ? 0.05 : 0;
  if (position <= 3) return feature === "aiOverview" ? 0.65 : 0.85;
  if (position <= 10) return feature === "aiOverview" ? 0.4 : 0.45;
  if (position <= 20) return feature === "aiOverview" ? 0.18 : 0.1;
  return feature === "aiOverview" ? 0.05 : 0.02;
}

/**
 * Lista di opportunità AEO: keyword con SERP feature presente non owned dal cliente.
 * Ordinata per `volume × probability` discendente.
 *
 * Una kw può generare 2 opportunità (AIO non owned + Snippet non owned).
 */
export function calcAeoOpportunities(
  keywords: TrackedKeyword[],
): AeoOpportunity[] {
  const list: AeoOpportunity[] = [];
  for (const kw of keywords) {
    if (kw.features.aiOverview && !kw.features.aiOverviewOwner) {
      const p = winProbability("aiOverview", kw.position);
      list.push({
        keywordId: kw.id,
        keyword: kw.keyword,
        searchVolume: kw.searchVolume,
        intent: kw.intent,
        position: kw.position,
        features: kw.features,
        feature: "aiOverview",
        winProbability: p,
        score: kw.searchVolume * p,
      });
    }
    if (kw.features.featuredSnippet && !kw.features.featuredSnippetOwner) {
      const p = winProbability("featuredSnippet", kw.position);
      list.push({
        keywordId: kw.id,
        keyword: kw.keyword,
        searchVolume: kw.searchVolume,
        intent: kw.intent,
        position: kw.position,
        features: kw.features,
        feature: "featuredSnippet",
        winProbability: p,
        score: kw.searchVolume * p,
      });
    }
  }
  return list.sort((a, b) => b.score - a.score);
}
