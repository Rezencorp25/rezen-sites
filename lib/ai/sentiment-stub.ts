import type { GeoLlmId, GeoQuery, GeoSnapshot } from "@/lib/seo/geo-types";
import type {
  NegativeContextEntry,
  SentimentAttribute,
  SentimentDistribution,
  SentimentSnapshot,
  SentimentTrendPoint,
} from "./sentiment-types";

/**
 * Stub: deriva il sentiment aggregato dal GeoSnapshot esistente.
 *
 * Vantaggio: i `mentions[llm].sentiment` sono già popolati dal GEO stub
 * (deterministico via seed). Quindi il sentiment UI è coerente con i dati
 * mostrati nelle altre sezioni della pagina /geo.
 *
 * In live mode (S6c backend), il sentiment sarà popolato da Claude Haiku
 * via Cloud Function `runAiSentiment` e persistito in
 * `projects/{id}/sentiment_snapshots/{YYYY-WW}`. Il tipo SentimentSnapshot
 * è identico (mirror di output CF).
 */

/**
 * Pool di attributi qualitativi stub. In live, vengono estratti da Claude
 * post-classification con prompt: "List 3-5 short attributes (max 3 words each)
 * mentioned about the brand in this context".
 */
const STUB_POSITIVE_ATTRIBUTES = [
  "supporto rapido",
  "ottima documentazione",
  "integrazione AI nativa",
  "pricing trasparente",
  "team locale Ticino",
  "onboarding semplice",
  "performance veloce",
];

const STUB_NEGATIVE_ATTRIBUTES = [
  "feature set limitato",
  "brand awareness bassa",
  "ecosistema piccolo",
  "documentazione in italiano scarsa",
  "no integrazione enterprise",
];

/**
 * Excerpt-template per le mention negative. In live: estratti dalla risposta
 * LLM reale parsata dalla CF.
 */
const NEGATIVE_CONTEXT_TEMPLATES = [
  "Tra le alternative emergenti c'è {brand}, ma il feature set è ancora limitato rispetto ai player consolidati.",
  "{brand} è un'opzione recente; non ha ancora la maturità prodotto di {competitor}.",
  "Per {topic} non consiglierei {brand} a chi cerca un ecosistema enterprise — meglio orientarsi su {competitor}.",
  "{brand} ha brand awareness bassa nel mercato italiano; valutare con cautela per progetti business-critical.",
];

function hash(s: string): number {
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

function calcDistribution(snapshot: GeoSnapshot): SentimentDistribution {
  let positive = 0;
  let neutral = 0;
  let negative = 0;
  for (const q of snapshot.queries) {
    for (const llm of Object.keys(q.mentions) as GeoLlmId[]) {
      const m = q.mentions[llm];
      if (!m.mentioned || !m.sentiment) continue;
      if (m.sentiment === "positive") positive++;
      else if (m.sentiment === "negative") negative++;
      else neutral++;
    }
  }
  return { positive, neutral, negative, total: positive + neutral + negative };
}

function calcGlobalScore(d: SentimentDistribution): number {
  if (d.total === 0) return 0;
  return Math.round(((d.positive - d.negative) / d.total) * 100);
}

function pickAttributes(
  snapshot: GeoSnapshot,
  d: SentimentDistribution,
): SentimentAttribute[] {
  const seed = hash(`${snapshot.id}::sentiment-attrs`);
  const rand = pseudoRand(seed);
  const out: SentimentAttribute[] = [];

  // Numero attributi proporzionale alla distribuzione.
  const posCount = Math.min(STUB_POSITIVE_ATTRIBUTES.length, Math.max(1, Math.round((d.positive / Math.max(1, d.total)) * 7)));
  const negCount = Math.min(STUB_NEGATIVE_ATTRIBUTES.length, Math.max(0, Math.round((d.negative / Math.max(1, d.total)) * 5)));

  const shuffled = (arr: string[]) => {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  };

  shuffled(STUB_POSITIVE_ATTRIBUTES)
    .slice(0, posCount)
    .forEach((label) =>
      out.push({
        label,
        polarity: "positive",
        count: 1 + Math.floor(rand() * Math.max(1, d.positive)),
      }),
    );

  shuffled(STUB_NEGATIVE_ATTRIBUTES)
    .slice(0, negCount)
    .forEach((label) =>
      out.push({
        label,
        polarity: "negative",
        count: 1 + Math.floor(rand() * Math.max(1, d.negative)),
      }),
    );

  return out.sort((a, b) => b.count - a.count).slice(0, 10);
}

function buildNegativeEntries(snapshot: GeoSnapshot): NegativeContextEntry[] {
  const seed = hash(`${snapshot.id}::sentiment-neg`);
  const rand = pseudoRand(seed);
  const entries: NegativeContextEntry[] = [];

  for (const q of snapshot.queries) {
    for (const llm of Object.keys(q.mentions) as GeoLlmId[]) {
      const m = q.mentions[llm];
      if (m.sentiment !== "negative" || !m.mentioned) continue;

      const tpl = NEGATIVE_CONTEXT_TEMPLATES[
        Math.floor(rand() * NEGATIVE_CONTEXT_TEMPLATES.length)
      ];
      const competitor = m.citedDomains.find((d) => d !== snapshot.domain) ?? "competitor.com";
      const context = tpl
        .replace(/\{brand\}/g, snapshot.domain)
        .replace(/\{competitor\}/g, competitor)
        .replace(/\{topic\}/g, deriveTopic(q));

      // Score impact = volume × sentiment intensity (random -50/-100 per neg)
      const score = -(50 + Math.floor(rand() * 50));
      entries.push({
        queryId: q.id,
        queryText: q.query,
        llm,
        context,
        score,
      });
    }
  }

  return entries.sort((a, b) => a.score - b.score).slice(0, 10);
}

function deriveTopic(q: GeoQuery): string {
  return q.query
    .replace(/^(quali|cos'è|come|suggerisci|migliori|pro e contro di|confronta)/i, "")
    .replace(/\?$/, "")
    .trim()
    .split(" ")
    .slice(0, 3)
    .join(" ");
}

export function deriveSentimentSnapshot(input: {
  snapshot: GeoSnapshot;
  prevScore?: number | null;
}): SentimentSnapshot {
  const distribution = calcDistribution(input.snapshot);
  const score = calcGlobalScore(distribution);
  const attributes = pickAttributes(input.snapshot, distribution);
  const negativeEntries = buildNegativeEntries(input.snapshot);
  return {
    score,
    prevScore: input.prevScore ?? null,
    distribution,
    attributes,
    negativeEntries,
  };
}

/**
 * Trend stub: deriva il sentiment per ogni punto del trend GEO esistente.
 * In live mode arriverà da `sentiment_snapshots` history collection.
 */
export function deriveSentimentTrend(input: {
  history: GeoSnapshot[];
}): SentimentTrendPoint[] {
  return input.history
    .map((snap) => ({
      date: snap.createdAt.toISOString().slice(0, 10),
      score: calcGlobalScore(calcDistribution(snap)),
    }))
    .reverse(); // history is newest-first, trend chart wants oldest-first
}
