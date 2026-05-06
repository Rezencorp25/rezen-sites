/**
 * Types per il report PDF (S8). Snapshot raccolto in CF da tutte le sources e
 * passato in input al pdf-builder. Indipendente dai types del client per evitare
 * import path mess in CF.
 */

export type ReportPeriod = {
  /** ISO date "YYYY-MM-DD" inclusivo. */
  start: string;
  /** ISO date "YYYY-MM-DD" inclusivo. */
  end: string;
  /** Etichetta human (es. "Aprile 2026"). */
  label: string;
};

export type ReportBranding = {
  /** Logo URL (PNG/JPG, max 200×80 raccomandato). Optional → fallback REZEN. */
  logoUrl: string | null;
  /** Hex color (es. "#FF6B35"). Default REZEN orange. */
  primaryColor: string;
  /** Brand name display. */
  brandName: string;
};

export type ReportKpi = {
  authorityScore: number;
  authorityDelta: number | null;
  visibilityScore: number;
  visibilityDelta: number | null;
  aiVisibilityScore: number;
  aiVisibilityDelta: number | null;
  brandSentiment: number;
  brandSentimentDelta: number | null;
};

export type ReportSeoSection = {
  authority: {
    score: number;
    linkPower: number;
    traffic: number;
    naturalProfile: number;
  };
  visibilityPercent: number;
  estimatedTrafficClicks: number;
  distribution: {
    top3: number;
    top10: number;
    top20: number;
    top100: number;
    beyond: number;
  };
  topKeywords: Array<{
    keyword: string;
    position: number;
    searchVolume: number;
    estimatedClicks: number;
  }>;
};

export type ReportAeoSection = {
  aeoScore: number;
  serpFeatures: {
    aiOverview: number;
    featuredSnippet: number;
    paa: number;
    knowledgePanel: number;
  };
  ownedFeatures: number;
  topOpportunities: Array<{
    keyword: string;
    feature: string;
    effort: "low" | "medium" | "high";
  }>;
};

export type ReportGeoSection = {
  visibilityScore: number;
  perLlm: Array<{
    llm: string;
    score: number;
    mentioned: number;
    total: number;
  }>;
  sentimentScore: number;
  sentimentDistribution: { positive: number; neutral: number; negative: number };
  citationRate: number;
  totalMentions: number;
  totalCitations: number;
};

export type ReportAishSection = {
  score: number;
  bots: Array<{ bot: string; status: "allowed" | "blocked" | "partial" | "unknown" }>;
  warnings: Array<{
    severity: "critical" | "warning" | "info";
    message: string;
  }>;
  signals: {
    robotsTxtFound: boolean;
    sitemapFound: boolean;
    sitemapUrlCount: number | null;
    llmsTxtFound: boolean;
    pagesWithNoaiMeta: number;
    pagesScanned: number;
  };
};

export type ReportActionItem = {
  source: "seo" | "aeo" | "geo" | "aish";
  severity: "high" | "medium" | "low";
  effort: "low" | "medium" | "high";
  title: string;
  detail: string;
};

export type ReportPayload = {
  projectId: string;
  domain: string;
  period: ReportPeriod;
  branding: ReportBranding;
  generatedAt: Date;
  kpi: ReportKpi;
  seo: ReportSeoSection | null;
  aeo: ReportAeoSection | null;
  geo: ReportGeoSection | null;
  aish: ReportAishSection | null;
  actions: ReportActionItem[];
};

export const REZEN_DEFAULT_PRIMARY = "#FF6B35";
