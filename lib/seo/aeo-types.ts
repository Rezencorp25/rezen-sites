import type { KeywordIntent, SerpFeatureFlags } from "./seo-types";

/**
 * AEO = Answer Engine Optimization (Google AI Overviews, Featured Snippet, PAA).
 * Modulo distinto da GEO (LLM conversazionali esterni).
 *
 * AEO Score 0-100 = % keyword con almeno 1 SERP feature owned dal cliente.
 * Counter ownership: per ogni feature, quante kw il cliente "possiede".
 */

export type AeoFeatureKey =
  | "aiOverview"
  | "featuredSnippet"
  | "paa"
  | "knowledgePanel";

export const AEO_FEATURE_LABEL: Record<AeoFeatureKey, string> = {
  aiOverview: "AI Overview",
  featuredSnippet: "Featured Snippet",
  paa: "People Also Ask",
  knowledgePanel: "Knowledge Panel",
};

export type AeoKeywordRow = {
  id: string;
  keyword: string;
  searchVolume: number;
  intent: KeywordIntent;
  position: number;
  url: string | null;
  features: SerpFeatureFlags;
  /** True se il cliente possiede almeno 1 SERP feature su questa keyword. */
  hasAnyOwnership: boolean;
};

export type AeoOwnershipCounters = {
  /** Numero keyword in cui il cliente è citato in AI Overview. */
  aiOverviewOwned: number;
  /** Numero keyword in cui il cliente possiede il Featured Snippet. */
  featuredSnippetOwned: number;
  /** Numero keyword con PAA presente (non c'è ownership su PAA, solo presence). */
  paaPresent: number;
  /** Numero keyword con AI Overview presente (owned o no). */
  aiOverviewPresent: number;
  /** Numero keyword con Featured Snippet presente. */
  featuredSnippetPresent: number;
};

export type AeoOpportunity = {
  keywordId: string;
  keyword: string;
  searchVolume: number;
  intent: KeywordIntent;
  position: number;
  features: SerpFeatureFlags;
  /** Quale feature è "in palio" (presente non owned). Una keyword può avere più opportunità — ne emettiamo una entry per feature. */
  feature: "aiOverview" | "featuredSnippet";
  /** Probabilità di vincita 0-1, stima euristica basata su posizione attuale. */
  winProbability: number;
  /** Punteggio = volume × probability, usato per ordinamento. */
  score: number;
};

export type AeoTrendPoint = {
  date: string;
  aeoScore: number;
  aiOverviewOwned: number;
  featuredSnippetOwned: number;
};

export type AeoSnapshot = {
  id: string;
  projectId: string;
  domain: string;
  createdAt: Date;
  source: "stub" | "dataforseo";
  aeoScore: number;
  prevAeoScore: number | null;
  ownership: AeoOwnershipCounters;
  keywords: AeoKeywordRow[];
  opportunities: AeoOpportunity[];
};
