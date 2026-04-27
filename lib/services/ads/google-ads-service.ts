import type { AdsService, AdsRange, AdsCampaignSummary } from "./types";
import type { GoogleAdsPerformance } from "@/types";

/**
 * Real Google Ads API implementation.
 * TODO[real]: implement at go-live. See GO_LIVE_GUIDE.md
 *
 * Required:
 *   - GOOGLE_ADS_DEVELOPER_TOKEN env (Secret Manager)
 *   - GOOGLE_ADS_MCC_CUSTOMER_ID env
 *   - GOOGLE_ADS_REFRESH_TOKEN env (per-customer or central)
 *   - npm i google-ads-api
 */
export class GoogleAdsService implements AdsService {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async getPerformance(_projectId: string, _range: AdsRange): Promise<GoogleAdsPerformance[]> {
    throw new Error("GoogleAdsService not implemented — see GO_LIVE_GUIDE.md");
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async getCampaignSummary(_projectId: string, _range: AdsRange): Promise<AdsCampaignSummary[]> {
    throw new Error("GoogleAdsService not implemented");
  }
}
