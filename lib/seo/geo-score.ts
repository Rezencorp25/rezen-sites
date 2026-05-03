import {
  ALL_LLMS,
  type GeoCompetitorMention,
  type GeoLlmCounters,
  type GeoLlmId,
  type GeoQuery,
} from "./geo-types";

/**
 * AI Visibility Score globale 0-100 = media degli score per-LLM.
 * Razionale: ogni LLM ha audience differente; pesarli equamente evita
 * di nascondere debolezze su un singolo motore (es. score alto su ChatGPT
 * ma assente su Perplexity).
 */
export function calcGeoVisibility(
  perLlm: Record<GeoLlmId, GeoLlmCounters>,
): number {
  const llms = Object.keys(perLlm) as GeoLlmId[];
  if (llms.length === 0) return 0;
  const sum = llms.reduce((s, k) => s + perLlm[k].score, 0);
  return Math.round((sum / llms.length) * 10) / 10;
}

export function calcGeoLlmCounters(
  queries: GeoQuery[],
): Record<GeoLlmId, GeoLlmCounters> {
  const result = {} as Record<GeoLlmId, GeoLlmCounters>;
  for (const llm of ALL_LLMS) {
    let mentioned = 0;
    let rankSum = 0;
    let rankCount = 0;
    for (const q of queries) {
      const m = q.mentions[llm];
      if (!m) continue;
      if (m.mentioned) {
        mentioned++;
        if (m.rank !== null) {
          rankSum += m.rank;
          rankCount++;
        }
      }
    }
    const total = queries.length;
    const score = total > 0 ? Math.round((mentioned / total) * 1000) / 10 : 0;
    result[llm] = {
      mentioned,
      total,
      avgRank: rankCount > 0 ? Math.round((rankSum / rankCount) * 10) / 10 : null,
      score,
    };
  }
  return result;
}

/**
 * Aggregato cross-LLM dei competitor citati. Mostra chi domina lo "share of mention"
 * nelle risposte LLM relative al keyword set del progetto.
 */
export function calcGeoCompetitors(
  queries: GeoQuery[],
  ownerDomain: string,
): GeoCompetitorMention[] {
  const map = new Map<
    string,
    { count: number; rankSum: number; rankCount: number }
  >();
  for (const q of queries) {
    for (const llm of ALL_LLMS) {
      const m = q.mentions[llm];
      if (!m) continue;
      m.citedDomains.forEach((d, idx) => {
        if (d === ownerDomain) return;
        const e = map.get(d) ?? { count: 0, rankSum: 0, rankCount: 0 };
        e.count++;
        e.rankSum += idx + 1;
        e.rankCount++;
        map.set(d, e);
      });
    }
  }
  return Array.from(map.entries())
    .map(([domain, e]) => ({
      domain,
      mentionCount: e.count,
      avgRank:
        e.rankCount > 0
          ? Math.round((e.rankSum / e.rankCount) * 10) / 10
          : 0,
    }))
    .sort((a, b) => b.mentionCount - a.mentionCount)
    .slice(0, 10);
}
