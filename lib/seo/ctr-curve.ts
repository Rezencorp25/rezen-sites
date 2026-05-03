import type { SerpFeatureFlags } from "./seo-types";

const CTR_BY_POSITION: Record<number, number> = {
  1: 0.35,
  2: 0.15,
  3: 0.1,
  4: 0.07,
  5: 0.05,
  6: 0.04,
  7: 0.03,
  8: 0.025,
  9: 0.02,
  10: 0.018,
};

export const CTR_TOP = CTR_BY_POSITION[1];

export function ctrForPosition(pos: number): number {
  if (pos <= 0) return 0;
  if (pos <= 10) return CTR_BY_POSITION[pos];
  if (pos <= 20) return 0.008;
  if (pos <= 30) return 0.003;
  if (pos <= 100) return 0.001;
  return 0;
}

export function adjustCtrForFeatures(
  baseCtr: number,
  features: SerpFeatureFlags,
): number {
  if (features.aiOverviewOwner || features.featuredSnippetOwner) {
    return baseCtr * 1.5;
  }
  if (features.aiOverview) return baseCtr * 0.6;
  if (features.featuredSnippet) return baseCtr * 0.7;
  if (features.adsPack) return baseCtr * 0.8;
  return baseCtr;
}
