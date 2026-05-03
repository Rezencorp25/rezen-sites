/**
 * Tipi condivisi client/server per Site Audit.
 *
 * Source of truth: `functions/src/audit/psi-types.ts` — duplicato qui perché
 * non possiamo importare cross-package (functions/ non è nel tsconfig della
 * Next app). Tenere i due file in sync manualmente; reali rotture verranno
 * intercettate dai test rules + integration test.
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

export type AuditSeverity = "critical" | "warning" | "info";

export type AuditOpportunity = {
  id: string;
  title: string;
  description: string;
  severity: AuditSeverity;
  estimatedSavingsMs?: number;
};

export type AuditStrategy = "mobile" | "desktop";

export type SiteAuditDoc = {
  id: string;
  url: string;
  strategy: AuditStrategy;
  scores: AuditCategoryScore;
  cwv: CoreWebVitals;
  opportunities: AuditOpportunity[];
  source: "psi-live" | "psi-stub";
  durationMs: number;
  healthScore: number;
  createdAt: Date;
  triggeredBy?: string;
};

export type RunSiteAuditPayload = {
  projectId: string;
  url: string;
  strategy?: AuditStrategy;
};

export type RunSiteAuditResponse = Omit<SiteAuditDoc, "createdAt"> & {
  auditId: string;
};

export const HEALTH_SCORE_THRESHOLDS = {
  good: 80,
  warn: 60,
} as const;

export function healthBucket(score: number): "good" | "warn" | "poor" {
  if (score >= HEALTH_SCORE_THRESHOLDS.good) return "good";
  if (score >= HEALTH_SCORE_THRESHOLDS.warn) return "warn";
  return "poor";
}
