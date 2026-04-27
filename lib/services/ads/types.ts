import type { GoogleAdsPerformance } from "@/types";

export type AdsRange = { days: number };

export type AdsCampaignSummary = {
  campaign: string;
  spend: number;
  clicks: number;
  conversions: number;
  cpc: number;
  roas: number;
  impressions: number;
};

export interface AdsService {
  /** Per-day per-campaign rows */
  getPerformance(projectId: string, range: AdsRange): Promise<GoogleAdsPerformance[]>;
  /** Per-campaign rolled up */
  getCampaignSummary(projectId: string, range: AdsRange): Promise<AdsCampaignSummary[]>;
}
