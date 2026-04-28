import type { AdSenseRevenue, GoogleAdsPerformance } from "@/types";
import { NOW_ANCHOR } from "./now-anchor";

/**
 * Deterministic RNG so mock data stays stable across runs.
 */
function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

export function generateDailyAdSense(
  projectId: string,
  days = 30,
): AdSenseRevenue[] {
  const rnd = seeded(projectId.length * 137);
  const pages = [
    "/blog/best-seo-tools-2024",
    "/guides/backlink-building-strategy",
    "/reviews/luminous-engine-vs-competitors",
    "/resources/free-keyword-planner",
    "/blog/ai-content-2026",
  ];
  const start = new Date(NOW_ANCHOR);
  start.setUTCHours(0, 0, 0, 0);
  start.setUTCDate(start.getUTCDate() - (days - 1));
  const results: AdSenseRevenue[] = [];
  for (let i = 0; i < days; i++) {
    const date = new Date(start);
    date.setUTCDate(start.getUTCDate() + i);
    const trend = 1 + (i / days) * 0.4; // 40% growth over window
    const noise = 0.7 + rnd() * 0.6;
    const impressions = Math.round(3800 * trend * noise);
    const ctr = 0.014 + rnd() * 0.01;
    const revenue = Math.round(impressions * (0.004 + rnd() * 0.002) * 100) / 100;
    const rpm = Math.round((revenue / (impressions / 1000)) * 100) / 100;
    // project rollup
    results.push({
      id: `${projectId}-${date.toISOString().slice(0, 10)}`,
      projectId,
      date,
      revenue,
      impressions,
      ctr,
      rpm,
    });
    // per-page rollup (sample 3 random pages per day)
    for (let p = 0; p < 3; p++) {
      const page = pages[Math.floor(rnd() * pages.length)]!;
      const shareImpr = Math.round(impressions * (0.18 + rnd() * 0.22));
      const shareRev =
        Math.round(shareImpr * (0.004 + rnd() * 0.003) * 100) / 100;
      results.push({
        id: `${projectId}-${date.toISOString().slice(0, 10)}-${page.replace(/\W+/g, "-")}-${p}`,
        projectId,
        date,
        pageUrl: page,
        revenue: shareRev,
        impressions: shareImpr,
        ctr: 0.014 + rnd() * 0.01,
        rpm: Math.round((shareRev / (shareImpr / 1000)) * 100) / 100,
      });
    }
  }
  return results;
}

export const GOOGLE_ADS_CAMPAIGNS = [
  "brand_search",
  "competitor_attack",
  "generic_keywords",
  "display_remarketing",
  "pmax_performance",
  "video_awareness",
] as const;

export function generateGoogleAds(
  projectId: string,
  days = 30,
): GoogleAdsPerformance[] {
  const rnd = seeded(projectId.length * 911);
  const landing = [
    "/audit",
    "/contact",
    "/pricing-plans",
    "/blog/ai-seo",
    "/",
  ];
  const start = new Date(NOW_ANCHOR);
  start.setUTCHours(0, 0, 0, 0);
  start.setUTCDate(start.getUTCDate() - (days - 1));
  const results: GoogleAdsPerformance[] = [];
  for (let i = 0; i < days; i++) {
    const date = new Date(start);
    date.setUTCDate(start.getUTCDate() + i);
    for (const campaign of GOOGLE_ADS_CAMPAIGNS) {
      const baseSpend = {
        brand_search: 12,
        competitor_attack: 28,
        generic_keywords: 35,
        display_remarketing: 8,
        pmax_performance: 45,
        video_awareness: 18,
      }[campaign];
      const spend = Math.round(baseSpend * (0.7 + rnd() * 0.6) * 100) / 100;
      const cpc = Math.round((0.45 + rnd() * 1.8) * 100) / 100;
      const clicks = Math.round(spend / cpc);
      const impressions = Math.round(clicks * (22 + rnd() * 40));
      const convRate =
        { brand_search: 0.11, competitor_attack: 0.04, generic_keywords: 0.03, display_remarketing: 0.02, pmax_performance: 0.055, video_awareness: 0.008 }[campaign] *
        (0.6 + rnd() * 0.8);
      const conversions = Math.round(clicks * convRate);
      const revenue = conversions * (40 + rnd() * 60);
      const roas = Math.round((revenue / Math.max(spend, 1)) * 100) / 100;
      results.push({
        id: `${projectId}-${date.toISOString().slice(0, 10)}-${campaign}`,
        projectId,
        date,
        campaign,
        spend,
        clicks,
        impressions,
        cpc,
        conversions,
        roas,
        landingPage: landing[Math.floor(rnd() * landing.length)],
      });
    }
  }
  return results;
}
