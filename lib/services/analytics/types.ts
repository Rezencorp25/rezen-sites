import type { DeviceShare, CountryShare, TopPage, PageviewPoint } from "@/lib/mocks/pageviews";

export type AnalyticsRange = { days: number };

export type AnalyticsSummary = {
  pageviewsTotal: number;
  sessionsTotal: number;
  bounceRateAvg: number;
  topKeyword: string;
  organicShare: number;
};

export interface AnalyticsService {
  /** Daily pageview/session timeseries */
  getPageviews(projectId: string, range: AnalyticsRange): Promise<PageviewPoint[]>;
  /** Device split (mobile/desktop/tablet) */
  getDevices(projectId: string): Promise<DeviceShare[]>;
  /** Country split */
  getCountries(projectId: string): Promise<CountryShare[]>;
  /** Most-viewed pages with bounce + avg time */
  getTopPages(projectId: string): Promise<TopPage[]>;
  /** High-level summary card metrics */
  getSummary(projectId: string, range: AnalyticsRange): Promise<AnalyticsSummary>;
}
