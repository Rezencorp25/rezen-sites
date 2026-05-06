import type { GeoLlmId } from "@/lib/seo/geo-types";

/**
 * AI Brand Sentiment — aggregato cross-LLM e cross-query del sentiment delle
 * mention del cliente nelle risposte LLM.
 *
 * Score globale -100/+100:
 *   = (positive_count - negative_count) / total_mentions × 100
 *
 * Riferimento: brief KPI v1.0 §4.3 (S6c.1).
 */

export type SentimentLabel = "positive" | "neutral" | "negative";

export type SentimentDistribution = {
  positive: number;
  neutral: number;
  negative: number;
  /** Somma dei tre, esposta per formattazione "X/N mentions". */
  total: number;
};

/**
 * Attributo qualitativo emergente dal sentiment (es. "supporto rapido",
 * "prezzo alto", "documentazione confusa"). In stub: template hardcoded.
 * In live (S6c backend Cloud Function): estratti da Claude Haiku post-classification.
 */
export type SentimentAttribute = {
  label: string;
  polarity: "positive" | "negative";
  /** Numero di mention in cui questo attributo è stato rilevato. */
  count: number;
};

/**
 * Singola entry "negativa" con contesto, esposta per reputation action.
 * `context` = excerpt della risposta LLM dove appare la mention negativa.
 */
export type NegativeContextEntry = {
  /** ID della query GEO da cui proviene la mention. */
  queryId: string;
  queryText: string;
  llm: GeoLlmId;
  context: string;
  /** Score sentiment di questa entry (sempre negativo, range -100 / -1). */
  score: number;
};

export type SentimentSnapshot = {
  /** Score globale aggregato -100/+100. 0 = neutral perfetto. */
  score: number;
  /** Score della rilevazione precedente (per delta vs prev). Null se prima. */
  prevScore: number | null;
  distribution: SentimentDistribution;
  /** Top attributi positivi e negativi rilevati (max 10 totali). */
  attributes: SentimentAttribute[];
  /** Top 10 mention negative ordinate per impatto (volume × sentiment intensity). */
  negativeEntries: NegativeContextEntry[];
};

export type SentimentTrendPoint = {
  /** ISO date YYYY-MM-DD. */
  date: string;
  score: number;
};
