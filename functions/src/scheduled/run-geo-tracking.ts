import { onSchedule } from "firebase-functions/scheduler";
import { logger } from "firebase-functions";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import {
  ANTHROPIC_API_KEY,
  DATAFORSEO_LOGIN,
  DATAFORSEO_PASSWORD,
  GEMINI_API_KEY,
  OPENAI_API_KEY,
} from "../utils/secrets";

/**
 * GEO Tracking — scheduled WEEKLY lunedì 04:00 Europe/Rome.
 *
 * GEO = Generative Engine Optimization (visibilità su LLM esterni:
 * ChatGPT, Perplexity, Gemini, Claude). Cadenza settimanale (non daily) perché
 * la DataForSEO LLM Mentions API è più lenta/costosa della SERP API e i dati
 * cambiano più lentamente.
 *
 * Per ogni progetto con feature-flag `geo_tracking` abilitato:
 *   1. Legge il keyword set da `projects/{id}/seo_keywords/{keywordId}`
 *      (popolato dall'onboarding wizard S6d, condiviso con runRankAndAeoTracking).
 *   2. Deriva 12-15 query GEO prompt-style dai topic via 7 templates fissi.
 *   3. Per ogni query interroga `llm_mentions/google_ai/live` (DataForSEO) per
 *      ognuno dei 4 LLM, oppure usa client diretti (OpenAI/Anthropic/Gemini)
 *      come fallback — decisione finale in S5.3-bis quando il client è bundlato.
 *   4. Persiste in `projects/{id}/geo_snapshots/{YYYY-WW}__{queryId}` (immutabile,
 *      TTL 365gg su `createdAt` — i dati GEO rimangono utili più a lungo dei dati
 *      SERP perché il trend di visibilità LLM si misura su orizzonti più lunghi).
 *
 * Stub-mode di default — attiva live mode quando i secrets DataForSEO + LLM keys
 * sono presenti AND la EU residency è confermata AND `geo_tracking_live` flag è ON.
 *
 * Costo target a regime: ~$2.40/cliente/mese per 15 query × 4 LLM (brief §5).
 *
 * NOTA TTL: TTL 365gg sulla collection `geo_snapshots` da configurare post-deploy via:
 *   gcloud firestore fields ttls update createdAt \
 *     --collection-group=geo_snapshots \
 *     --enable-ttl \
 *     --project=<PROJECT_ID>
 */

type GeoTrackingProject = {
  projectId: string;
  domain: string;
  countryCode: string;
  languageCode: string;
};

type KeywordEntry = {
  id: string;
  keyword: string;
  searchVolume: number;
};

type GeoLlmId = "chatgpt" | "perplexity" | "gemini" | "claude";

type GeoQueryCategory =
  | "recommendation"
  | "comparison"
  | "definition"
  | "howto"
  | "ranking";

const ALL_LLMS: GeoLlmId[] = ["chatgpt", "perplexity", "gemini", "claude"];

/**
 * Templates query GEO. Mirror di `lib/seo/geo-stub.ts:QUERY_TEMPLATES`
 * (lato client) — keep in sync. Modificarne uno solo ti dà 2 popolazioni
 * differenti per la stessa query, rendendo i confronti unstable.
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
 * Bias per LLM: probabilità di mention del cliente in stub mode.
 * Mirror di `lib/seo/geo-stub.ts:LLM_MENTION_BIAS` — keep in sync.
 */
const LLM_MENTION_BIAS: Record<GeoLlmId, number> = {
  chatgpt: 0.4,
  perplexity: 0.55,
  gemini: 0.32,
  claude: 0.28,
};

type GeoMention = {
  llm: GeoLlmId;
  mentioned: boolean;
  rank: number | null;
  sentiment: "positive" | "neutral" | "negative" | null;
  citedDomains: string[];
};

/**
 * Vista GEO denormalizzata sullo snapshot per query veloci senza scan/ricalcolo
 * lato client (top opportunità progetto, query con 0 mention, ecc.).
 *
 * Mirror logico di `lib/seo/geo-types.ts` (lato client) ma aggregato per query
 * (lato client il dato è split per LLM in `mentions[llm]`).
 */
type GeoFields = {
  /** Numero LLM (0-4) in cui il cliente è citato. */
  mentionedCount: number;
  /** Posizione media ranking nelle citazioni dove mentioned. Null se mai. */
  avgRank: number | null;
  /** Posizione minima (best) ranking nelle citazioni dove mentioned. Null se mai. */
  bestRank: number | null;
  /** True se mentionedCount < ALL_LLMS.length (margine di crescita). */
  hasOpportunity: boolean;
  /** Score = searchVolume × (1 - mentionedCount/total). Ordinabile per "top opportunità". */
  opportunityScore: number;
  /** True se almeno 1 mention ha sentiment "negative" — richiede attenzione brand. */
  hasNegativeSentiment: boolean;
};

type GeoSnapshotDoc = {
  queryId: string;
  queryText: string;
  category: GeoQueryCategory;
  projectId: string;
  weekIso: string; // es. "2026-W18"
  weekStart: string; // es. "2026-04-27" (lunedì della settimana ISO)
  searchVolume: number;
  mentions: Record<GeoLlmId, GeoMention>;
  geo: GeoFields;
  source: "stub" | "dataforseo";
  createdAt: FirebaseFirestore.FieldValue;
};

export const runGeoTracking = onSchedule(
  {
    schedule: "0 4 * * 1", // ogni lunedì alle 04:00
    timeZone: "Europe/Rome",
    region: "europe-west1",
    secrets: [
      DATAFORSEO_LOGIN,
      DATAFORSEO_PASSWORD,
      OPENAI_API_KEY,
      ANTHROPIC_API_KEY,
      GEMINI_API_KEY,
    ],
    timeoutSeconds: 540,
    memory: "1GiB",
  },
  async () => {
    const db = getFirestore();
    const now = new Date();
    const weekIso = isoWeekKey(now);
    const weekStart = mondayOfIsoWeek(now).toISOString().slice(0, 10);

    const flagSnap = await db.doc("_config/features").get();
    const globalEnabled = flagSnap.exists
      ? (flagSnap.get("geo_tracking") as boolean | undefined) === true
      : false;

    if (!globalEnabled) {
      logger.info("runGeoTracking:skipped", {
        reason: "feature flag _config/features.geo_tracking is OFF",
        weekIso,
      });
      return;
    }

    const liveMode = await resolveLiveMode(db);
    const llmClient = liveMode ? await loadLlmMentionsClient() : null;

    const projects = await listEnabledProjects(db);
    logger.info("runGeoTracking:start", {
      weekIso,
      projectCount: projects.length,
      mode: liveMode ? "live" : "stub",
    });

    let totalQueries = 0;
    let totalErrors = 0;

    for (const project of projects) {
      const keywords = await listProjectKeywords(db, project.projectId);
      if (keywords.length === 0) {
        logger.info("runGeoTracking:project:noKeywords", {
          projectId: project.projectId,
        });
        continue;
      }

      const queries = buildQueriesForProject({
        projectId: project.projectId,
        domain: project.domain,
        weekIso,
        keywords,
      });

      for (const q of queries) {
        try {
          const snap = await fetchGeoSnapshot({
            project,
            query: q,
            weekIso,
            weekStart,
            llmClient,
          });
          const docId = `${weekIso}__${q.id}`;
          await db
            .doc(`projects/${project.projectId}/geo_snapshots/${docId}`)
            .set(snap, { merge: false });
          totalQueries++;
        } catch (err) {
          totalErrors++;
          logger.error("runGeoTracking:queryError", {
            projectId: project.projectId,
            queryId: q.id,
            error: (err as Error).message,
          });
        }
      }
    }

    logger.info("runGeoTracking:done", {
      weekIso,
      queries: totalQueries,
      errors: totalErrors,
      mode: liveMode ? "live" : "stub",
    });
  },
);

async function resolveLiveMode(
  db: FirebaseFirestore.Firestore,
): Promise<boolean> {
  const cfg = await db.doc("_config/features").get();
  const flag = cfg.get("geo_tracking_live") as boolean | undefined;
  if (flag !== true) return false;
  try {
    return (
      !!DATAFORSEO_LOGIN.value() &&
      !!DATAFORSEO_PASSWORD.value() &&
      !!OPENAI_API_KEY.value() &&
      !!ANTHROPIC_API_KEY.value() &&
      !!GEMINI_API_KEY.value()
    );
  } catch {
    return false;
  }
}

/**
 * Loader del client LLM Mentions. Quando S5.3-bis bundlerà il client DataForSEO
 * in `functions/src/seo/`, sostituire questo placeholder con il vero loader.
 *
 * Per ora ritorna sempre null → `liveMode` resta inattivo finché il client non
 * è disponibile (fallback grazioso a stub in `fetchGeoSnapshot`).
 */
async function loadLlmMentionsClient(): Promise<null> {
  logger.warn("runGeoTracking:loadLlmMentionsClient", {
    msg: "live mode requested but LLM Mentions client wrapper not bundled in functions/ — falling back to stub",
  });
  return null;
}

async function listEnabledProjects(
  db: FirebaseFirestore.Firestore,
): Promise<GeoTrackingProject[]> {
  // Riusa il flag `seoTracking.enabled` (GEO è feature dello stesso progetto SEO).
  // Quando un cliente vorrà GEO senza SEO, introdurre `geoTracking.enabled` separato.
  const snap = await db
    .collection("projects")
    .where("seoTracking.enabled", "==", true)
    .get();
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      projectId: d.id,
      domain: (data.domain as string | undefined) ?? "",
      countryCode: (data.seoTracking?.countryCode as string | undefined) ?? "CH",
      languageCode: (data.seoTracking?.languageCode as string | undefined) ?? "it",
    };
  });
}

async function listProjectKeywords(
  db: FirebaseFirestore.Firestore,
  projectId: string,
): Promise<KeywordEntry[]> {
  const snap = await db
    .collection(`projects/${projectId}/seo_keywords`)
    .get();
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      keyword: (data.keyword as string | undefined) ?? "",
      searchVolume: (data.searchVolume as number | undefined) ?? 0,
    };
  });
}

type GeneratedQuery = {
  id: string;
  query: string;
  category: GeoQueryCategory;
  searchVolume: number;
};

function buildQueriesForProject(input: {
  projectId: string;
  domain: string;
  weekIso: string;
  keywords: KeywordEntry[];
}): GeneratedQuery[] {
  const { projectId, domain, weekIso, keywords } = input;
  const seed = hash(`${projectId}::${domain}::geo::${weekIso}`);
  const rand = pseudoRand(seed);
  const targetCount = Math.min(15, Math.max(6, keywords.length));
  const out: GeneratedQuery[] = [];

  for (let i = 0; i < targetCount; i++) {
    const kw = keywords[i % keywords.length];
    const tpl = QUERY_TEMPLATES[Math.floor(rand() * QUERY_TEMPLATES.length)];
    const queryText = tpl.template.replace(/\{topic\}/g, kw.keyword);
    const id = `geo-q-${hash(`${projectId}::${queryText}`).toString(36)}`;
    const volJitter = 0.25 + rand() * 0.3;
    out.push({
      id,
      query: queryText,
      category: tpl.category,
      searchVolume: Math.round(kw.searchVolume * volJitter),
    });
  }

  return out;
}

async function fetchGeoSnapshot(input: {
  project: GeoTrackingProject;
  query: GeneratedQuery;
  weekIso: string;
  weekStart: string;
  llmClient: unknown | null;
}): Promise<GeoSnapshotDoc> {
  const { project, query, weekIso, weekStart, llmClient } = input;
  if (llmClient === null) {
    return stubSnapshot(project, query, weekIso, weekStart);
  }
  // S5.3-bis: chiamata live a llm_mentions/google_ai/live (o client diretto LLM).
  // Quando implementato:
  //   - per ogni LLM, ottenere risposta + lista citation domains
  //   - derivare GeoMention { mentioned, rank, sentiment, citedDomains }
  //   - chiamare computeGeoFields(mentions, searchVolume) per popolare geo
  throw new Error("live mode not implemented yet");
}

function stubSnapshot(
  project: GeoTrackingProject,
  query: GeneratedQuery,
  weekIso: string,
  weekStart: string,
): GeoSnapshotDoc {
  const seed = hash(`${project.projectId}::${query.id}::${weekIso}`);
  const rand = pseudoRand(seed);

  // Set competitor stub (in produzione verrà letto da `projects/{id}/competitors`).
  // Per ora usiamo placeholder generici.
  const competitorPool = [
    "competitor-a.com",
    "competitor-b.com",
    "competitor-c.com",
    "competitor-d.com",
    "competitor-e.com",
  ];

  const mentions = {} as Record<GeoLlmId, GeoMention>;
  for (const llm of ALL_LLMS) {
    mentions[llm] = generateMention({
      llm,
      rand,
      ownerDomain: project.domain,
      competitors: competitorPool,
    });
  }

  const geo = computeGeoFields(mentions, query.searchVolume);

  return {
    queryId: query.id,
    queryText: query.query,
    category: query.category,
    projectId: project.projectId,
    weekIso,
    weekStart,
    searchVolume: query.searchVolume,
    mentions,
    geo,
    source: "stub",
    createdAt: FieldValue.serverTimestamp(),
  };
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

  const totalCited = 3 + Math.floor(rand() * 4);
  const candidates = [...competitors];
  for (let i = candidates.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
  }
  const cited = candidates.slice(0, Math.max(0, totalCited - 1));

  let rank: number | null = null;
  if (mentioned) {
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

function pickSentiment(
  rand: () => number,
): "positive" | "neutral" | "negative" {
  const roll = rand();
  if (roll < 0.45) return "positive";
  if (roll < 0.9) return "neutral";
  return "negative";
}

function computeGeoFields(
  mentions: Record<GeoLlmId, GeoMention>,
  searchVolume: number,
): GeoFields {
  let mentionedCount = 0;
  let rankSum = 0;
  let rankCount = 0;
  let bestRank: number | null = null;
  let hasNegativeSentiment = false;

  for (const llm of ALL_LLMS) {
    const m = mentions[llm];
    if (m.mentioned) {
      mentionedCount++;
      if (m.rank !== null) {
        rankSum += m.rank;
        rankCount++;
        if (bestRank === null || m.rank < bestRank) bestRank = m.rank;
      }
    }
    if (m.sentiment === "negative") hasNegativeSentiment = true;
  }

  const total = ALL_LLMS.length;
  const opportunityRatio = 1 - mentionedCount / total;
  return {
    mentionedCount,
    avgRank: rankCount > 0 ? Math.round((rankSum / rankCount) * 10) / 10 : null,
    bestRank,
    hasOpportunity: mentionedCount < total,
    opportunityScore: Math.round(searchVolume * opportunityRatio * 10) / 10,
    hasNegativeSentiment,
  };
}

/**
 * ISO week key in formato "YYYY-Www" (es. "2026-W18").
 * Usato come prefisso del docId per garantire ordinamento naturale e
 * deduplicazione (1 doc per query per settimana).
 */
function isoWeekKey(d: Date): string {
  const target = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNr = (target.getUTCDay() + 6) % 7; // Mon=0
  target.setUTCDate(target.getUTCDate() - dayNr + 3); // giovedì della settimana ISO
  const firstThursday = new Date(Date.UTC(target.getUTCFullYear(), 0, 4));
  const diff = (target.getTime() - firstThursday.getTime()) / 86_400_000;
  const week = 1 + Math.round((diff - ((firstThursday.getUTCDay() + 6) % 7) + 3) / 7);
  return `${target.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

function mondayOfIsoWeek(d: Date): Date {
  const target = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNr = (target.getUTCDay() + 6) % 7; // Mon=0
  target.setUTCDate(target.getUTCDate() - dayNr);
  return target;
}

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
