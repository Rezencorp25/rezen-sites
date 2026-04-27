import type { AnalyticsService, AnalyticsRange, AnalyticsSummary } from "./types";
import type { DeviceShare, CountryShare, TopPage, PageviewPoint } from "@/lib/mocks/pageviews";

/**
 * Real GA4 Data API implementation.
 * TODO[real]: implement at go-live. See GO_LIVE_GUIDE.md → "Cosa serve per attivare ogni service reale"
 *
 * Required:
 *   - GA4_SERVICE_ACCOUNT_JSON env (Firebase Secret Manager)
 *   - propertyId from settings-store: integrations.googleAnalytics.measurementId
 *   - npm i @google-analytics/data
 */
export class GA4AnalyticsService implements AnalyticsService {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async getPageviews(_projectId: string, _range: AnalyticsRange): Promise<PageviewPoint[]> {
    throw new Error("GA4AnalyticsService not implemented — see GO_LIVE_GUIDE.md");
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async getDevices(_projectId: string): Promise<DeviceShare[]> {
    throw new Error("GA4AnalyticsService not implemented");
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async getCountries(_projectId: string): Promise<CountryShare[]> {
    throw new Error("GA4AnalyticsService not implemented");
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async getTopPages(_projectId: string): Promise<TopPage[]> {
    throw new Error("GA4AnalyticsService not implemented");
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async getSummary(_projectId: string, _range: AnalyticsRange): Promise<AnalyticsSummary> {
    throw new Error("GA4AnalyticsService not implemented");
  }
}
