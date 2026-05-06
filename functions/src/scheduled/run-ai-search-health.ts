import { onSchedule } from "firebase-functions/scheduler";
import { logger } from "firebase-functions";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

/**
 * AI Search Health (S6c.3) — scheduled WEEKLY lunedì 05:00 Europe/Rome.
 *
 * Misura quanto i bot LLM sono in grado di leggere il sito cliente, senza API
 * esterne (costo 0 — solo HTTP fetch verso il dominio cliente):
 *   1. GET https://{domain}/robots.txt → parser per 11 bot
 *      (GPTBot/OAI-SearchBot/ChatGPT-User/ClaudeBot/Claude-Web/anthropic-ai/
 *       PerplexityBot/Perplexity-User/Google-Extended/Bytespider/CCBot)
 *   2. GET https://{domain}/sitemap.xml → conta <loc> entries
 *   3. GET https://{domain}/llms.txt → presence check (standard emergente)
 *   4. GET https://{domain}/ + 5 pagine campione → check `<meta name="robots">`
 *      e `X-Robots-Tag` per token noai/noimageai/noml
 *   5. Score 0-100 + warnings actionable → denormalizza dentro l'ultimo
 *      `geo_snapshots/{snapshotId}` come campo `aiSearchHealth`
 *
 * Cadenza settimanale (5AM Mon, 1h dopo runGeoTracking) — robots.txt e meta
 * cambiano raramente; cadenza più alta sprecherebbe budget HTTP fetch.
 *
 * Stub-mode di default. Live mode richiede flag `_config/features.ai_search_health_live = true`.
 */

type AiSearchHealthProject = {
  projectId: string;
  domain: string;
};

type BotId =
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

const ALL_BOTS: BotId[] = [
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

type BotStatus = "allowed" | "blocked" | "partial" | "unknown";

type BotResult = {
  bot: BotId;
  status: BotStatus;
  blockedPaths: string[];
};

type AiSearchHealthWarning = {
  severity: "critical" | "warning" | "info";
  message: string;
  scope?: BotId | "robots" | "sitemap" | "meta" | "llms";
};

type AiSearchHealthDoc = {
  projectId: string;
  weekIso: string;
  weekStart: string;
  domain: string;
  score: number;
  bots: BotResult[];
  robotsTxtFound: boolean;
  sitemapFound: boolean;
  sitemapUrlCount: number | null;
  llmsTxtFound: boolean;
  pagesWithNoaiMeta: number;
  pagesScanned: number;
  warnings: AiSearchHealthWarning[];
  source: "stub" | "live";
  checkedAt: FirebaseFirestore.FieldValue;
};

export const runAiSearchHealth = onSchedule(
  {
    schedule: "0 5 * * 1",
    timeZone: "Europe/Rome",
    region: "europe-west1",
    timeoutSeconds: 540,
    memory: "512MiB",
  },
  async () => {
    const db = getFirestore();
    const now = new Date();
    const weekIso = isoWeekKey(now);
    const weekStart = mondayOfIsoWeek(now).toISOString().slice(0, 10);

    const cfg = await db.doc("_config/features").get();
    const enabled =
      cfg.exists && (cfg.get("ai_search_health") as boolean | undefined) === true;
    if (!enabled) {
      logger.info("runAiSearchHealth:skipped", {
        reason: "feature flag _config/features.ai_search_health is OFF",
      });
      return;
    }

    const liveMode =
      cfg.exists && (cfg.get("ai_search_health_live") as boolean | undefined) === true;

    const projects = await listEnabledProjects(db);
    logger.info("runAiSearchHealth:start", {
      weekIso,
      projectCount: projects.length,
      mode: liveMode ? "live" : "stub",
    });

    let ok = 0;
    let errs = 0;

    for (const project of projects) {
      try {
        const result = liveMode
          ? await runLive(project)
          : runStub(project);

        const doc: AiSearchHealthDoc = {
          projectId: project.projectId,
          weekIso,
          weekStart,
          domain: project.domain,
          ...result,
          source: liveMode ? "live" : "stub",
          checkedAt: FieldValue.serverTimestamp(),
        };

        const docId = `${weekIso}__aish`;
        await db
          .doc(`projects/${project.projectId}/ai_search_health/${docId}`)
          .set(doc, { merge: false });
        ok++;
      } catch (err) {
        errs++;
        logger.error("runAiSearchHealth:projectError", {
          projectId: project.projectId,
          error: (err as Error).message,
        });
      }
    }

    logger.info("runAiSearchHealth:done", {
      weekIso,
      ok,
      errors: errs,
      mode: liveMode ? "live" : "stub",
    });
  },
);

async function listEnabledProjects(
  db: FirebaseFirestore.Firestore,
): Promise<AiSearchHealthProject[]> {
  // Riusa flag SEO (AI Search Health è feature dello stesso progetto SEO).
  const snap = await db
    .collection("projects")
    .where("seoTracking.enabled", "==", true)
    .get();
  return snap.docs.map((d) => ({
    projectId: d.id,
    domain: (d.get("domain") as string | undefined) ?? "",
  }));
}

type RunResult = Omit<AiSearchHealthDoc, "projectId" | "weekIso" | "weekStart" | "domain" | "source" | "checkedAt">;

async function runLive(project: AiSearchHealthProject): Promise<RunResult> {
  const base = `https://${project.domain}`;
  const robots = await safeFetchText(`${base}/robots.txt`);
  const sitemap = await safeFetchText(`${base}/sitemap.xml`);
  const llms = await safeFetchText(`${base}/llms.txt`);

  const samplePaths = ["/", "/blog", "/about", "/contatti", "/servizi", "/pricing"];
  let pagesWithNoaiMeta = 0;
  let pagesScanned = 0;
  for (const p of samplePaths) {
    const page = await safeFetchPage(`${base}${p}`);
    if (page) {
      pagesScanned++;
      if (detectNoaiMeta(page.html, page.headers)) pagesWithNoaiMeta++;
    }
  }

  const robotsTxtFound = robots !== null;
  const sitemapFound = sitemap !== null;
  const llmsTxtFound = llms !== null;
  const sitemapUrlCount = sitemap ? countSitemapUrls(sitemap) : null;

  const bots: BotResult[] = robotsTxtFound
    ? Object.values(parseRobotsTxt(robots!))
    : ALL_BOTS.map((bot) => ({ bot, status: "unknown" as BotStatus, blockedPaths: [] }));

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
  };
}

function runStub(project: AiSearchHealthProject): RunResult {
  const rand = pseudoRand(hash(`${project.projectId}|${project.domain}|aish`));

  const COMMON_BLOCKED_PATHS = ["/admin", "/wp-admin", "/api/internal", "/private", "/.well-known", "/cgi-bin"];
  const bots: BotResult[] = ALL_BOTS.map((bot) => {
    const r = rand();
    if (r < 0.12) return { bot, status: "blocked" as BotStatus, blockedPaths: ["/"] };
    if (r < 0.28) {
      const n = 1 + Math.floor(rand() * 3);
      return {
        bot,
        status: "partial" as BotStatus,
        blockedPaths: [...COMMON_BLOCKED_PATHS].sort(() => rand() - 0.5).slice(0, n),
      };
    }
    return { bot, status: "allowed" as BotStatus, blockedPaths: [] };
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
  };
}

// ---------- Helpers HTTP ----------

const FETCH_TIMEOUT_MS = 8_000;
const FETCH_UA = "REZEN-Sites-AiSearchHealthBot/1.0 (+https://rezen.dev)";

async function safeFetchText(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      headers: { "User-Agent": FETCH_UA, Accept: "text/plain, text/xml, */*" },
      redirect: "follow",
    });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

async function safeFetchPage(url: string): Promise<{ html: string; headers: Record<string, string> } | null> {
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      headers: { "User-Agent": FETCH_UA, Accept: "text/html" },
      redirect: "follow",
    });
    if (!res.ok) return null;
    const headers: Record<string, string> = {};
    res.headers.forEach((v, k) => (headers[k.toLowerCase()] = v));
    const html = await res.text();
    return { html, headers };
  } catch {
    return null;
  }
}

// ---------- Parsers (mirror di lib/seo/ai-search-health-parsers.ts) ----------

function parseRobotsTxt(content: string): Record<BotId, BotResult> {
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

function detectNoaiMeta(html: string, headers: Record<string, string>): boolean {
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

function countSitemapUrls(xml: string): number {
  return (xml.match(/<loc>/gi) ?? []).length;
}

function calcAiSearchHealthScore(args: {
  bots: BotResult[];
  robotsTxtFound: boolean;
  sitemapFound: boolean;
  sitemapUrlCount: number | null;
  llmsTxtFound: boolean;
  pagesWithNoaiMeta: number;
  pagesScanned: number;
}): number {
  const botScore =
    args.bots.length === 0
      ? 0
      : args.bots.reduce((acc, b) => {
          if (b.status === "allowed") return acc + 1;
          if (b.status === "partial") return acc + 0.5;
          return acc;
        }, 0) / args.bots.length;
  const robotsScore = args.robotsTxtFound ? 1 : 0.33;
  const sitemapScore =
    args.sitemapFound && (args.sitemapUrlCount ?? 0) > 0 ? 1 : 0;
  const noaiScore =
    args.pagesScanned === 0 ? 1 : 1 - args.pagesWithNoaiMeta / args.pagesScanned;
  const llmsScore = args.llmsTxtFound ? 1 : 0;
  return Math.round(
    botScore * 50 + robotsScore * 15 + sitemapScore * 15 + noaiScore * 10 + llmsScore * 10,
  );
}

function buildAiSearchHealthWarnings(args: {
  bots: BotResult[];
  robotsTxtFound: boolean;
  sitemapFound: boolean;
  sitemapUrlCount: number | null;
  llmsTxtFound: boolean;
  pagesWithNoaiMeta: number;
  pagesScanned: number;
}): AiSearchHealthWarning[] {
  const warnings: AiSearchHealthWarning[] = [];
  for (const b of args.bots) {
    if (b.status === "blocked") {
      warnings.push({
        severity: "critical",
        message: `${b.bot} bloccato in robots.txt — i tuoi contenuti non saranno usati per training né indicizzazione AI.`,
        scope: b.bot,
      });
    } else if (b.status === "partial" && b.blockedPaths.length > 0) {
      warnings.push({
        severity: "warning",
        message: `${b.bot} bloccato su ${b.blockedPaths.length} path (${b.blockedPaths.slice(0, 2).join(", ")}…). Verifica content critico.`,
        scope: b.bot,
      });
    }
  }
  if (!args.robotsTxtFound) {
    warnings.push({
      severity: "warning",
      message: "robots.txt non trovato — bot useranno default permissivi, perdi controllo esplicito.",
      scope: "robots",
    });
  }
  if (!args.sitemapFound || (args.sitemapUrlCount ?? 0) === 0) {
    warnings.push({
      severity: "warning",
      message: "sitemap.xml non trovato o vuoto — copertura LLM imprevedibile.",
      scope: "sitemap",
    });
  }
  if (args.pagesWithNoaiMeta > 0) {
    warnings.push({
      severity: "critical",
      message: `${args.pagesWithNoaiMeta}/${args.pagesScanned} pagine contengono meta noai/noimageai. Rimuovi se vuoi essere citato dagli LLM.`,
      scope: "meta",
    });
  }
  if (!args.llmsTxtFound) {
    warnings.push({
      severity: "info",
      message: "llms.txt assente. Standard emergente per AI manifesto — bonus opzionale.",
      scope: "llms",
    });
  }
  return warnings.sort((a, b) =>
    a.severity === b.severity ? 0 : a.severity === "critical" ? -1 : b.severity === "critical" ? 1 : a.severity === "warning" ? -1 : 1,
  );
}

// ---------- Date helpers ----------

function isoWeekKey(d: Date): string {
  const target = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNr = (target.getUTCDay() + 6) % 7;
  target.setUTCDate(target.getUTCDate() - dayNr + 3);
  const firstThursday = new Date(Date.UTC(target.getUTCFullYear(), 0, 4));
  const diff = (target.getTime() - firstThursday.getTime()) / 86_400_000;
  const week = 1 + Math.round((diff - ((firstThursday.getUTCDay() + 6) % 7) + 3) / 7);
  return `${target.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

function mondayOfIsoWeek(d: Date): Date {
  const target = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNr = (target.getUTCDay() + 6) % 7;
  target.setUTCDate(target.getUTCDate() - dayNr);
  return target;
}

function hash(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return h >>> 0;
}

function pseudoRand(seed: number): () => number {
  let s = seed || 1;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
}
