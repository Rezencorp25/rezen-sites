/**
 * Action items deriver (S8 Reports PDF).
 *
 * Combina segnali da SEO + AEO + GEO + AI Search Health per estrarre top 5
 * azioni concrete con effort tag + impact estimate. Mostrato in pagina 7 del PDF.
 *
 * Mirror code: usato sia in functions/src/reports/* (per generazione PDF) sia
 * in client (potrebbe servire come preview futuro). Logica pura, no IO.
 */

import type { GeoSnapshot } from "@/lib/seo/geo-types";
import type { CitationMetrics } from "@/lib/seo/citations";
import type { AiSearchHealth } from "@/lib/seo/ai-search-health-types";

export type ActionItem = {
  /** Modulo di provenienza per icon UI. */
  source: "seo" | "aeo" | "geo" | "aish";
  /** Severity per ordinamento (high = priorità). */
  severity: "high" | "medium" | "low";
  /** Effort stimato per il cliente. */
  effort: "low" | "medium" | "high";
  /** Titolo breve (1 riga). */
  title: string;
  /** Spiegazione (2-3 righe). */
  detail: string;
};

export type ActionItemsInput = {
  geoSnapshot?: GeoSnapshot | null;
  citationMetrics?: CitationMetrics | null;
  aiSearchHealth?: AiSearchHealth | null;
  /** Top 10 keyword con posizione (per identificare scese di rank o opportunità). */
  topKeywords?: Array<{
    keyword: string;
    position: number;
    prevPosition: number | null;
    searchVolume: number;
  }>;
};

/**
 * Estrae top N action items ordinati per impact (severity × inverse effort).
 * Default N=5.
 */
export function deriveActionItems(
  input: ActionItemsInput,
  topN = 5,
): ActionItem[] {
  const items: ActionItem[] = [];

  // 1. AI Search Health: bot bloccati = critical
  const aish = input.aiSearchHealth;
  if (aish) {
    const blockedBots = aish.bots.filter((b) => b.status === "blocked");
    if (blockedBots.length >= 2) {
      items.push({
        source: "aish",
        severity: "high",
        effort: "low",
        title: `${blockedBots.length} bot LLM bloccati in robots.txt`,
        detail: `${blockedBots.map((b) => b.bot).slice(0, 3).join(", ")} non possono indicizzare il sito. Rimuovi le righe Disallow per questi User-Agent in robots.txt — fix in 5 minuti, sblocca visibilità su ChatGPT/Claude/Perplexity.`,
      });
    }
    if (aish.pagesWithNoaiMeta > 0) {
      items.push({
        source: "aish",
        severity: "high",
        effort: "low",
        title: `${aish.pagesWithNoaiMeta} pagine con meta noai/noimageai`,
        detail: `Queste pagine sono escluse esplicitamente dal training/indicizzazione AI. Se non è una scelta voluta (es. content riservato), rimuovi i meta dalle pagine pubbliche per essere citato dagli LLM.`,
      });
    }
    if (!aish.sitemapFound || (aish.sitemapUrlCount ?? 0) === 0) {
      items.push({
        source: "aish",
        severity: "medium",
        effort: "medium",
        title: "sitemap.xml mancante o vuota",
        detail: "Senza sitemap, i bot LLM scoprono solo le pagine raggiungibili da link interni. Genera sitemap.xml dinamica (es. /sitemap.xml che lista tutte le pagine pubbliche) per copertura completa.",
      });
    }
  }

  // 2. GEO citation rate: opportunità content
  const cit = input.citationMetrics;
  if (cit && cit.totalMentions > 0 && cit.citationRate < 25) {
    items.push({
      source: "geo",
      severity: "medium",
      effort: "high",
      title: `Citation rate basso: ${cit.citationRate.toFixed(1)}%`,
      detail: `Sei citato testualmente ${cit.totalMentions} volte ma con link cliccabile solo ${cit.totalCitations} volte. Crea content che invita link diretti: FAQ pages, guide tecniche con esempi, ricerche originali con dati propri. Target ≥40%.`,
    });
  }

  // 3. GEO sentiment negative
  const geo = input.geoSnapshot;
  if (geo) {
    const negativeMentions = geo.queries.flatMap((q) =>
      Object.values(q.mentions).filter((m) => m.sentiment === "negative"),
    );
    if (negativeMentions.length >= 2) {
      items.push({
        source: "geo",
        severity: "high",
        effort: "high",
        title: `${negativeMentions.length} mention con sentiment negativo`,
        detail: "Gli LLM citano il brand in contesti che riducono trust. Risposta: produci content correttivo (case study di successo, testimonial, certificazioni) o PR di risposta diretta sui topic problematici.",
      });
    }
    // GEO query con 0 mention cross-LLM = opportunità
    const zeroMentionQueries = geo.queries.filter((q) =>
      Object.values(q.mentions).every((m) => !m.mentioned),
    );
    if (zeroMentionQueries.length >= 5) {
      const topVol = zeroMentionQueries
        .sort((a, b) => b.searchVolume - a.searchVolume)
        .slice(0, 3);
      items.push({
        source: "geo",
        severity: "medium",
        effort: "high",
        title: `${zeroMentionQueries.length} query GEO senza mention`,
        detail: `Top opportunità: "${topVol.map((q) => q.query).join('", "')}". Crea pillar content + FAQ ottimizzate per essere citate dagli LLM (struttura Q&A, esempi pratici, source autorevoli).`,
      });
    }
  }

  // 4. SEO keyword scese di rank (top opportunità per recovery)
  const kws = input.topKeywords ?? [];
  const droppedKeywords = kws
    .filter((k) => k.prevPosition !== null && k.position - k.prevPosition >= 3)
    .sort((a, b) => b.searchVolume * (b.position - (b.prevPosition ?? b.position)) - a.searchVolume * (a.position - (a.prevPosition ?? a.position)))
    .slice(0, 3);
  if (droppedKeywords.length > 0) {
    items.push({
      source: "seo",
      severity: "high",
      effort: "medium",
      title: `${droppedKeywords.length} keyword in calo significativo`,
      detail: `Top decadenze: ${droppedKeywords.map((k) => `"${k.keyword}" pos. ${k.prevPosition}→${k.position}`).join(", ")}. Verifica se la SERP ha cambiato intent, aggiorna content con dati 2026, controlla che la pagina canonica abbia indexing OK.`,
    });
  }

  // 5. SEO opportunità top10 (keyword in pos 11-20 con alto volume)
  const top10Opportunities = kws
    .filter((k) => k.position >= 11 && k.position <= 20 && k.searchVolume > 100)
    .sort((a, b) => b.searchVolume - a.searchVolume)
    .slice(0, 3);
  if (top10Opportunities.length > 0) {
    items.push({
      source: "seo",
      severity: "medium",
      effort: "medium",
      title: `${top10Opportunities.length} keyword vicino al top 10`,
      detail: `Quick win: ${top10Opportunities.map((k) => `"${k.keyword}" (pos. ${k.position}, ${k.searchVolume}/mo)`).join(", ")}. Migliora internal linking, aggiungi FAQ schema, espandi content con keyword secondarie correlate.`,
    });
  }

  // Ordina per impact (severity high first, poi low effort first)
  const sevRank = { high: 0, medium: 1, low: 2 };
  const effRank = { low: 0, medium: 1, high: 2 };
  items.sort((a, b) => {
    if (sevRank[a.severity] !== sevRank[b.severity]) {
      return sevRank[a.severity] - sevRank[b.severity];
    }
    return effRank[a.effort] - effRank[b.effort];
  });

  return items.slice(0, topN);
}

export type ProjectActionInput = {
  projectId: string;
  projectName: string;
  domain: string;
} & ActionItemsInput;

export type AggregatedActionItem = ActionItem & {
  projectId: string;
  projectName: string;
  domain: string;
  /** Stable key derivata da source+title+projectId per resolved tracking. */
  key: string;
};

export function actionItemKey(
  projectId: string,
  source: ActionItem["source"],
  title: string,
): string {
  // Stable hash leggero: lowercase + alphanumeric only.
  const normalized = `${projectId}|${source}|${title}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return normalized.slice(0, 120);
}

/**
 * Aggrega action items cross-progetto. Ogni item include projectId+projectName
 * per deeplink + label. Ordinamento globale per severity → effort → severity (high
 * prima sempre).
 */
export function aggregateActionsAcrossProjects(
  projects: ProjectActionInput[],
  topN = 10,
): AggregatedActionItem[] {
  const all: AggregatedActionItem[] = [];
  for (const p of projects) {
    // Per progetto deriviamo TUTTI gli items (no top N), poi merge.
    const items = deriveActionItems(p, 100);
    for (const it of items) {
      all.push({
        ...it,
        projectId: p.projectId,
        projectName: p.projectName,
        domain: p.domain,
        key: actionItemKey(p.projectId, it.source, it.title),
      });
    }
  }

  const sevRank = { high: 0, medium: 1, low: 2 };
  const effRank = { low: 0, medium: 1, high: 2 };
  all.sort((a, b) => {
    if (sevRank[a.severity] !== sevRank[b.severity]) {
      return sevRank[a.severity] - sevRank[b.severity];
    }
    return effRank[a.effort] - effRank[b.effort];
  });

  return all.slice(0, topN);
}
