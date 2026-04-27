export type CWVMetric = {
  /** Largest Contentful Paint, seconds */
  lcp: number;
  /** Cumulative Layout Shift */
  cls: number;
  /** Interaction to Next Paint, ms */
  inp: number;
  /** First Contentful Paint, seconds */
  fcp: number;
  /** Time to First Byte, ms */
  ttfb: number;
};

export type CWVResult = {
  url: string;
  mobile: CWVMetric;
  desktop: CWVMetric;
  score: number;
  rating: "good" | "needs-improvement" | "poor";
  fetchedAt: Date;
};

export type SeoPageSnapshot = {
  url: string;
  /** Aggregate 0-100 SEO health score */
  score: number;
  cwv: CWVResult;
  issues: SeoIssue[];
};

export type SeoIssue = {
  id: string;
  severity: "critical" | "warning" | "info";
  category:
    | "meta"
    | "schema"
    | "performance"
    | "accessibility"
    | "links"
    | "content"
    | "indexability";
  title: string;
  description: string;
  affectedUrl?: string;
};

export interface SeoDataService {
  /** Snapshot for a single page (per-URL) */
  getPageSnapshot(projectId: string, pageUrl: string): Promise<SeoPageSnapshot>;
  /** Aggregate score for the whole project */
  getProjectScore(projectId: string): Promise<number>;
  /** Project-wide issues list (deduped) */
  getProjectIssues(projectId: string): Promise<SeoIssue[]>;
}
