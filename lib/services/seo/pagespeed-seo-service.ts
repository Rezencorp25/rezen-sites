import type { SeoDataService, SeoPageSnapshot, SeoIssue } from "./types";

/**
 * Real PageSpeed Insights + Lighthouse implementation.
 * TODO[real]: implement at go-live. See GO_LIVE_GUIDE.md
 *
 * Required:
 *   - PAGESPEED_API_KEY env (Secret Manager)
 *   - GET https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=...&strategy=mobile
 *   - Quota: 25k req/day default, can be raised
 */
export class PageSpeedSeoService implements SeoDataService {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async getPageSnapshot(_projectId: string, _pageUrl: string): Promise<SeoPageSnapshot> {
    throw new Error("PageSpeedSeoService not implemented — see GO_LIVE_GUIDE.md");
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async getProjectScore(_projectId: string): Promise<number> {
    throw new Error("PageSpeedSeoService not implemented");
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async getProjectIssues(_projectId: string): Promise<SeoIssue[]> {
    throw new Error("PageSpeedSeoService not implemented");
  }
}
