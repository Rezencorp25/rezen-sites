/**
 * AI Search Health (S6c.3) — quanto i bot LLM sono in grado di leggere il sito.
 *
 * Dimensioni misurate:
 *  1. **robots.txt** — Allow/Disallow per ciascun bot (GPTBot, ClaudeBot, ecc.).
 *  2. **Meta tags / X-Robots-Tag** — `noai`, `noimageai`, `noindex` su pagine campione.
 *  3. **llms.txt** — standard emergente (anthropic.com/llms.txt) per "AI manifesto".
 *  4. **sitemap.xml** — presente + numero URL (proxy completezza indexable surface).
 *
 * Score 0-100: 100 = tutti bot allowed + sitemap presente + nessun noai meta.
 * Cadenza fetch settimanale (Lun 5AM Europe/Rome) → memorizzato in
 * geo_snapshots/{snapshotId}.aiSearchHealth (denormalizzato per evitare join).
 *
 * Fonti bot list aggiornata 2026-04 (Originality.ai + Cloudflare):
 *  - OpenAI: GPTBot, OAI-SearchBot, ChatGPT-User
 *  - Anthropic: ClaudeBot, Claude-Web, anthropic-ai
 *  - Perplexity: PerplexityBot, Perplexity-User
 *  - Google AI: Google-Extended (Bard/Gemini training opt-out)
 *  - Bytedance/Doubao: Bytespider
 *  - Common Crawl (training corpus condiviso): CCBot
 */

export type BotId =
  | "GPTBot"
  | "OAI-SearchBot"
  | "ChatGPT-User"
  | "ClaudeBot"
  | "Claude-Web"
  | "anthropic-ai"
  | "PerplexityBot"
  | "Perplexity-User"
  | "Google-Extended"
  | "Bytespider"
  | "CCBot";

export const ALL_BOTS: BotId[] = [
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "ClaudeBot",
  "Claude-Web",
  "anthropic-ai",
  "PerplexityBot",
  "Perplexity-User",
  "Google-Extended",
  "Bytespider",
  "CCBot",
];

export const BOT_OWNER: Record<BotId, "openai" | "anthropic" | "perplexity" | "google" | "bytedance" | "commoncrawl"> = {
  "GPTBot": "openai",
  "OAI-SearchBot": "openai",
  "ChatGPT-User": "openai",
  "ClaudeBot": "anthropic",
  "Claude-Web": "anthropic",
  "anthropic-ai": "anthropic",
  "PerplexityBot": "perplexity",
  "Perplexity-User": "perplexity",
  "Google-Extended": "google",
  "Bytespider": "bytedance",
  "CCBot": "commoncrawl",
};

export const BOT_OWNER_LABEL: Record<string, string> = {
  openai: "OpenAI",
  anthropic: "Anthropic",
  perplexity: "Perplexity",
  google: "Google",
  bytedance: "Bytedance",
  commoncrawl: "Common Crawl",
};

/**
 * Status del bot per il sito:
 *  - allowed: nessun Disallow → bot può crawlare ovunque
 *  - blocked: Disallow: / globale (o User-Agent specifico)
 *  - partial: bloccato su path specifici (es. /admin/) ma resto OK
 *  - unknown: parsing fallito o robots.txt non raggiungibile
 */
export type BotStatus = "allowed" | "blocked" | "partial" | "unknown";

export type BotResult = {
  bot: BotId;
  status: BotStatus;
  /** Lista path con Disallow (max 5 mostrati). */
  blockedPaths: string[];
};

export type AiSearchHealthWarning = {
  /** Severity per ordinamento UI. */
  severity: "critical" | "warning" | "info";
  /** Messaggio human-readable. */
  message: string;
  /** Bot/feature di riferimento (per icona UI). */
  scope?: BotId | "robots" | "sitemap" | "meta" | "llms";
};

export type AiSearchHealth = {
  /** Score 0-100. 100 = stato ideale. <70 attiva alert. */
  score: number;
  /** Risultato per ciascun bot tester. */
  bots: BotResult[];
  /** robots.txt raggiungibile + parsabile. */
  robotsTxtFound: boolean;
  /** sitemap.xml raggiungibile + numero URL trovati. */
  sitemapFound: boolean;
  sitemapUrlCount: number | null;
  /** llms.txt presente (standard emergente AI manifesto). */
  llmsTxtFound: boolean;
  /** Numero pagine campione con `<meta name="robots" content="noai|noimageai">` o X-Robots-Tag. */
  pagesWithNoaiMeta: number;
  /** Numero pagine campione totali analizzate. */
  pagesScanned: number;
  /** Warning aggregati ordinati per severity. */
  warnings: AiSearchHealthWarning[];
  /** Timestamp fetch (per UI "checked at"). */
  checkedAt: Date;
  source: "stub" | "live";
};

/**
 * Score band qualitativo per badge UI.
 *  - excellent: ≥85
 *  - good: 70-84
 *  - poor: 40-69
 *  - critical: <40
 */
export type AiSearchHealthBand = "excellent" | "good" | "poor" | "critical";

export function aiSearchHealthBand(score: number): AiSearchHealthBand {
  if (score >= 85) return "excellent";
  if (score >= 70) return "good";
  if (score >= 40) return "poor";
  return "critical";
}
