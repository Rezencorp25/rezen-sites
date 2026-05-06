import {
  ALL_LLMS,
  type GeoLlmId,
  type GeoSnapshot,
} from "./geo-types";

/**
 * Citations vs Mentions metrics (S6c.2 / brief KPI v1.0 §4.5).
 *
 * Distinzione chiave:
 * - **Mention testuale**: il brand appare nel testo della risposta LLM senza link.
 *   Valore: brand awareness pura.
 * - **Citation**: il brand è citato con URL cliccabile (hyperlink).
 *   Valore: brand awareness + traffico click-through (Perplexity, ChatGPT con browsing).
 *
 * Citation rate target: ≥40% (sotto, il content è "menzionato ma non scopribile").
 */

export type CitationMetrics = {
  /** Numero totale mention del cliente cross-LLM. */
  totalMentions: number;
  /** Numero mention che sono citation (link cliccabile). */
  totalCitations: number;
  /** Citation rate % = totalCitations / totalMentions × 100. 0 se nessuna mention. */
  citationRate: number;
  /** Breakdown per LLM. */
  perLlm: Record<GeoLlmId, { mentions: number; citations: number; rate: number }>;
};

export function calcCitationMetrics(snapshot: GeoSnapshot): CitationMetrics {
  const perLlm = {} as CitationMetrics["perLlm"];
  for (const llm of ALL_LLMS) {
    perLlm[llm] = { mentions: 0, citations: 0, rate: 0 };
  }

  let totalMentions = 0;
  let totalCitations = 0;

  for (const q of snapshot.queries) {
    for (const llm of ALL_LLMS) {
      const m = q.mentions[llm];
      if (!m?.mentioned) continue;
      perLlm[llm].mentions++;
      totalMentions++;
      if (m.isCitation) {
        perLlm[llm].citations++;
        totalCitations++;
      }
    }
  }

  for (const llm of ALL_LLMS) {
    const c = perLlm[llm];
    c.rate = c.mentions > 0
      ? Math.round((c.citations / c.mentions) * 1000) / 10
      : 0;
  }

  return {
    totalMentions,
    totalCitations,
    citationRate:
      totalMentions > 0
        ? Math.round((totalCitations / totalMentions) * 1000) / 10
        : 0,
    perLlm,
  };
}

export type CitedPageEntry = {
  url: string;
  /** Path della pagina (per display). */
  path: string;
  /** Numero citazioni cross-LLM. */
  count: number;
  /** Lista LLM che hanno citato questa pagina (con duplicati per query). */
  citingLlms: GeoLlmId[];
  /** Lista query da cui è citata. */
  queries: Array<{ id: string; query: string; llm: GeoLlmId }>;
};

/**
 * Top N pagine cliente più citate dagli LLM.
 * Ordina per count discendente. In live mode aggregato su window 30gg
 * (oggi solo snapshot corrente).
 */
export function calcTopCitedPages(
  snapshot: GeoSnapshot,
  topN = 5,
): CitedPageEntry[] {
  const map = new Map<string, CitedPageEntry>();

  for (const q of snapshot.queries) {
    for (const llm of ALL_LLMS) {
      const m = q.mentions[llm];
      if (!m?.mentioned || !m.isCitation || !m.citedUrl) continue;
      const url = m.citedUrl;
      const path = extractPath(url);
      const existing = map.get(url);
      if (existing) {
        existing.count++;
        existing.citingLlms.push(llm);
        existing.queries.push({ id: q.id, query: q.query, llm });
      } else {
        map.set(url, {
          url,
          path,
          count: 1,
          citingLlms: [llm],
          queries: [{ id: q.id, query: q.query, llm }],
        });
      }
    }
  }

  return Array.from(map.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, topN);
}

function extractPath(url: string): string {
  try {
    const u = new URL(url);
    return u.pathname || "/";
  } catch {
    return url;
  }
}

/**
 * Etichetta qualitativa del citation rate. Usata per badge UI.
 *  - excellent: >60%
 *  - good: 40-60%
 *  - low: 20-40%
 *  - poor: <20%
 */
export type CitationRateBand = "excellent" | "good" | "low" | "poor";

export function citationRateBand(rate: number): CitationRateBand {
  if (rate >= 60) return "excellent";
  if (rate >= 40) return "good";
  if (rate >= 20) return "low";
  return "poor";
}
