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

function hashId(s: string): string {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h << 5) - h + s.charCodeAt(i);
    h |= 0;
  }
  return `aeo-${Math.abs(h).toString(36)}`;
}
