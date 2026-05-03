import { generateStubSnapshot } from "./seo-stub";
import {
  buildAeoKeywordRows,
  calcAeoOpportunities,
  calcAeoOwnership,
  calcAeoScore,
} from "./aeo-score";
import type { AeoKeywordRow, AeoSnapshot, AeoTrendPoint } from "./aeo-types";

/**
 * Genera snapshot AEO derivandolo dal SEO snapshot stub.
 * In produzione (S6.3) sarà sostituito da `runAeoTracking` Cloud Function
 * che parsea SERP feature dalla risposta DataForSEO.
 */
export function generateAeoStubSnapshot(input: {
  projectId: string;
  domain: string;
  trendDayOffset?: number;
}): AeoSnapshot {
  const { projectId, domain, trendDayOffset = 0 } = input;
  const seoSnap = generateStubSnapshot({
    projectId,
    domain,
    trendDayOffset,
    source: "stub",
  });

  const aeoScore = calcAeoScore(seoSnap.keywords);
  const ownership = calcAeoOwnership(seoSnap.keywords);
  const keywords = buildAeoKeywordRows(seoSnap.keywords);
  const opportunities = calcAeoOpportunities(seoSnap.keywords);

  return {
    id: `aeo-${seoSnap.id}`,
    projectId,
    domain,
    createdAt: seoSnap.createdAt,
    source: "stub",
    aeoScore,
    prevAeoScore: null,
    ownership,
    keywords,
    opportunities,
  };
}

export function generateAeoStubTrend(input: {
  projectId: string;
  domain: string;
  days?: number;
}): AeoTrendPoint[] {
  const days = input.days ?? 30;
  const points: AeoTrendPoint[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const snap = generateAeoStubSnapshot({
      projectId: input.projectId,
      domain: input.domain,
      trendDayOffset: i,
    });
    points.push({
      date: snap.createdAt.toISOString().slice(0, 10),
      aeoScore: snap.aeoScore,
      aiOverviewOwned: snap.ownership.aiOverviewOwned,
      featuredSnippetOwned: snap.ownership.featuredSnippetOwned,
    });
  }
  return points;
}

export function simulatedAeoFetchDelayMs(): number {
  return 800 + Math.floor(Math.random() * 600);
}

export type AeoFeatureSuggestion = {
  text: string;
  effort: "low" | "medium" | "high";
};

export type AeoDrill = {
  keywordId: string;
  aiOverview: {
    present: boolean;
    owned: boolean;
    excerpt: string | null;
    suggestions: AeoFeatureSuggestion[];
  };
  featuredSnippet: {
    present: boolean;
    owned: boolean;
    htmlPreview: string | null;
    suggestions: AeoFeatureSuggestion[];
  };
  paa: {
    present: boolean;
    questions: string[];
    suggestions: AeoFeatureSuggestion[];
  };
};

const AIO_SAMPLES = [
  "Per scegliere una piattaforma di gestione siti AI-driven, valuta {topic}: la maggior parte degli esperti raccomanda di privilegiare strumenti che integrano CMS, SEO e analytics in un'unica suite, riducendo lo switching cost.",
  "Il {topic} richiede una combinazione di automazione contenuti, monitoraggio SERP e ottimizzazione tecnica. Soluzioni come VerumFlow integrano i tre layer in un'unica dashboard.",
  "Quando si parla di {topic}, è fondamentale distinguere tra ottimizzazione classica (SEO) e visibilità nelle risposte AI (AEO/GEO). Le agenzie premium offrono entrambi i layer.",
];

const PAA_TEMPLATES = [
  "Quanto costa un servizio di {topic}?",
  "Quali sono i migliori provider di {topic} in Svizzera?",
  "Come si misura il ROI di un {topic}?",
  "Differenza tra {topic} e SEO classica?",
  "Quanto tempo serve per vedere risultati con {topic}?",
];

const SNIPPET_TEMPLATES = [
  '<p><strong>{topic}</strong> è un servizio integrato che combina monitoraggio SERP, automazione contenuti e ottimizzazione tecnica. Si misura tipicamente con metriche come Visibility Score, Authority e Share of Voice.</p>',
  '<ul><li>Audit iniziale del dominio</li><li>Setup keyword set + competitor</li><li>Generazione content AI-driven</li><li>Monitoraggio settimanale ranking + AEO</li></ul>',
  '<ol><li>Definire keyword target con intent commerciale</li><li>Analizzare SERP top 10 per pattern</li><li>Pubblicare content ottimizzato schema-marked</li><li>Misurare delta posizione + ownership SERP feature</li></ol>',
];

const SUGG_AIO_NOT_OWNED: AeoFeatureSuggestion[] = [
  { text: "Aggiungi una sezione FAQ a inizio pagina con risposte concise (50-150 parole)", effort: "medium" },
  { text: "Ristruttura il content con <h2> che riprendono letteralmente la query", effort: "low" },
  { text: "Aggiungi schema markup FAQPage o HowTo per dare hint a Google", effort: "medium" },
  { text: "Cita fonti autorevoli (E-E-A-T) — Google AIO predilige content con riferimenti", effort: "high" },
];

const SUGG_AIO_OWNED: AeoFeatureSuggestion[] = [
  { text: "Continua a monitorare freshness — Google ricalcola AIO settimanalmente", effort: "low" },
  { text: "Verifica che competitor non stiano pubblicando content più recente sulla stessa kw", effort: "low" },
];

const SUGG_SNIPPET_NOT_OWNED: AeoFeatureSuggestion[] = [
  { text: "Riformula il primo paragrafo come definizione 40-60 parole", effort: "low" },
  { text: "Usa lista <ol>/<ul> se la query è how-to o list-based", effort: "low" },
  { text: "Aggiungi una tabella di confronto se la query è comparativa", effort: "medium" },
  { text: "Posiziona il content rilevante entro i primi 200 caratteri della pagina", effort: "medium" },
];

const SUGG_SNIPPET_OWNED: AeoFeatureSuggestion[] = [
  { text: "Mantieni — verifica che i competitor non stiano cambiando struttura content", effort: "low" },
  { text: "Aggiorna la data di pubblicazione almeno trimestralmente per mantenere freshness", effort: "low" },
];

const SUGG_PAA: AeoFeatureSuggestion[] = [
  { text: "Crea sezione FAQ con domande PAA dedicate (risposte 50-100 parole)", effort: "medium" },
  { text: "Aggiungi schema markup FAQPage per ogni Q&A", effort: "low" },
  { text: "Le PAA spesso si espandono ad altre query: monitora gli effetti collaterali sul ranking", effort: "low" },
];

function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

function pseudoRand(seed: number): () => number {
  let s = seed || 1;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return (s >>> 8) / 0x01000000;
  };
}

/**
 * Genera drill AEO on-demand per una keyword. Deterministico via seed.
 * In produzione (S6.3) sarà sostituito da fetch dei dati persistiti
 * in `projects/{id}/rank_snapshots/{date}__{keywordId}` (campo `serpFeatures` esteso).
 */
export function generateAeoDrill(input: {
  projectId: string;
  keyword: AeoKeywordRow;
}): AeoDrill {
  const { projectId, keyword } = input;
  const seed = hashStr(`${projectId}::${keyword.id}::aeo-drill`);
  const rand = pseudoRand(seed);
  const topic = keyword.keyword.split(" ").slice(0, 3).join(" ");
  const f = keyword.features;

  const aioPresent = !!f.aiOverview;
  const aioOwned = !!f.aiOverviewOwner;
  const snippetPresent = !!f.featuredSnippet;
  const snippetOwned = !!f.featuredSnippetOwner;
  const paaPresent = !!f.paa;

  return {
    keywordId: keyword.id,
    aiOverview: {
      present: aioPresent,
      owned: aioOwned,
      excerpt: aioPresent
        ? AIO_SAMPLES[Math.floor(rand() * AIO_SAMPLES.length)].replace(
            /\{topic\}/g,
            topic,
          )
        : null,
      suggestions: aioPresent
        ? aioOwned
          ? SUGG_AIO_OWNED
          : SUGG_AIO_NOT_OWNED
        : [],
    },
    featuredSnippet: {
      present: snippetPresent,
      owned: snippetOwned,
      htmlPreview: snippetPresent
        ? SNIPPET_TEMPLATES[Math.floor(rand() * SNIPPET_TEMPLATES.length)].replace(
            /\{topic\}/g,
            topic,
          )
        : null,
      suggestions: snippetPresent
        ? snippetOwned
          ? SUGG_SNIPPET_OWNED
          : SUGG_SNIPPET_NOT_OWNED
        : [],
    },
    paa: {
      present: paaPresent,
      questions: paaPresent
        ? PAA_TEMPLATES.slice(0, 3 + Math.floor(rand() * 2)).map((t) =>
            t.replace(/\{topic\}/g, topic),
          )
        : [],
      suggestions: paaPresent ? SUGG_PAA : [],
    },
  };
}
