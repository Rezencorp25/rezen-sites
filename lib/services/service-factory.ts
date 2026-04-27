import { MockAnalyticsService } from "./analytics/mock-analytics-service";
import { GA4AnalyticsService } from "./analytics/ga4-analytics-service";
import type { AnalyticsService } from "./analytics/types";

import { MockAdsService } from "./ads/mock-ads-service";
import { GoogleAdsService } from "./ads/google-ads-service";
import type { AdsService } from "./ads/types";

import { MockAdSenseService } from "./adsense/mock-adsense-service";
import { AdSenseRealService } from "./adsense/adsense-real-service";
import type { AdSenseService } from "./adsense/types";

import { MockSeoService } from "./seo/mock-seo-service";
import { PageSpeedSeoService } from "./seo/pagespeed-seo-service";
import type { SeoDataService } from "./seo/types";

/**
 * Service factory — single switch from mock to real backends.
 *
 * Master env: NEXT_PUBLIC_DATA_MODE = "mock" (default) | "real"
 * Granular envs (override master per-domain at go-live):
 *   - NEXT_PUBLIC_DATA_MODE_ANALYTICS
 *   - NEXT_PUBLIC_DATA_MODE_ADS
 *   - NEXT_PUBLIC_DATA_MODE_ADSENSE
 *   - NEXT_PUBLIC_DATA_MODE_SEO
 *
 * See GO_LIVE_GUIDE.md for the migration procedure.
 */
type Mode = "mock" | "real";

function resolveMode(domainEnv: string | undefined): Mode {
  const master = (process.env.NEXT_PUBLIC_DATA_MODE as Mode | undefined) ?? "mock";
  const granular = domainEnv as Mode | undefined;
  return granular ?? master;
}

export const analytics: AnalyticsService =
  resolveMode(process.env.NEXT_PUBLIC_DATA_MODE_ANALYTICS) === "real"
    ? new GA4AnalyticsService()
    : new MockAnalyticsService();

export const ads: AdsService =
  resolveMode(process.env.NEXT_PUBLIC_DATA_MODE_ADS) === "real"
    ? new GoogleAdsService()
    : new MockAdsService();

export const adsense: AdSenseService =
  resolveMode(process.env.NEXT_PUBLIC_DATA_MODE_ADSENSE) === "real"
    ? new AdSenseRealService()
    : new MockAdSenseService();

export const seo: SeoDataService =
  resolveMode(process.env.NEXT_PUBLIC_DATA_MODE_SEO) === "real"
    ? new PageSpeedSeoService()
    : new MockSeoService();

export const dataMode = {
  analytics: resolveMode(process.env.NEXT_PUBLIC_DATA_MODE_ANALYTICS),
  ads: resolveMode(process.env.NEXT_PUBLIC_DATA_MODE_ADS),
  adsense: resolveMode(process.env.NEXT_PUBLIC_DATA_MODE_ADSENSE),
  seo: resolveMode(process.env.NEXT_PUBLIC_DATA_MODE_SEO),
};
