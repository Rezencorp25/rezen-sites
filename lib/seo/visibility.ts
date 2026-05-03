import type { TrackedKeyword, PositionDistribution } from "./seo-types";
import { CTR_TOP, adjustCtrForFeatures, ctrForPosition } from "./ctr-curve";

/**
 * Visibility% — formula brief §3.3 / §6.1.
 *
 * Σ (CTR_pos × volume × feature_factor) / Σ (CTR_max × volume) × 100
 */
export function calcVisibility(keywords: TrackedKeyword[]): number {
  if (keywords.length === 0) return 0;
  let earned = 0;
  let max = 0;
  for (const kw of keywords) {
    const baseCtr = ctrForPosition(kw.position);
    const adjustedCtr = adjustCtrForFeatures(baseCtr, kw.features);
    earned += adjustedCtr * kw.searchVolume;
    max += CTR_TOP * kw.searchVolume;
  }
  if (max === 0) return 0;
  return Math.round((earned / max) * 1000) / 10;
}

export function calcEstimatedTraffic(keywords: TrackedKeyword[]): number {
  let etv = 0;
  for (const kw of keywords) {
    const baseCtr = ctrForPosition(kw.position);
    const adjustedCtr = adjustCtrForFeatures(baseCtr, kw.features);
    etv += adjustedCtr * kw.searchVolume;
  }
  return Math.round(etv);
}

export function calcDistribution(
  keywords: TrackedKeyword[],
): PositionDistribution {
  const acc: PositionDistribution = {
    top3: 0,
    top10: 0,
    top20: 0,
    top100: 0,
    beyond: 0,
  };
  for (const kw of keywords) {
    const p = kw.position;
    if (p <= 0) acc.beyond++;
    else if (p <= 3) acc.top3++;
    else if (p <= 10) acc.top10++;
    else if (p <= 20) acc.top20++;
    else if (p <= 100) acc.top100++;
    else acc.beyond++;
  }
  return acc;
}

export type KeywordContribution = {
  keywordId: string;
  keyword: string;
  position: number;
  searchVolume: number;
  baseCtr: number;
  adjustedCtr: number;
  estimatedClicks: number;
  contributionPct: number;
};

/**
 * Decomposizione contributo per keyword al Visibility totale.
 * Usata nella tabella di drill della pagina /seo.
 */
export function decomposeContribution(
  keywords: TrackedKeyword[],
): KeywordContribution[] {
  const totalEarned = calcEstimatedTraffic(keywords);
  if (totalEarned === 0) {
    return keywords.map((kw) => ({
      keywordId: kw.id,
      keyword: kw.keyword,
      position: kw.position,
      searchVolume: kw.searchVolume,
      baseCtr: 0,
      adjustedCtr: 0,
      estimatedClicks: 0,
      contributionPct: 0,
    }));
  }
  return keywords
    .map((kw) => {
      const baseCtr = ctrForPosition(kw.position);
      const adjustedCtr = adjustCtrForFeatures(baseCtr, kw.features);
      const estimatedClicks = adjustedCtr * kw.searchVolume;
      return {
        keywordId: kw.id,
        keyword: kw.keyword,
        position: kw.position,
        searchVolume: kw.searchVolume,
        baseCtr,
        adjustedCtr,
        estimatedClicks: Math.round(estimatedClicks),
        contributionPct:
          Math.round((estimatedClicks / totalEarned) * 1000) / 10,
      };
    })
    .sort((a, b) => b.estimatedClicks - a.estimatedClicks);
}
