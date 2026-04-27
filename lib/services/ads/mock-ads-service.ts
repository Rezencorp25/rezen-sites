import type { AdsService, AdsRange, AdsCampaignSummary } from "./types";
import { generateGoogleAds } from "@/lib/mocks/analytics";
import type { GoogleAdsPerformance } from "@/types";

const PROJECTS_WITH_ADS = ["verumflow-ch", "impresa-edile-carfi"];

/**
 * MOCK: Mock implementation backed by deterministic seeded data.
 * Replace with GoogleAdsService at go-live.
 */
export class MockAdsService implements AdsService {
  async getPerformance(projectId: string, range: AdsRange): Promise<GoogleAdsPerformance[]> {
    // MOCK: only verumflow-ch + carfi have ad spend; others return empty
    if (!PROJECTS_WITH_ADS.includes(projectId)) return [];
    return generateGoogleAds(projectId, range.days);
  }

  async getCampaignSummary(
    projectId: string,
    range: AdsRange,
  ): Promise<AdsCampaignSummary[]> {
    // MOCK:
    const rows = await this.getPerformance(projectId, range);
    const byCampaign = new Map<string, AdsCampaignSummary>();
    for (const r of rows) {
      const cur = byCampaign.get(r.campaign) ?? {
        campaign: r.campaign,
        spend: 0,
        clicks: 0,
        conversions: 0,
        impressions: 0,
        cpc: 0,
        roas: 0,
      };
      cur.spend += r.spend;
      cur.clicks += r.clicks;
      cur.conversions += r.conversions;
      cur.impressions += r.impressions;
      byCampaign.set(r.campaign, cur);
    }
    for (const c of byCampaign.values()) {
      c.cpc = c.clicks > 0 ? Math.round((c.spend / c.clicks) * 100) / 100 : 0;
      // approximate revenue assumption: stored on rows already aggregates roas
      // recompute roas from rows to avoid drift
      const roasRows = rows.filter((r) => r.campaign === c.campaign);
      const meanRoas =
        roasRows.length > 0
          ? roasRows.reduce((s, r) => s + r.roas, 0) / roasRows.length
          : 0;
      c.roas = Math.round(meanRoas * 100) / 100;
      c.spend = Math.round(c.spend * 100) / 100;
    }
    return [...byCampaign.values()].sort((a, b) => b.spend - a.spend);
  }
}
