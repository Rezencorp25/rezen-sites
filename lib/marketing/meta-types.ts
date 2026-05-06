/**
 * S9 — Meta Ads Marketing API integration.
 *
 * Cadenza fetch: daily (CF onSchedule '0 6 * * *' Europe/Rome).
 * Fonte dati: Meta Marketing API (graph.facebook.com/v21.0). Oggi stub-mode
 * deterministic; live mode richiede Meta App + System User token + Business
 * Manager Asset ID (registrato in Project.integrations.metaAds).
 *
 * Naming convention coerente con Meta API:
 *  - Campaign → contiene 1..N AdSet
 *  - AdSet → contiene 1..N Creative (ad)
 *  - Creative → singolo ad asset (image/video/carousel)
 */

export type MetaCampaignObjective =
  | "OUTCOME_AWARENESS"
  | "OUTCOME_TRAFFIC"
  | "OUTCOME_ENGAGEMENT"
  | "OUTCOME_LEADS"
  | "OUTCOME_APP_PROMOTION"
  | "OUTCOME_SALES";

export const META_OBJECTIVE_LABEL: Record<MetaCampaignObjective, string> = {
  OUTCOME_AWARENESS: "Awareness",
  OUTCOME_TRAFFIC: "Traffic",
  OUTCOME_ENGAGEMENT: "Engagement",
  OUTCOME_LEADS: "Leads",
  OUTCOME_APP_PROMOTION: "App Promotion",
  OUTCOME_SALES: "Sales",
};

export type MetaCampaignStatus = "ACTIVE" | "PAUSED" | "COMPLETED" | "DELETED";

export type MetaCreativeFormat = "image" | "video" | "carousel" | "collection";

export type MetaCreative = {
  id: string;
  name: string;
  format: MetaCreativeFormat;
  thumbnailUrl: string | null;
  /** CTR % di questo creative isolato (0-100). */
  ctr: number;
  /** Spend last 30d. */
  spend30d: number;
};

export type MetaAdSet = {
  id: string;
  name: string;
  /** Daily budget configurato. */
  dailyBudget: number;
  /** Spend cumulativo last 30d. */
  spend30d: number;
  /** Avg frequency (impression / reach). */
  frequency: number;
  /** Numero leads attribuibili last 30d (se OUTCOME_LEADS). */
  leads30d: number;
  creatives: MetaCreative[];
};

export type MetaCampaign = {
  id: string;
  name: string;
  objective: MetaCampaignObjective;
  status: MetaCampaignStatus;
  /** ISO date di start campagna. */
  startedAt: string;
  /** ISO date end (null se attiva indefinita). */
  endedAt: string | null;
  /** Budget totale lifetime; null se daily-only. */
  lifetimeBudget: number | null;
  /** Spend totale last 30d. */
  spend30d: number;
  /** Impression last 30d. */
  impressions30d: number;
  /** Click last 30d. */
  clicks30d: number;
  /** Conversion (lead/sale) last 30d. */
  conversions30d: number;
  /** ROAS last 30d (0 se objective non revenue). */
  roas30d: number;
  /** CPC last 30d. */
  cpc30d: number;
  /** CTR % last 30d. */
  ctr30d: number;
  /** CPL last 30d (cost per lead, 0 se non OUTCOME_LEADS). */
  cpl30d: number;
  adSets: MetaAdSet[];
};

export type MetaSnapshot = {
  id: string;
  projectId: string;
  domain: string;
  createdAt: Date;
  source: "stub" | "meta-api";
  /** Meta Business Manager account id usato per il fetch (null se stub). */
  metaBusinessAccountId: string | null;
  /** Currency dell'ad account (EUR/USD/CHF). */
  currency: "EUR" | "USD" | "CHF";

  /** Aggregati cross-campagna last 30d. */
  totals: {
    spend30d: number;
    impressions30d: number;
    clicks30d: number;
    conversions30d: number;
    leads30d: number;
    /** CTR aggregato % */
    ctr30d: number;
    /** CPC aggregato */
    cpc30d: number;
    /** CPL aggregato (sui campaigns OUTCOME_LEADS) */
    cpl30d: number;
    /** ROAS aggregato weighted */
    roas30d: number;
    /** Active campaigns count */
    activeCampaigns: number;
  };
  campaigns: MetaCampaign[];
};

export type MetaTrendPoint = {
  /** ISO YYYY-MM-DD */
  date: string;
  spend: number;
  impressions: number;
  clicks: number;
  leads: number;
  cpl: number;
};

/**
 * Bands per CPL (target dipende dall'industry; usiamo soglie generiche €/lead).
 */
export type CplBand = "excellent" | "good" | "average" | "poor";

export function cplBand(cpl: number): CplBand {
  if (cpl <= 0) return "excellent"; // org/free fallback
  if (cpl < 10) return "excellent";
  if (cpl < 25) return "good";
  if (cpl < 60) return "average";
  return "poor";
}

export const CPL_BAND_LABEL: Record<CplBand, string> = {
  excellent: "Excellent",
  good: "Good",
  average: "Average",
  poor: "Poor",
};

/**
 * Formatta currency standard.
 */
export function fmtMetaMoney(n: number, currency: string): string {
  return `${currency} ${n.toLocaleString("it-IT", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function fmtMetaInt(n: number): string {
  return n.toLocaleString("it-IT");
}
