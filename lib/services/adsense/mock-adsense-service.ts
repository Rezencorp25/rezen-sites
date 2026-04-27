import type { AdSenseService, AdSenseRange, AdSenseSummary } from "./types";
import { generateDailyAdSense } from "@/lib/mocks/analytics";
import type { AdSenseRevenue } from "@/types";

/**
 * MOCK: Mock implementation backed by deterministic seeded data.
 * Replace with AdSenseRealService at go-live.
 */
export class MockAdSenseService implements AdSenseService {
  async getRevenue(projectId: string, range: AdSenseRange): Promise<AdSenseRevenue[]> {
    // MOCK: only verumflow-ch monetises with AdSense in the demo set
    if (projectId !== "verumflow-ch") return [];
    return generateDailyAdSense(projectId, range.days);
  }

  async getSummary(projectId: string, range: AdSenseRange): Promise<AdSenseSummary> {
    // MOCK:
    const rows = await this.getRevenue(projectId, range);
    const dayRows = rows.filter((r) => !r.pageUrl);
    const revenueTotal = Math.round(dayRows.reduce((s, r) => s + r.revenue, 0) * 100) / 100;
    const impressionsTotal = dayRows.reduce((s, r) => s + r.impressions, 0);
    const ctrAvg =
      dayRows.length > 0
        ? Math.round((dayRows.reduce((s, r) => s + r.ctr, 0) / dayRows.length) * 10000) /
          10000
        : 0;
    const rpmAvg =
      impressionsTotal > 0
        ? Math.round(((revenueTotal / impressionsTotal) * 1000) * 100) / 100
        : 0;
    return { revenueTotal, impressionsTotal, ctrAvg, rpmAvg };
  }
}
