import type { Page } from "@/types";

/**
 * Answer Engine Optimization scorer.
 *
 * Goal: identify Puck content passages that AI engines (ChatGPT, Perplexity,
 * Google AI Overviews) are likely to extract as answer snippets, and surface
 * how to improve weaker passages.
 *
 * Heuristics (no LLM call needed):
 *   - Length: 40-280 chars rewards directness; longer paragraphs penalised
 *   - Definitional opening: starts with "X is/are/means/refers to" → bonus
 *   - List/Q&A structure: bullet/number/question marks → bonus
 *   - Numerical concreteness: presence of digits/dates → bonus
 *   - First-person fluff ("noi crediamo", "siamo orgogliosi") → penalty
 */

export type AeoPassage = {
  id: string;
  text: string;
  blockType: string;
  /** 0-100 */
  score: number;
  signals: AeoSignal[];
  recommendation?: string;
};

export type AeoSignal = {
  kind: "good" | "bad";
  label: string;
};

const FLUFF_PATTERNS = [
  /\bnoi\s+(crediamo|siamo|amiamo|abbiamo)\b/i,
  /\bi nostri valori\b/i,
  /\bsiamo orgogliosi\b/i,
  /\bla nostra mission(e)?\b/i,
  /\bla nostra storia\b/i,
];

const DEFINITIONAL_PATTERNS = [
  /^[A-Z][\w\s'-]{2,30}\s+(è|sono|significa|consiste|indica|rappresenta)\b/,
  /^[A-Z][\w\s'-]{2,30}\s+(is|are|means|refers to)\b/i,
];

export function scorePassage(text: string, blockType: string): AeoPassage {
  const id = hashId(text);
  const trimmed = text.trim();
  const len = trimmed.length;
  const signals: AeoSignal[] = [];
  let score = 50;

  // Length scoring (sweet spot 40-280 chars)
  if (len === 0) {
    return {
      id,
      text: trimmed,
      blockType,
      score: 0,
      signals: [{ kind: "bad", label: "Vuoto" }],
    };
  }
  if (len < 25) {
    score -= 15;
    signals.push({ kind: "bad", label: "Troppo corto (<25 char)" });
  } else if (len > 400) {
    score -= 10;
    signals.push({ kind: "bad", label: "Troppo lungo per AI snippet" });
  } else if (len >= 40 && len <= 280) {
    score += 15;
    signals.push({ kind: "good", label: "Lunghezza ideale (40-280)" });
  }

  // Definitional opening
  if (DEFINITIONAL_PATTERNS.some((re) => re.test(trimmed))) {
    score += 18;
    signals.push({ kind: "good", label: "Apertura definitionale" });
  }

  // Question mark = Q/A friendly
  if (trimmed.includes("?")) {
    score += 8;
    signals.push({ kind: "good", label: "Contiene Q&A" });
  }

  // Numerical concreteness
  const digits = (trimmed.match(/\d/g) ?? []).length;
  if (digits >= 2) {
    score += 7;
    signals.push({ kind: "good", label: `${digits} dati numerici` });
  }

  // Lists
  if (/[-•*]\s/.test(trimmed) || /\b\d+\.\s/.test(trimmed)) {
    score += 6;
    signals.push({ kind: "good", label: "Struttura a lista" });
  }

  // Fluff penalty
  for (const re of FLUFF_PATTERNS) {
    if (re.test(trimmed)) {
      score -= 12;
      signals.push({ kind: "bad", label: "Self-reference fluff" });
      break;
    }
  }

  // Block-type bonus
  if (blockType === "FAQ") {
    score += 12;
    signals.push({ kind: "good", label: "Block FAQ (FAQPage schema-ready)" });
  } else if (blockType === "Heading") {
    score -= 5;
  }

  score = Math.max(0, Math.min(100, score));

  let recommendation: string | undefined;
  if (score < 40) {
    if (len > 400)
      recommendation = "Spezza in 2 paragrafi più diretti.";
    else if (FLUFF_PATTERNS.some((re) => re.test(trimmed)))
      recommendation = "Sostituisci self-reference con dato concreto.";
    else if (digits === 0)
      recommendation = "Aggiungi numeri/date per concretezza.";
    else recommendation = "Inizia con definizione: \"X è …\".";
  } else if (score < 65) {
    recommendation = "Ok, ma puoi migliorare apertura o aggiungere lista.";
  }

  return { id, text: trimmed, blockType, score: Math.round(score), signals, recommendation };
}

export function scorePagePassages(page: Page): AeoPassage[] {
  const out: AeoPassage[] = [];
  for (const item of page.puckData.content ?? []) {
    const props = item.props as Record<string, unknown>;
    if (item.type === "Paragraph" || item.type === "Heading") {
      const text = (props.text as string) ?? "";
      if (text.trim()) out.push(scorePassage(text, item.type));
    } else if (item.type === "FAQ") {
      const items = (props.items as Array<{ question: string; answer: string }>) ?? [];
      for (const it of items) {
        if (it.answer?.trim()) {
          out.push(scorePassage(`${it.question} ${it.answer}`, "FAQ"));
        }
      }
    } else if (item.type === "Hero") {
      const text = `${props.title ?? ""} ${props.subtitle ?? ""}`.trim();
      if (text) out.push(scorePassage(text, "Hero"));
    } else if (item.type === "CTA") {
      const text = `${props.headline ?? ""} ${props.description ?? ""}`.trim();
      if (text) out.push(scorePassage(text, "CTA"));
    }
  }
  return out;
}

export function aggregateAeoScore(passages: AeoPassage[]): number {
  if (passages.length === 0) return 0;
  const total = passages.reduce((s, p) => s + p.score, 0);
  return Math.round(total / passages.length);
}

/**
 * AI Overview cannibalization risk (B.15).
 *
 * Scores 0-100 (higher = higher risk Google AI Overview will surface
 * an answer derived from the page WITHOUT sending a click). Heuristics:
 *   - Page contains a "what is / cos'è" definitional opener → +30
 *   - Page is heavy on bullet lists / short answers → +20
 *   - FAQ block present → +20
 *   - Direct numerical answers (% / CHF / dates) → +15
 *   - Long-form (>1500 char total) → -15 (LLM prefers short)
 *   - Strong CTA (Buy/Demo/Contact) → -10 (commercial intent → Google sends click)
 */
export function aiOverviewRisk(passages: AeoPassage[]): {
  score: number;
  level: "low" | "medium" | "high" | "critical";
  drivers: string[];
} {
  if (passages.length === 0)
    return { score: 0, level: "low", drivers: ["Nessun contenuto"] };

  let score = 20; // baseline
  const drivers: string[] = [];

  const allText = passages.map((p) => p.text).join(" ");
  const hasDefinitional = passages.some((p) =>
    p.signals.some((s) => s.label.includes("definitionale")),
  );
  if (hasDefinitional) {
    score += 30;
    drivers.push("Apertura definitionale (LLM-extractable)");
  }
  const hasFaq = passages.some((p) => p.blockType === "FAQ");
  if (hasFaq) {
    score += 20;
    drivers.push("FAQ block presente");
  }
  const hasLists = passages.some((p) =>
    p.signals.some((s) => s.label.includes("lista")),
  );
  if (hasLists) {
    score += 20;
    drivers.push("Struttura a lista");
  }
  const hasNumerical = passages.some((p) =>
    p.signals.some((s) => s.label.includes("dati numerici")),
  );
  if (hasNumerical) {
    score += 15;
    drivers.push("Risposte numeriche dirette");
  }
  if (allText.length > 1500) {
    score -= 15;
    drivers.push("Long-form (riduce rischio)");
  }
  if (
    /\b(acquista|compra|prenota|chiama|demo|preventivo|buy|book|contact)\b/i.test(
      allText,
    )
  ) {
    score -= 10;
    drivers.push("CTA commerciale (intent click-out)");
  }

  score = Math.max(0, Math.min(100, score));
  const level: "low" | "medium" | "high" | "critical" =
    score >= 75
      ? "critical"
      : score >= 55
        ? "high"
        : score >= 35
          ? "medium"
          : "low";

  return { score, level, drivers };
}

function hashId(s: string): string {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h << 5) - h + s.charCodeAt(i);
    h |= 0;
  }
  return `aeo-${Math.abs(h).toString(36)}`;
}
