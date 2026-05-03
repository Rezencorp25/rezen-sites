/**
 * GEO = Generative Engine Optimization (visibilità su LLM conversazionali esterni:
 * ChatGPT, Perplexity, Gemini, Claude).
 *
 * Distinto da AEO (SERP feature di Google). Query "prompt-style" tipicamente
 * longer-tail vs keyword SEO classiche. Cadenza fetch settimanale (non
 * quotidiana) — costo API DataForSEO LLM Mentions più alto e response più lente.
 *
 * AI Visibility Score 0-100 = media dei 4 score per-LLM = % query con mention.
 */

export type GeoLlmId = "chatgpt" | "perplexity" | "gemini" | "claude";

export const GEO_LLM_LABEL: Record<GeoLlmId, string> = {
  chatgpt: "ChatGPT",
  perplexity: "Perplexity",
  gemini: "Gemini",
  claude: "Claude",
};

export const GEO_LLM_ACCENT: Record<GeoLlmId, "emerald" | "violet" | "blue" | "amber"> = {
  chatgpt: "emerald",
  perplexity: "violet",
  gemini: "blue",
  claude: "amber",
};

export type GeoQueryCategory =
  | "recommendation"
  | "comparison"
  | "definition"
  | "howto"
  | "ranking";

export const GEO_CATEGORY_LABEL: Record<GeoQueryCategory, string> = {
  recommendation: "Suggerimento",
  comparison: "Confronto",
  definition: "Definizione",
  howto: "How-to",
  ranking: "Classifica",
};

export type GeoMention = {
  llm: GeoLlmId;
  /** True se il dominio del cliente compare nella risposta. */
  mentioned: boolean;
  /** Posizione ordinale (1-N) tra i domini citati, null se non mentioned. */
  rank: number | null;
  /** Tono della menzione del cliente. Null se non mentioned. */
  sentiment: "positive" | "neutral" | "negative" | null;
  /** Domini citati nella risposta in ordine, incluso il cliente se mentioned. */
  citedDomains: string[];
};

export type GeoQuery = {
  id: string;
  query: string;
  category: GeoQueryCategory;
  /** Volume di ricerca stimato della query (mensile). */
  searchVolume: number;
  /** Mention per ognuno dei 4 LLM. */
  mentions: Record<GeoLlmId, GeoMention>;
};

export type GeoLlmCounters = {
  /** Numero query con menzione del cliente per LLM. */
  mentioned: number;
  /** Numero query totali. */
  total: number;
  /** Posizione media (rank) tra i domini citati, null se mai mentioned. */
  avgRank: number | null;
  /** Score 0-100 per LLM = (mentioned / total) × 100. */
  score: number;
};

export type GeoCompetitorMention = {
  domain: string;
  /** Numero query in cui il competitor è citato (somma cross-LLM). */
  mentionCount: number;
  /** Posizione media nelle citazioni cross-LLM. */
  avgRank: number;
};

export type GeoTrendPoint = {
  date: string;
  visibility: number;
  perLlm: Record<GeoLlmId, number>;
};

export type GeoSnapshot = {
  id: string;
  projectId: string;
  domain: string;
  createdAt: Date;
  source: "stub" | "dataforseo";
  /** AI Visibility Score 0-100 globale = media dei 4 LLM. */
  visibilityScore: number;
  prevVisibilityScore: number | null;
  perLlm: Record<GeoLlmId, GeoLlmCounters>;
  queries: GeoQuery[];
  competitors: GeoCompetitorMention[];
};

export const ALL_LLMS: GeoLlmId[] = ["chatgpt", "perplexity", "gemini", "claude"];
