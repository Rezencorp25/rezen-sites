import type { AnalyticsService, AnalyticsRange, AnalyticsSummary } from "./types";
import {
  generatePageviews,
  devicesMock,
  countriesMock,
  topPagesMock,
  type DeviceShare,
  type CountryShare,
  type TopPage,
  type PageviewPoint,
} from "@/lib/mocks/pageviews";

/**
 * MOCK: Mock implementation backed by deterministic seeded data.
 * Replace with GA4Service at go-live (see GO_LIVE_GUIDE.md).
 */
export class MockAnalyticsService implements AnalyticsService {
  async getPageviews(projectId: string, range: AnalyticsRange): Promise<PageviewPoint[]> {
    // MOCK:
    return generatePageviews(projectId, range.days);
  }

  async getDevices(projectId: string): Promise<DeviceShare[]> {
    // MOCK:
    return devicesMock(projectId);
  }

  async getCountries(projectId: string): Promise<CountryShare[]> {
    // MOCK:
    return countriesMock(projectId);
  }

  async getTopPages(projectId: string): Promise<TopPage[]> {
    // MOCK:
    return topPagesMock(projectId);
  }

  async getSummary(projectId: string, range: AnalyticsRange): Promise<AnalyticsSummary> {
    // MOCK:
    const points = generatePageviews(projectId, range.days);
    const pageviewsTotal = points.reduce((s, p) => s + p.pageviews, 0);
    const sessionsTotal = points.reduce((s, p) => s + p.sessions, 0);
    const topKeyword =
      projectId === "verumflow-ch"
        ? "agenzia seo svizzera"
        : projectId === "impresa-edile-carfi"
          ? "ristrutturazioni ticino"
          : "consulenza biotech";
    return {
      pageviewsTotal,
      sessionsTotal,
      bounceRateAvg: 0.45,
      topKeyword,
      organicShare: projectId === "verumflow-ch" ? 0.62 : 0.41,
    };
  }
}
