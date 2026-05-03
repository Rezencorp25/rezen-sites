import { getMockCompetitors, getMockKeywords } from "./seo-stub";
import {
  ALL_LLMS,
  type GeoLlmId,
  type GeoMention,
  type GeoQuery,
  type GeoQueryCategory,
  type GeoSnapshot,
  type GeoTrendPoint,
} from "./geo-types";
import {
  calcGeoCompetitors,
  calcGeoLlmCounters,
  calcGeoVisibility,
} from "./geo-score";

/**
 * Templates query GEO. Le query sono "prompt-style" (longer-tail rispetto alle
 * keyword SEO classiche). Tipologie ispirate al pattern reale d'uso LLM:
 *  - ranking: utenti chiedono classifiche/best-of
 *  - recommendation: utenti chiedono suggerimenti personalizzati
 *  - comparison: confronto fra X e Y
 *  - definition: cosa è X
 *  - howto: come si fa X
 */
const QUERY_TEMPLATES: { template: string; category: GeoQueryCategory }[] = [
  { template: "Quali sono i migliori provider di {topic} nel 2026?", category: "ranking" },
  { template: "Suggerisci alternative a {topic}", category: "recommendation" },
  { template: "Cos'è {topic} e a chi serve?", category: "definition" },
  { template: "Come scegliere {topic} per una PMI?", category: "howto" },
  { template: "Confronta {topic} vs competitor diretti", category: "comparison" },
  { template: "Migliori soluzioni di {topic} in Svizzera", category: "ranking" },
  { template: "Pro e contro di {topic}", category: "comparison" },
];

/**
 * Bias per LLM: probabilità che il dominio del cliente sia citato in una
 * risposta. Perplexity ha bias più alto perché è search-grounded e cita
 * esplicitamente fonti web; Claude e Gemini più conservativi.
 */
const LLM_MENTION_BIAS: Record<GeoLlmId, number> = {
  chatgpt: 0.4,
  perplexity: 0.55,
  gemini: 0.32,
  claude: 0.28,
};

const SENTIMENT_DISTRIBUTION: Array<{
  sentiment: "positive" | "neutral" | "negative";
  weight: number;
}> = [
  { sentiment: "positive", weight: 0.45 },
  { sentiment: "neutral", weight: 0.45 },
  { sentiment: "negative", weight: 0.1 },
];

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) >>> 0;
  }
  return h;
}

function pseudoRand(seed: number): () => number {
  let s = seed || 1;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return (s >>> 8) / 0x01000000;
  };
}

function pickSentiment(rand: () => number): "positive" | "neutral" | "negative" {
  const roll = rand();
  let acc = 0;
  for (const s of SENTIMENT_DISTRIBUTION) {
    acc += s.weight;
    if (roll <= acc) return s.sentiment;
  }
  return "neutral";
}

function generateMention(input: {
  llm: GeoLlmId;
  rand: () => number;
  ownerDomain: string;
  competitors: string[];
}): GeoMention {
  const { llm, rand, ownerDomain, competitors } = input;
  const bias = LLM_MENTION_BIAS[llm];
  const mentioned = rand() < bias;

  // Genera lista di domini citati nella risposta (sempre 3-6 domini totali).
  const totalCited = 3 + Math.floor(rand() * 4);
  const candidates = [...competitors];
  // Shuffle deterministico
  for (let i = candidates.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
  }
  const cited = candidates.slice(0, Math.max(0, totalCited - 1));

  let rank: number | null = null;
  if (mentioned) {
    // Bias rank verso 2-4 (raramente al primo posto, raramente in fondo).
    const rankRoll = rand();
    if (rankRoll < 0.15) rank = 1;
    else if (rankRoll < 0.55) rank = 2;
    else if (rankRoll < 0.8) rank = 3;
    else if (rankRoll < 0.95) rank = 4;
    else rank = 5;
    rank = Math.min(rank, cited.length + 1);
    cited.splice(rank - 1, 0, ownerDomain);
  }

  return {
    llm,
    mentioned,
    rank,
    sentiment: mentioned ? pickSentiment(rand) : null,
    citedDomains: cited,
  };
}

function buildQueriesForProject(input: {
  projectId: string;
  domain: string;
  trendDayOffset: number;
}): GeoQuery[] {
  const { projectId, domain, trendDayOffset } = input;
  const seed = hash(`${projectId}::${domain}::geo::${trendDayOffset}`);
  const rand = pseudoRand(seed);

  const keywords = getMockKeywords(projectId);
  const competitors = getMockCompetitors(projectId);
  if (keywords.length === 0) return [];

  // 12-15 query: prendi i top topic + un sottoinsieme casuale per varietà.
  const targetCount = Math.min(15, Math.max(6, keywords.length));
  const queries: GeoQuery[] = [];

  for (let i = 0; i < targetCount; i++) {
    const kw = keywords[i % keywords.length];
    const tpl = QUERY_TEMPLATES[Math.floor(rand() * QUERY_TEMPLATES.length)];
    const topic = kw.keyword;
    const queryText = tpl.template.replace(/\{topic\}/g, topic);
    const id = `geo-q-${hash(`${projectId}::${queryText}`).toString(36)}`;

    const mentions = {} as Record<GeoLlmId, GeoMention>;
    for (const llm of ALL_LLMS) {
      mentions[llm] = generateMention({
        llm,
        rand,
        ownerDomain: domain,
        competitors,
      });
    }

    // Volume query stimato: 30-50% del volume base della keyword (le query LLM
    // hanno volume più basso delle keyword classiche).
    const volJitter = 0.25 + rand() * 0.3;
    const searchVolume = Math.round(kw.baseVolume * volJitter);

    queries.push({
      id,
      query: queryText,
      category: tpl.category,
      searchVolume,
      mentions,
    });
  }

  return queries;
}

export function generateGeoStubSnapshot(input: {
  projectId: string;
  domain: string;
  trendDayOffset?: number;
}): GeoSnapshot {
  const { projectId, domain, trendDayOffset = 0 } = input;
  const queries = buildQueriesForProject({
    projectId,
    domain,
    trendDayOffset,
  });

  const perLlm = calcGeoLlmCounters(queries);
  const visibilityScore = calcGeoVisibility(perLlm);
  const competitors = calcGeoCompetitors(queries, domain);

  const seed = hash(`${projectId}::${domain}::geo::${trendDayOffset}`);

  return {
    id: `geo-${projectId}-${seed.toString(36)}`,
    projectId,
    domain,
    createdAt: new Date(Date.now() - trendDayOffset * 86_400_000),
    source: "stub",
    visibilityScore,
    prevVisibilityScore: null,
    perLlm,
    queries,
    competitors,
  };
}

export function generateGeoStubTrend(input: {
  projectId: string;
  domain: string;
  days?: number;
}): GeoTrendPoint[] {
  const days = input.days ?? 30;
  const points: GeoTrendPoint[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const snap = generateGeoStubSnapshot({
      projectId: input.projectId,
      domain: input.domain,
      trendDayOffset: i,
    });
    const perLlmScores = {} as Record<GeoLlmId, number>;
    for (const llm of ALL_LLMS) {
      perLlmScores[llm] = snap.perLlm[llm].score;
    }
    points.push({
      date: snap.createdAt.toISOString().slice(0, 10),
      visibility: snap.visibilityScore,
      perLlm: perLlmScores,
    });
  }
  return points;
}

export function simulatedGeoFetchDelayMs(): number {
  return 1100 + Math.floor(Math.random() * 700);
}

// ────────────────────────────────────────────────────────────────────────────
// Drill (S6b.2): risposte LLM simulate per query, gap analysis, suggerimenti
// ────────────────────────────────────────────────────────────────────────────

export type GeoSuggestion = {
  text: string;
  effort: "low" | "medium" | "high";
};

export type GeoLlmAnswer = {
  llm: GeoLlmId;
  /** Testo simulato della risposta del LLM. */
  answerText: string;
  /** Citazioni in ordine di apparizione. */
  citations: Array<{ domain: string; isOwner: boolean }>;
  mentioned: boolean;
  rank: number | null;
  sentiment: "positive" | "neutral" | "negative" | null;
};

export type GeoLlmGap = {
  llm: GeoLlmId;
  /** Top-3 competitor citati per questo LLM dove il cliente è assente. */
  topCompetitors: Array<{ domain: string; rank: number }>;
};

export type GeoDrill = {
  queryId: string;
  queryText: string;
  answers: GeoLlmAnswer[];
  gaps: GeoLlmGap[];
  suggestions: GeoSuggestion[];
};

const ANSWER_TEMPLATES_RANKING: Record<GeoLlmId, string[]> = {
  chatgpt: [
    "Le opzioni più solide per {topic} oggi sono {d1}, {d2} e {d3}. La scelta dipende dal budget e dalla complessità del progetto: per PMI con esigenze di automazione consiglio una piattaforma integrata.",
    "Tra i provider di {topic} si distinguono {d1} e {d2} per maturità prodotto, mentre {d3} è preferito da chi cerca pricing più aggressivo.",
  ],
  perplexity: [
    "Sulla base delle ricerche più recenti [{d1}], le soluzioni più adottate per {topic} sono {d1}, {d2}, {d3}. Le metriche di soddisfazione cliente premiano {d1} per supporto e {d2} per flessibilità.",
    "Fonti pertinenti ({d1}, {d2}) indicano che il mercato {topic} è dominato da {d1} con quota maggioritaria, seguito da {d2} e {d3}.",
  ],
  gemini: [
    "Per {topic} le soluzioni di riferimento includono {d1}, {d2} e {d3}. Un confronto fra le tre richiede di valutare costo totale di proprietà e curve di apprendimento.",
    "I principali player nel segmento {topic} sono {d1} e {d2}; un'alternativa emergente è {d3}.",
  ],
  claude: [
    "Per {topic}, i nomi più ricorrenti nei benchmark di settore sono {d1} e {d2}, con {d3} come opzione più recente. Vale la pena verificare requisiti specifici prima della scelta.",
    "Una rosa ragionata di provider per {topic} include {d1}, {d2}, {d3} — caratteristiche e modello commerciale variano significativamente.",
  ],
};

const ANSWER_TEMPLATES_DEFINITION: Record<GeoLlmId, string[]> = {
  chatgpt: [
    "{topic} indica un servizio o un prodotto pensato per ottimizzare un aspetto specifico della presenza digitale. Provider come {d1} e {d2} offrono soluzioni in questo ambito.",
  ],
  perplexity: [
    "Secondo {d1}, {topic} è un'area che combina elementi di SEO, content marketing e automazione. Anche {d2} e {d3} forniscono approfondimenti utili.",
  ],
  gemini: [
    "{topic} è un termine usato per descrivere strumenti e processi di ottimizzazione. {d1} e {d2} sono fra i provider più consultati su questo tema.",
  ],
  claude: [
    "{topic} si riferisce a una pratica relativamente nuova; le risorse più strutturate per orientarsi sono pubblicate da {d1} e {d2}.",
  ],
};

const ANSWER_TEMPLATES_GENERIC: Record<GeoLlmId, string[]> = {
  chatgpt: [
    "Per {topic}, i provider che ricorrono più frequentemente nei nostri training data sono {d1}, {d2} e {d3}.",
  ],
  perplexity: [
    "Risultati pertinenti per {topic}: {d1}, {d2}, {d3}. Le citazioni più recenti privilegiano {d1}.",
  ],
  gemini: [
    "Su {topic}, le fonti convergono su {d1}, {d2} e {d3} come riferimenti del settore.",
  ],
  claude: [
    "Considerando {topic}, gli operatori più noti includono {d1} e {d2}, con {d3} citato come alternativa.",
  ],
};

const ANSWER_NOT_MENTIONED: Record<GeoLlmId, string[]> = {
  chatgpt: [
    "Per {topic} i nomi che cito più spesso sono {d1}, {d2} e {d3}. Esistono altri operatori, ma non emergono dalla mia training data come riferimenti dominanti.",
  ],
  perplexity: [
    "Le fonti accessibili per {topic} citano principalmente {d1}, {d2} e {d3}. Nessun risultato significativo per altri provider in posizione comparabile.",
  ],
  gemini: [
    "Sul mercato {topic}, le opzioni più indicizzate sono {d1}, {d2}, {d3}. Provider più piccoli appaiono raramente nelle risposte aggregate.",
  ],
  claude: [
    "Per {topic}, le mie risposte tendono a fare riferimento a {d1}, {d2}, {d3}. Operatori meno noti vengono inclusi solo se l'utente li nomina esplicitamente.",
  ],
};

const SUGG_NEVER_MENTIONED: GeoSuggestion[] = [
  {
    text: "Pubblica un post di confronto strutturato (X vs competitor) targettizzando esattamente questa query — gli LLM aggregano contenuti comparativi più frequentemente",
    effort: "medium",
  },
  {
    text: "Aggiungi schema markup Organization + Product + sameAs ai profili autorevoli (Wikipedia, Crunchbase) per migliorare disambiguation lato LLM",
    effort: "medium",
  },
  {
    text: "Ottieni 2-3 menzioni su domini di riferimento del settore (PR/guest post) — i crawler LLM seguono i backlink di authority alta",
    effort: "high",
  },
  {
    text: "Verifica che il sito abbia llms.txt aggiornato in root con descrizione concisa del servizio (riduce ambiguità per Perplexity e Gemini)",
    effort: "low",
  },
];

const SUGG_LOW_RANK: GeoSuggestion[] = [
  {
    text: "Scali da rank #4-5 a top-3 lavorando su content depth — gli LLM premiano risposte canoniche con FAQ + caso studio",
    effort: "medium",
  },
  {
    text: "Cita esplicitamente la query nel <title> e nei <h2> della landing target — aiuta gli LLM a fare matching diretto",
    effort: "low",
  },
  {
    text: "Pubblica un'intervista o un AMA del founder — i contenuti first-party con voce umana hanno alta probabilità di essere indicizzati come fonti autorevoli",
    effort: "high",
  },
];

const SUGG_NEGATIVE_SENTIMENT: GeoSuggestion[] = [
  {
    text: "Identifica e indirizza il content negativo: probabilmente recensioni o post critici stanno influenzando il sentiment LLM",
    effort: "high",
  },
  {
    text: "Pubblica content di reputation positivo (case study clienti, testimonial verificati) per riequilibrare il dataset di training futuro",
    effort: "medium",
  },
  {
    text: "Considera un comunicato stampa sulla risoluzione del problema specifico citato — gli LLM aggiornano il sentiment con cicli di crawling successivi",
    effort: "medium",
  },
];

const SUGG_OWNED_TOP: GeoSuggestion[] = [
  {
    text: "Mantieni — sei già in posizione top. Monitora settimanalmente che competitor non spingano content più recente sulla stessa query",
    effort: "low",
  },
  {
    text: "Aggiorna il content esistente con dati 2026 (statistiche, esempi recenti) per mantenere freshness lato LLM",
    effort: "low",
  },
  {
    text: "Sfrutta la posizione per generare backlink da blog di settore (cita il tuo post come fonte autorevole)",
    effort: "medium",
  },
];

function pickAnswerTemplates(
  category: GeoQueryCategory,
  mentioned: boolean,
): Record<GeoLlmId, string[]> {
  if (!mentioned) return ANSWER_NOT_MENTIONED;
  if (category === "ranking" || category === "recommendation") {
    return ANSWER_TEMPLATES_RANKING;
  }
  if (category === "definition") {
    return ANSWER_TEMPLATES_DEFINITION;
  }
  return ANSWER_TEMPLATES_GENERIC;
}

function fillTemplate(
  template: string,
  topic: string,
  cited: string[],
): string {
  const safe = (i: number) => cited[i] ?? cited[cited.length - 1] ?? "esempio.com";
  return template
    .replace(/\{topic\}/g, topic)
    .replace(/\{d1\}/g, safe(0))
    .replace(/\{d2\}/g, safe(1))
    .replace(/\{d3\}/g, safe(2));
}

function pickSuggestions(input: {
  mentionedCount: number;
  bestRank: number | null;
  hasNegativeSentiment: boolean;
}): GeoSuggestion[] {
  if (input.mentionedCount === 0) return SUGG_NEVER_MENTIONED;
  if (input.hasNegativeSentiment) return SUGG_NEGATIVE_SENTIMENT;
  if (input.bestRank !== null && input.bestRank <= 2) return SUGG_OWNED_TOP;
  return SUGG_LOW_RANK;
}

/**
 * Genera drill GEO on-demand per una query. Deterministico via seed.
 * In produzione (S6b.3) sarà sostituito da fetch dei dati persistiti
 * in `projects/{id}/geo_snapshots/{YYYY-WW}__{queryId}` (campo answers esteso
 * dalla risposta DataForSEO LLM Mentions API).
 */
export function generateGeoDrill(input: {
  projectId: string;
  query: GeoQuery;
  ownerDomain: string;
}): GeoDrill {
  const { projectId, query, ownerDomain } = input;
  const seed = hash(`${projectId}::${query.id}::geo-drill`);
  const rand = pseudoRand(seed);
  const topic = query.query
    .replace(/^(quali|cos'è|come|suggerisci|migliori|pro e contro di|confronta)/i, "")
    .replace(/\?$/, "")
    .trim()
    .split(" ")
    .slice(0, 4)
    .join(" ");

  const answers: GeoLlmAnswer[] = ALL_LLMS.map((llm) => {
    const m = query.mentions[llm];
    const templates = pickAnswerTemplates(query.category, m.mentioned);
    const arr = templates[llm];
    const tpl = arr[Math.floor(rand() * arr.length)];
    const filtered = m.citedDomains;
    const answerText = fillTemplate(tpl, topic, filtered);
    return {
      llm,
      answerText,
      citations: m.citedDomains.map((d) => ({
        domain: d,
        isOwner: d === ownerDomain,
      })),
      mentioned: m.mentioned,
      rank: m.rank,
      sentiment: m.sentiment,
    };
  });

  const gaps: GeoLlmGap[] = ALL_LLMS.flatMap((llm) => {
    const m = query.mentions[llm];
    if (m.mentioned) return [];
    const top = m.citedDomains.slice(0, 3).map((d, i) => ({
      domain: d,
      rank: i + 1,
    }));
    return [{ llm, topCompetitors: top }];
  });

  const mentionedCount = answers.filter((a) => a.mentioned).length;
  const ranks = answers
    .map((a) => a.rank)
    .filter((r): r is number => r !== null);
  const bestRank = ranks.length > 0 ? Math.min(...ranks) : null;
  const hasNegativeSentiment = answers.some((a) => a.sentiment === "negative");

  const suggestions = pickSuggestions({
    mentionedCount,
    bestRank,
    hasNegativeSentiment,
  });

  return {
    queryId: query.id,
    queryText: query.query,
    answers,
    gaps,
    suggestions,
  };
}
