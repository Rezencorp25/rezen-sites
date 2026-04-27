import type { AdSenseService, AdSenseRange, AdSenseSummary } from "./types";
import type { AdSenseRevenue } from "@/types";

/**
 * Real AdSense Management API implementation.
 * TODO[real]: implement at go-live. See GO_LIVE_GUIDE.md
 *
 * Required:
 *   - ADSENSE_OAUTH_REFRESH_TOKEN env (Secret Manager)
 *   - publisherId from settings: integrations.googleAdsense.publisherId
 *   - npm i googleapis
 */
export class AdSenseRealService implements AdSenseService {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async getRevenue(_projectId: string, _range: AdSenseRange): Promise<AdSenseRevenue[]> {
    throw new Error("AdSenseRealService not implemented — see GO_LIVE_GUIDE.md");
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async getSummary(_projectId: string, _range: AdSenseRange): Promise<AdSenseSummary> {
    throw new Error("AdSenseRealService not implemented");
  }
}
