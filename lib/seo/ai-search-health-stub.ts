import {
  ALL_BOTS,
  type AiSearchHealth,
  type BotId,
  type BotResult,
  type BotStatus,
} from "./ai-search-health-types";
import {
  buildAiSearchHealthWarnings,
  calcAiSearchHealthScore,
} from "./ai-search-health-parsers";

/**
 * Stub generator (S6c.3). Deterministico da projectId + domain → stesso output
 * tra reload finché non si chiama "Aggiorna snapshot" (che genera nuovo seed).
 *
 * Strategia: pseudo-random seedato; pattern realistico:
 *  - 65-80% bot allowed (default permissivo per la maggior parte dei siti)
 *  - 1-3 bot blocked random (di solito GPTBot/ClaudeBot opted-out a mano)
 *  - 0-2 bot partial (es. /admin, /private bloccati)
 *  - sitemap presente ~90%, llms.txt presente ~10% (standard nuovo)
 *  - 0-1 pagina con noai meta su 6 scansionate (raro ma critico)
 */

function hash(str: string): number {
  let h = 5381;
  for (let i = 0; i < str.length; i++) h = ((h << 5) + h + str.charCodeAt(i)) | 0;
  return h >>> 0;
}

function pseudoRand(seed: number): () => number {
  let s = seed || 1;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
}

const COMMON_BLOCKED_PATHS = [
  "/admin",
  "/wp-admin",
  "/api/internal",
  "/private",
  "/.well-known",
  "/cgi-bin",
];

export function generateAiSearchHealthStub(args: {
  projectId: string;
  domain: string;
  /** Seed extra per rotazione su "Aggiorna snapshot". */
  seedSalt?: string;
}): AiSearchHealth {
  const { projectId, domain, seedSalt = "" } = args;
  const rand = pseudoRand(hash(`${projectId}|${domain}|aish|${seedSalt}`));

  const bots: BotResult[] = ALL_BOTS.map((bot) => {
    const r = rand();
    let status: BotStatus;
    let blockedPaths: string[] = [];
    if (r < 0.12) {
      status = "blocked";
      blockedPaths = ["/"];
    } else if (r < 0.28) {
      status = "partial";
      const n = 1 + Math.floor(rand() * 3);
      const pool = [...COMMON_BLOCKED_PATHS].sort(() => rand() - 0.5);
      blockedPaths = pool.slice(0, n);
    } else {
      status = "allowed";
    }
    return { bot, status, blockedPaths };
  });

  const robotsTxtFound = rand() < 0.95;
  const sitemapFound = rand() < 0.9;
  const sitemapUrlCount = sitemapFound ? 8 + Math.floor(rand() * 80) : null;
  const llmsTxtFound = rand() < 0.12;
  const pagesScanned = 6;
  const pagesWithNoaiMeta = rand() < 0.08 ? 1 : 0;

  const partial = {
    bots,
    robotsTxtFound,
    sitemapFound,
    sitemapUrlCount,
    llmsTxtFound,
    pagesWithNoaiMeta,
    pagesScanned,
  };

  return {
    ...partial,
    score: calcAiSearchHealthScore(partial),
    warnings: buildAiSearchHealthWarnings(partial),
    checkedAt: new Date(),
    source: "stub",
  };
}

/** Helper UI: aggrega bot per owner per mostrare table grouped. */
export function groupBotsByOwner(
  bots: BotResult[],
): Array<{ owner: string; bots: BotResult[] }> {
  const map = new Map<string, BotResult[]>();
  for (const b of bots) {
    const owner = ownerKey(b.bot);
    if (!map.has(owner)) map.set(owner, []);
    map.get(owner)!.push(b);
  }
  return Array.from(map.entries()).map(([owner, bots]) => ({ owner, bots }));
}

function ownerKey(bot: BotId): string {
  if (bot.startsWith("GPT") || bot.startsWith("OAI") || bot.startsWith("ChatGPT")) return "openai";
  if (bot.startsWith("Claude") || bot.startsWith("anthropic")) return "anthropic";
  if (bot.startsWith("Perplexity")) return "perplexity";
  if (bot.startsWith("Google")) return "google";
  if (bot.startsWith("Bytespider")) return "bytedance";
  return "commoncrawl";
}
