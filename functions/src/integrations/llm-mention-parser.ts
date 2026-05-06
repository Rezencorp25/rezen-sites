/**
 * S13.1.5 — Parser response LLM per estrarre brand mention + sentiment + citations.
 *
 * Input: testo LLM grezzo + dominio cliente + brand tokens
 * Output: shape compatibile con `GeoMention` (mirror di lib/seo/geo-types.ts)
 *
 * Approach:
 *  - mention = match case-insensitive su domain o brand tokens nel testo
 *  - rank = 1-based: se match, posizione del PRIMO bullet/numbered list item che lo contiene;
 *           altrimenti se in primo paragrafo = 1, altrimenti = posizione frase / 3 + 1
 *  - sentiment = keyword classifier IT+EN su finestra ±200 char attorno alla prima mention
 *  - citedDomains = unique domains in tutti gli URL trovati (regex)
 *  - isCitation = true se cliente è citato come Markdown link [text](url) o <url> con url che contiene domain
 *  - citedUrl = URL completo cliente se isCitation true
 */

export type ParsedMention = {
  mentioned: boolean;
  rank: number | null;
  sentiment: "positive" | "neutral" | "negative" | null;
  citedDomains: string[];
  isCitation: boolean | null;
  citedUrl: string | null;
};

const POSITIVE_KEYWORDS = [
  "miglior",
  "ottim",
  "eccellent",
  "consiglio",
  "raccomand",
  "leader",
  "top",
  "innovativ",
  "affidab",
  "qualità",
  "professional",
  "best",
  "great",
  "excellent",
  "leading",
  "trusted",
  "recommend",
  "outstanding",
];

const NEGATIVE_KEYWORDS = [
  "scarso",
  "deludent",
  "problemat",
  "limitat",
  "lent",
  "poor",
  "weak",
  "issue",
  "concern",
  "complaint",
  "lacking",
  "outdated",
  "obsolet",
];

export function parseMentionFromResponse(input: {
  text: string;
  ownerDomain: string;
  /** Token alternativi (es. "rezen", "rezencorp") oltre al domain */
  brandTokens?: string[];
}): ParsedMention {
  const { text, ownerDomain } = input;
  const brandTokens = input.brandTokens ?? deriveBrandTokens(ownerDomain);
  const lower = text.toLowerCase();

  // 1. Mention check
  const allTokens = [
    ownerDomain.toLowerCase(),
    ...brandTokens.map((t) => t.toLowerCase()),
  ];
  let firstIdx = -1;
  for (const tok of allTokens) {
    const idx = lower.indexOf(tok);
    if (idx !== -1 && (firstIdx === -1 || idx < firstIdx)) firstIdx = idx;
  }
  const mentioned = firstIdx !== -1;

  if (!mentioned) {
    return {
      mentioned: false,
      rank: null,
      sentiment: null,
      citedDomains: extractCitedDomains(text),
      isCitation: null,
      citedUrl: null,
    };
  }

  // 2. Rank estimation (posizione in lista numerata/bullet, fallback frase #)
  const rank = estimateRank(text, firstIdx);

  // 3. Sentiment ±200 chars
  const window = lower.slice(
    Math.max(0, firstIdx - 200),
    Math.min(lower.length, firstIdx + 200),
  );
  const sentiment = classifySentiment(window);

  // 4. Cited domains + cliente citation flag
  const citedDomains = extractCitedDomains(text);
  const { isCitation, citedUrl } = checkClientCitation(text, ownerDomain);

  return {
    mentioned: true,
    rank,
    sentiment,
    citedDomains,
    isCitation,
    citedUrl,
  };
}

/**
 * Stima rank dalla posizione del match nel testo.
 *  - Se match in prima riga / primo paragrafo → rank 1
 *  - Se in lista numerata "1." "2." → usa quel numero
 *  - Altrimenti distribuisci su 5 buckets in base a posizione relativa
 */
function estimateRank(text: string, firstIdx: number): number {
  // Numbered list detection
  const numberedListRegex = /^\s*(\d+)[\.\)]\s/gm;
  let m: RegExpExecArray | null;
  let lastNumberBeforeMatch = 0;
  while ((m = numberedListRegex.exec(text)) !== null) {
    if (m.index > firstIdx) break;
    lastNumberBeforeMatch = parseInt(m[1], 10);
  }
  if (lastNumberBeforeMatch > 0 && lastNumberBeforeMatch <= 10) {
    return lastNumberBeforeMatch;
  }

  // Bullet position fallback
  const bulletsBefore = (text.slice(0, firstIdx).match(/^\s*[-*•]\s/gm) ?? [])
    .length;
  if (bulletsBefore > 0 && bulletsBefore <= 10) return bulletsBefore + 1;

  // Position-based fallback (5 buckets)
  const ratio = firstIdx / Math.max(1, text.length);
  if (ratio < 0.15) return 1;
  if (ratio < 0.35) return 2;
  if (ratio < 0.55) return 3;
  if (ratio < 0.75) return 4;
  return 5;
}

function classifySentiment(
  window: string,
): "positive" | "neutral" | "negative" {
  let pos = 0;
  let neg = 0;
  for (const kw of POSITIVE_KEYWORDS) {
    if (window.includes(kw)) pos++;
  }
  for (const kw of NEGATIVE_KEYWORDS) {
    if (window.includes(kw)) neg++;
  }
  if (pos > neg && pos >= 1) return "positive";
  if (neg > pos && neg >= 1) return "negative";
  return "neutral";
}

function extractCitedDomains(text: string): string[] {
  const urlRegex = /https?:\/\/([^\s/)\]"<>]+)/g;
  const set = new Set<string>();
  let m: RegExpExecArray | null;
  while ((m = urlRegex.exec(text)) !== null) {
    const host = m[1].toLowerCase();
    set.add(host.startsWith("www.") ? host.slice(4) : host);
  }
  return Array.from(set);
}

function checkClientCitation(
  text: string,
  ownerDomain: string,
): { isCitation: boolean; citedUrl: string | null } {
  const lower = text.toLowerCase();
  const owner = ownerDomain.toLowerCase();
  // Find first URL containing ownerDomain
  const urlRegex = /https?:\/\/[^\s)\]"<>]+/g;
  let m: RegExpExecArray | null;
  while ((m = urlRegex.exec(text)) !== null) {
    if (m[0].toLowerCase().includes(owner)) {
      return { isCitation: true, citedUrl: m[0] };
    }
  }
  // Fallback: testual mention only
  return {
    isCitation: lower.includes(owner) ? false : false,
    citedUrl: null,
  };
}

/**
 * Deriva token brand short name dal domain.
 * Esempio: "verumflow.ch" → ["verumflow"]; "agora-thesis.com" → ["agora", "agora-thesis"]
 */
function deriveBrandTokens(domain: string): string[] {
  const root = domain.toLowerCase().replace(/^www\./, "").split(".")[0] ?? "";
  if (!root) return [];
  const tokens = new Set<string>();
  tokens.add(root);
  if (root.includes("-")) {
    for (const part of root.split("-")) {
      if (part.length >= 4) tokens.add(part);
    }
  }
  return Array.from(tokens);
}
