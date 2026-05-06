import {
  ALL_BOTS,
  type AiSearchHealth,
  type AiSearchHealthWarning,
  type BotId,
  type BotResult,
  type BotStatus,
} from "./ai-search-health-types";

/**
 * robots.txt parser: per ogni User-Agent estrae le direttive Allow/Disallow.
 *
 * Ritorna mappa { botId → BotResult }. Logica di matching:
 *  - cerca prima blocco specifico `User-agent: <bot>` (case-insensitive)
 *  - fallback su blocco wildcard `User-agent: *`
 *  - status = blocked se "Disallow: /" presente
 *  - status = partial se Disallow su path specifici (≠ "/")
 *  - status = allowed altrimenti
 */
export function parseRobotsTxt(content: string): Record<BotId, BotResult> {
  const blocks = parseRobotsBlocks(content);
  const wildcard = blocks.get("*");
  const result = {} as Record<BotId, BotResult>;

  for (const bot of ALL_BOTS) {
    const specific = blocks.get(bot.toLowerCase());
    const block = specific ?? wildcard;
    if (!block) {
      result[bot] = { bot, status: "allowed", blockedPaths: [] };
      continue;
    }
    const disallows = block.disallows.filter((p) => p.length > 0);
    if (disallows.length === 0) {
      result[bot] = { bot, status: "allowed", blockedPaths: [] };
      continue;
    }
    const blocksAll = disallows.some((p) => p === "/" || p === "/*");
    result[bot] = {
      bot,
      status: blocksAll ? "blocked" : "partial",
      blockedPaths: disallows.slice(0, 5),
    };
  }
  return result;
}

type RobotsBlock = { disallows: string[]; allows: string[] };

function parseRobotsBlocks(content: string): Map<string, RobotsBlock> {
  const blocks = new Map<string, RobotsBlock>();
  const lines = content.split(/\r?\n/);
  let currentAgents: string[] = [];
  let collecting = false;

  for (const raw of lines) {
    const line = raw.replace(/#.*$/, "").trim();
    if (!line) continue;
    const [keyRaw, ...valParts] = line.split(":");
    if (!keyRaw || valParts.length === 0) continue;
    const key = keyRaw.trim().toLowerCase();
    const value = valParts.join(":").trim();
    if (key === "user-agent") {
      if (collecting) currentAgents = [];
      collecting = false;
      const ua = value.toLowerCase();
      currentAgents.push(ua);
      if (!blocks.has(ua)) blocks.set(ua, { disallows: [], allows: [] });
    } else if (key === "disallow" || key === "allow") {
      collecting = true;
      for (const ua of currentAgents) {
        const block = blocks.get(ua);
        if (!block) continue;
        if (key === "disallow") block.disallows.push(value);
        else block.allows.push(value);
      }
    }
  }
  return blocks;
}

/**
 * Conta pagine con meta `noai`, `noimageai`, `noml` o X-Robots-Tag con stessi token.
 * Usa regex semplice: ok per HTML statico, miss su HTML SSR pesante (ok per stub).
 */
export function detectNoaiMeta(html: string, headers: Record<string, string>): boolean {
  const blockTokens = ["noai", "noimageai", "noml"];
  const xRobots = headers["x-robots-tag"]?.toLowerCase() ?? "";
  if (blockTokens.some((t) => xRobots.includes(t))) return true;
  const metaMatches = html.match(/<meta[^>]+name=["']robots["'][^>]*>/gi) ?? [];
  for (const tag of metaMatches) {
    const contentAttr = tag.match(/content=["']([^"']+)["']/i)?.[1]?.toLowerCase() ?? "";
    if (blockTokens.some((t) => contentAttr.includes(t))) return true;
  }
  return false;
}

/**
 * Score 0-100 deterministico:
 *  - 50 punti: % bot allowed/partial (allowed = 1, partial = 0.5, blocked = 0)
 *  - 15 punti: robots.txt presente + parsabile (10 partial, 5 mancante)
 *  - 15 punti: sitemap.xml presente + ≥1 URL
 *  - 10 punti: nessuna pagina con noai/noimageai meta
 *  - 10 punti: llms.txt presente (standard emergente, bonus)
 */
export function calcAiSearchHealthScore(
  args: Pick<
    AiSearchHealth,
    | "bots"
    | "robotsTxtFound"
    | "sitemapFound"
    | "sitemapUrlCount"
    | "llmsTxtFound"
    | "pagesWithNoaiMeta"
    | "pagesScanned"
  >,
): number {
  const botScore = args.bots.length === 0
    ? 0
    : args.bots.reduce((acc, b) => {
        if (b.status === "allowed") return acc + 1;
        if (b.status === "partial") return acc + 0.5;
        return acc;
      }, 0) / args.bots.length;
  const robotsScore = args.robotsTxtFound ? 1 : 0.33;
  const sitemapScore =
    args.sitemapFound && (args.sitemapUrlCount ?? 0) > 0 ? 1 : 0;
  const noaiScore = args.pagesScanned === 0
    ? 1
    : 1 - args.pagesWithNoaiMeta / args.pagesScanned;
  const llmsScore = args.llmsTxtFound ? 1 : 0;

  const total =
    botScore * 50 +
    robotsScore * 15 +
    sitemapScore * 15 +
    noaiScore * 10 +
    llmsScore * 10;
  return Math.round(total);
}

/**
 * Genera warnings actionable a partire dai risultati. Ordinati per severity.
 */
export function buildAiSearchHealthWarnings(
  args: Pick<
    AiSearchHealth,
    | "bots"
    | "robotsTxtFound"
    | "sitemapFound"
    | "sitemapUrlCount"
    | "llmsTxtFound"
    | "pagesWithNoaiMeta"
    | "pagesScanned"
  >,
): AiSearchHealthWarning[] {
  const warnings: AiSearchHealthWarning[] = [];
  for (const b of args.bots) {
    if (b.status === "blocked") {
      warnings.push({
        severity: "critical",
        message: `${b.bot} bloccato in robots.txt — i tuoi contenuti non saranno usati per training né indicizzazione AI di ${ownerOf(b.bot)}.`,
        scope: b.bot,
      });
    } else if (b.status === "partial" && b.blockedPaths.length > 0) {
      warnings.push({
        severity: "warning",
        message: `${b.bot} bloccato su ${b.blockedPaths.length} path (${b.blockedPaths.slice(0, 2).join(", ")}…). Verifica che non includano content critico.`,
        scope: b.bot,
      });
    }
  }
  if (!args.robotsTxtFound) {
    warnings.push({
      severity: "warning",
      message: "robots.txt non trovato — i bot useranno default permissivi, ma perdi controllo esplicito.",
      scope: "robots",
    });
  }
  if (!args.sitemapFound || (args.sitemapUrlCount ?? 0) === 0) {
    warnings.push({
      severity: "warning",
      message: "sitemap.xml non trovato o vuoto — i bot indicizzeranno solo via crawl naturale, copertura imprevedibile.",
      scope: "sitemap",
    });
  }
  if (args.pagesWithNoaiMeta > 0) {
    warnings.push({
      severity: "critical",
      message: `${args.pagesWithNoaiMeta}/${args.pagesScanned} pagine contengono meta \`noai\` o \`noimageai\`. Rimuovi se vuoi essere citato dagli LLM.`,
      scope: "meta",
    });
  }
  if (!args.llmsTxtFound) {
    warnings.push({
      severity: "info",
      message: "llms.txt assente. Standard emergente: aggiungere un manifesto AI-friendly aiuta gli LLM a citare i tuoi contenuti correttamente.",
      scope: "llms",
    });
  }
  return warnings.sort((a, b) => severityRank(a.severity) - severityRank(b.severity));
}

function severityRank(s: AiSearchHealthWarning["severity"]): number {
  if (s === "critical") return 0;
  if (s === "warning") return 1;
  return 2;
}

function ownerOf(bot: BotId): string {
  if (bot.startsWith("GPT") || bot.startsWith("OAI") || bot.startsWith("ChatGPT")) return "OpenAI / ChatGPT";
  if (bot.startsWith("Claude") || bot.startsWith("anthropic")) return "Anthropic / Claude";
  if (bot.startsWith("Perplexity")) return "Perplexity";
  if (bot.startsWith("Google")) return "Google Bard / Gemini";
  if (bot.startsWith("Bytespider")) return "Bytedance / Doubao";
  if (bot.startsWith("CCBot")) return "Common Crawl (training corpus condiviso)";
  return bot;
}

/**
 * Conta URL in sitemap.xml semplice (non sitemap-index ricorsivo).
 * Per stub e prima iterazione live mode è sufficiente.
 */
export function countSitemapUrls(xml: string): number {
  return (xml.match(/<loc>/gi) ?? []).length;
}

/** Status complessivo da BotResult (per badge tabella). */
export function botStatusLabel(s: BotStatus): string {
  if (s === "allowed") return "Allowed";
  if (s === "blocked") return "Blocked";
  if (s === "partial") return "Partial";
  return "Unknown";
}
