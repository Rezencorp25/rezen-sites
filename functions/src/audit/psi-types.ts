/**
 * Shape normalizzata per persistenza in Firestore. Indipendente dal payload
 * Lighthouse grezzo (che è enorme): salviamo solo ciò che la UI mostra.
 *
 * Centralizzato qui per essere importato sia da Cloud Functions che (via
 * `lib/audit/audit-types.ts` che lo re-esporta) dal client Next.
 */

export type AuditCategoryScore = {
  performance: number;
  accessibility: number;
  bestPractices: number;
  seo: number;
};

export type CoreWebVitals = {
  lcp: number | null;
  cls: number | null;
  inp: number | null;
  ttfb: number | null;
  fcp: number | null;
};

export type AuditOpportunity = {
  id: string;
  title: string;
  description: string;
  severity: "critical" | "warning" | "info";
  estimatedSavingsMs?: number;
};

export type AuditStrategy = "mobile" | "desktop";

export type SiteAuditRecord = {
  url: string;
  strategy: AuditStrategy;
  scores: AuditCategoryScore;
  cwv: CoreWebVitals;
  opportunities: AuditOpportunity[];
  source: "psi-live" | "psi-stub";
  durationMs: number;
};

export const HEALTH_SCORE_WEIGHTS = {
  performance: 0.4,
  seo: 0.3,
  accessibility: 0.15,
  bestPractices: 0.15,
} as const;

export function computeHealthScore(scores: AuditCategoryScore): number {
  const weighted =
    scores.performance * HEALTH_SCORE_WEIGHTS.performance +
    scores.seo * HEALTH_SCORE_WEIGHTS.seo +
    scores.accessibility * HEALTH_SCORE_WEIGHTS.accessibility +
    scores.bestPractices * HEALTH_SCORE_WEIGHTS.bestPractices;
  return Math.round(weighted);
}
