import { Firestore } from "firebase-admin/firestore";
import {
  REZEN_DEFAULT_PRIMARY,
  type ReportActionItem,
  type ReportAeoSection,
  type ReportAishSection,
  type ReportBranding,
  type ReportGeoSection,
  type ReportKpi,
  type ReportPayload,
  type ReportPeriod,
  type ReportSeoSection,
} from "./types";

const ITALIAN_MONTHS = [
  "Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno",
  "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre",
];

export function monthKeyOf(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

export function periodFromMonthKey(monthKey: string): ReportPeriod {
  const [yStr, mStr] = monthKey.split("-");
  const year = Number(yStr);
  const month = Number(mStr) - 1;
  const start = new Date(Date.UTC(year, month, 1));
  const end = new Date(Date.UTC(year, month + 1, 0));
  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
    label: `${ITALIAN_MONTHS[month]} ${year}`,
  };
}

export async function buildReportPayload(input: {
  db: Firestore;
  projectId: string;
  project: FirebaseFirestore.DocumentData;
  period: ReportPeriod;
}): Promise<ReportPayload> {
  const { db, projectId, project, period } = input;

  const branding: ReportBranding = {
    logoUrl: project.branding?.logoUrl ?? null,
    primaryColor: project.branding?.primaryColor ?? REZEN_DEFAULT_PRIMARY,
    brandName: project.name ?? project.domain ?? "Cliente",
  };
  const domain = (project.domain as string | undefined) ?? "";

  // Carica snapshots più recenti del periodo (latest fino a periodEnd).
  const [seo, aeo, geo, aish] = await Promise.all([
    loadSeoSection(db, projectId),
    loadAeoSection(db, projectId),
    loadGeoSection(db, projectId),
    loadAishSection(db, projectId),
  ]);

  const kpi: ReportKpi = {
    authorityScore: seo?.authority.score ?? 0,
    authorityDelta: null,
    visibilityScore: seo?.visibilityPercent ?? 0,
    visibilityDelta: null,
    aiVisibilityScore: geo?.visibilityScore ?? 0,
    aiVisibilityDelta: null,
    brandSentiment: geo?.sentimentScore ?? 0,
    brandSentimentDelta: null,
  };

  const actions = deriveActionItemsFromSections({ seo, aeo, geo, aish });

  return {
    projectId,
    domain,
    period,
    branding,
    generatedAt: new Date(),
    kpi,
    seo,
    aeo,
    geo,
    aish,
    actions,
  };
}

async function loadSeoSection(
  _db: Firestore,
  _projectId: string,
): Promise<ReportSeoSection | null> {
  // S8 stub: il report data SEO non è ancora persistito (dipende da rank_snapshots
  // aggregati). Ritorno stub deterministic da projectId per dare un PDF demo
  // ricco. Quando S5.3-bis live mode bundla DataForSEO → leggere da Firestore.
  const seed = hash(_projectId + ":seo");
  const rand = pseudoRand(seed);
  return {
    authority: {
      score: 65 + Math.floor(rand() * 25),
      linkPower: 70 + Math.floor(rand() * 25),
      traffic: 40 + Math.floor(rand() * 30),
      naturalProfile: 75 + Math.floor(rand() * 20),
    },
    visibilityPercent: 18 + Math.floor(rand() * 15),
    estimatedTrafficClicks: 500 + Math.floor(rand() * 800),
    distribution: {
      top3: 3 + Math.floor(rand() * 4),
      top10: 4 + Math.floor(rand() * 6),
      top20: 5 + Math.floor(rand() * 5),
      top100: 6 + Math.floor(rand() * 8),
      beyond: 2 + Math.floor(rand() * 4),
    },
    topKeywords: [
      { keyword: "agenzia web ticino", position: 2, searchVolume: 480, estimatedClicks: 84 },
      { keyword: "cms ai-driven 2026", position: 1, searchVolume: 720, estimatedClicks: 252 },
      { keyword: "miglior site builder pmi", position: 3, searchVolume: 320, estimatedClicks: 32 },
      { keyword: "seo lugano agenzia", position: 4, searchVolume: 210, estimatedClicks: 17 },
      { keyword: "preventivo sito ecommerce ticino", position: 1, searchVolume: 130, estimatedClicks: 45 },
      { keyword: "headless cms italiano", position: 3, searchVolume: 290, estimatedClicks: 29 },
      { keyword: "come scegliere webflow vs framer", position: 7, searchVolume: 150, estimatedClicks: 6 },
      { keyword: "prezzo sito web aziendale", position: 9, searchVolume: 410, estimatedClicks: 8 },
      { keyword: "verumflow", position: 1, searchVolume: 85, estimatedClicks: 30 },
      { keyword: "rezen sites", position: 1, searchVolume: 59, estimatedClicks: 21 },
    ],
  };
}

async function loadAeoSection(
  _db: Firestore,
  _projectId: string,
): Promise<ReportAeoSection | null> {
  const seed = hash(_projectId + ":aeo");
  const rand = pseudoRand(seed);
  return {
    aeoScore: 30 + Math.floor(rand() * 40),
    serpFeatures: {
      aiOverview: 5 + Math.floor(rand() * 5),
      featuredSnippet: 2 + Math.floor(rand() * 4),
      paa: 6 + Math.floor(rand() * 6),
      knowledgePanel: Math.floor(rand() * 2),
    },
    ownedFeatures: 1 + Math.floor(rand() * 3),
    topOpportunities: [
      { keyword: "miglior cms ai-driven 2026", feature: "AI Overview", effort: "low" },
      { keyword: "headless cms italiano", feature: "Featured Snippet", effort: "medium" },
      { keyword: "come scegliere webflow vs framer", feature: "PAA", effort: "low" },
      { keyword: "agenzia web ticino", feature: "AI Overview", effort: "high" },
      { keyword: "preventivo sito ecommerce ticino", feature: "Featured Snippet", effort: "medium" },
    ],
  };
}

async function loadGeoSection(
  db: Firestore,
  projectId: string,
): Promise<ReportGeoSection | null> {
  // S8: prova a leggere snapshot reali da geo_snapshots (S6b.3). Se vuoto, fallback stub.
  // Per il primo iteration aggregate: prendiamo l'ultimo weekIso disponibile.
  try {
    const snap = await db
      .collection(`projects/${projectId}/geo_snapshots`)
      .orderBy("weekIso", "desc")
      .limit(15)
      .get();
    if (!snap.empty) {
      let totalMentions = 0;
      let totalCitations = 0;
      let positive = 0, neutral = 0, negative = 0;
      const llmMentioned: Record<string, number> = { chatgpt: 0, perplexity: 0, gemini: 0, claude: 0 };
      const llmTotal: Record<string, number> = { chatgpt: 0, perplexity: 0, gemini: 0, claude: 0 };
      for (const doc of snap.docs) {
        const data = doc.data();
        for (const llm of ["chatgpt", "perplexity", "gemini", "claude"]) {
          const m = data.mentions?.[llm];
          if (!m) continue;
          llmTotal[llm]++;
          if (m.mentioned) {
            llmMentioned[llm]++;
            totalMentions++;
            if (m.isCitation) totalCitations++;
            if (m.sentiment === "positive") positive++;
            else if (m.sentiment === "negative") negative++;
            else neutral++;
          }
        }
      }
      const total = positive + neutral + negative;
      const sentimentScore = total > 0 ? Math.round(((positive - negative) / total) * 100) : 0;
      const perLlm = ["chatgpt", "perplexity", "gemini", "claude"].map((llm) => ({
        llm: llm.charAt(0).toUpperCase() + llm.slice(1),
        score: llmTotal[llm] > 0 ? Math.round((llmMentioned[llm] / llmTotal[llm]) * 100) : 0,
        mentioned: llmMentioned[llm],
        total: llmTotal[llm],
      }));
      const visibilityScore =
        perLlm.reduce((s, l) => s + l.score, 0) / perLlm.length;
      const citationRate =
        totalMentions > 0
          ? Math.round((totalCitations / totalMentions) * 1000) / 10
          : 0;
      return {
        visibilityScore,
        perLlm,
        sentimentScore,
        sentimentDistribution: { positive, neutral, negative },
        citationRate,
        totalMentions,
        totalCitations,
      };
    }
  } catch (err) {
    // ignore, fallback stub
  }
  return geoSectionStub(projectId);
}

function geoSectionStub(projectId: string): ReportGeoSection {
  const seed = hash(projectId + ":geo");
  const rand = pseudoRand(seed);
  return {
    visibilityScore: 25 + Math.floor(rand() * 30),
    perLlm: [
      { llm: "ChatGPT", score: 40 + Math.floor(rand() * 30), mentioned: 6 + Math.floor(rand() * 4), total: 15 },
      { llm: "Perplexity", score: 25 + Math.floor(rand() * 25), mentioned: 4 + Math.floor(rand() * 3), total: 15 },
      { llm: "Gemini", score: 15 + Math.floor(rand() * 25), mentioned: 2 + Math.floor(rand() * 4), total: 15 },
      { llm: "Claude", score: 25 + Math.floor(rand() * 25), mentioned: 4 + Math.floor(rand() * 3), total: 15 },
    ],
    sentimentScore: Math.floor(rand() * 60) - 10,
    sentimentDistribution: {
      positive: 8 + Math.floor(rand() * 5),
      neutral: 8 + Math.floor(rand() * 5),
      negative: 1 + Math.floor(rand() * 3),
    },
    citationRate: 15 + Math.floor(rand() * 25),
    totalMentions: 18 + Math.floor(rand() * 8),
    totalCitations: 4 + Math.floor(rand() * 6),
  };
}

async function loadAishSection(
  db: Firestore,
  projectId: string,
): Promise<ReportAishSection | null> {
  try {
    const snap = await db
      .collection(`projects/${projectId}/ai_search_health`)
      .orderBy("weekIso", "desc")
      .limit(1)
      .get();
    if (!snap.empty) {
      const data = snap.docs[0].data();
      return {
        score: data.score ?? 0,
        bots: (data.bots ?? []).map((b: { bot: string; status: string }) => ({
          bot: b.bot,
          status: (b.status as ReportAishSection["bots"][number]["status"]) ?? "unknown",
        })),
        warnings: (data.warnings ?? []).map((w: { severity: string; message: string }) => ({
          severity: (w.severity as ReportAishSection["warnings"][number]["severity"]) ?? "info",
          message: w.message,
        })),
        signals: {
          robotsTxtFound: !!data.robotsTxtFound,
          sitemapFound: !!data.sitemapFound,
          sitemapUrlCount: data.sitemapUrlCount ?? null,
          llmsTxtFound: !!data.llmsTxtFound,
          pagesWithNoaiMeta: data.pagesWithNoaiMeta ?? 0,
          pagesScanned: data.pagesScanned ?? 0,
        },
      };
    }
  } catch {
    // ignore
  }
  // Stub
  return {
    score: 70 + Math.floor(Math.random() * 20),
    bots: [
      { bot: "GPTBot", status: "allowed" },
      { bot: "OAI-SearchBot", status: "blocked" },
      { bot: "ChatGPT-User", status: "allowed" },
      { bot: "ClaudeBot", status: "blocked" },
      { bot: "Claude-Web", status: "blocked" },
      { bot: "anthropic-ai", status: "partial" },
      { bot: "PerplexityBot", status: "allowed" },
      { bot: "Perplexity-User", status: "partial" },
      { bot: "Google-Extended", status: "allowed" },
      { bot: "Bytespider", status: "allowed" },
      { bot: "CCBot", status: "allowed" },
    ],
    warnings: [
      { severity: "critical", message: "OAI-SearchBot bloccato in robots.txt — sito non indicizzato da OpenAI Search." },
      { severity: "critical", message: "ClaudeBot e Claude-Web bloccati in robots.txt — sito invisibile a Claude." },
      { severity: "info", message: "llms.txt assente. Standard emergente AI manifesto — bonus opzionale." },
    ],
    signals: {
      robotsTxtFound: true,
      sitemapFound: true,
      sitemapUrlCount: 9,
      llmsTxtFound: false,
      pagesWithNoaiMeta: 0,
      pagesScanned: 6,
    },
  };
}

function deriveActionItemsFromSections(input: {
  seo: ReportSeoSection | null;
  aeo: ReportAeoSection | null;
  geo: ReportGeoSection | null;
  aish: ReportAishSection | null;
}): ReportActionItem[] {
  const out: ReportActionItem[] = [];

  if (input.aish) {
    const blocked = input.aish.bots.filter((b) => b.status === "blocked");
    if (blocked.length >= 2) {
      out.push({
        source: "aish",
        severity: "high",
        effort: "low",
        title: `${blocked.length} bot LLM bloccati in robots.txt`,
        detail: `${blocked.map((b) => b.bot).slice(0, 3).join(", ")} non possono indicizzare il sito. Rimuovi le righe Disallow per questi User-Agent in robots.txt — fix in 5 minuti, sblocca visibilità su ChatGPT/Claude/Perplexity.`,
      });
    }
    if (input.aish.signals.pagesWithNoaiMeta > 0) {
      out.push({
        source: "aish",
        severity: "high",
        effort: "low",
        title: `${input.aish.signals.pagesWithNoaiMeta} pagine con meta noai/noimageai`,
        detail: "Queste pagine sono escluse dal training/indicizzazione AI. Rimuovi i meta dalle pagine pubbliche per essere citato dagli LLM.",
      });
    }
    if (!input.aish.signals.sitemapFound || (input.aish.signals.sitemapUrlCount ?? 0) === 0) {
      out.push({
        source: "aish",
        severity: "medium",
        effort: "medium",
        title: "sitemap.xml mancante o vuota",
        detail: "Senza sitemap, i bot LLM scoprono solo le pagine raggiungibili da link interni. Genera sitemap.xml dinamica per copertura completa.",
      });
    }
  }

  if (input.geo && input.geo.totalMentions > 0 && input.geo.citationRate < 25) {
    out.push({
      source: "geo",
      severity: "medium",
      effort: "high",
      title: `Citation rate basso: ${input.geo.citationRate.toFixed(1)}%`,
      detail: `Citato testualmente ${input.geo.totalMentions} volte ma con link cliccabile solo ${input.geo.totalCitations}. Crea content che invita link diretti: FAQ, guide tecniche, ricerche originali. Target ≥40%.`,
    });
  }

  if (input.geo && input.geo.sentimentDistribution.negative >= 2) {
    out.push({
      source: "geo",
      severity: "high",
      effort: "high",
      title: `${input.geo.sentimentDistribution.negative} mention con sentiment negativo`,
      detail: "Gli LLM citano il brand in contesti che riducono trust. Risposta: produci content correttivo (case study, testimonial) o PR di risposta diretta sui topic problematici.",
    });
  }

  if (input.seo) {
    const top10Opps = input.seo.topKeywords.filter(
      (k) => k.position >= 4 && k.position <= 10,
    );
    if (top10Opps.length >= 2) {
      const top = top10Opps.slice(0, 3);
      out.push({
        source: "seo",
        severity: "medium",
        effort: "medium",
        title: `${top10Opps.length} keyword vicino al top 3`,
        detail: `Quick win: ${top.map((k) => `"${k.keyword}" (pos. ${k.position}, ${k.searchVolume}/mo)`).join(", ")}. Migliora internal linking, aggiungi FAQ schema, espandi content con keyword secondarie correlate.`,
      });
    }
  }

  if (input.aeo && input.aeo.topOpportunities.length > 0) {
    const lowEffort = input.aeo.topOpportunities.filter((o) => o.effort === "low");
    if (lowEffort.length >= 2) {
      out.push({
        source: "aeo",
        severity: "medium",
        effort: "low",
        title: `${lowEffort.length} feature SERP a portata di mano`,
        detail: `Opportunità AEO low-effort: ${lowEffort.slice(0, 3).map((o) => `"${o.keyword}" (${o.feature})`).join(", ")}. Aggiungi schema FAQ/HowTo per essere selezionato come fonte SERP feature.`,
      });
    }
  }

  // Sort: high severity first, low effort first
  const sevR = { high: 0, medium: 1, low: 2 };
  const effR = { low: 0, medium: 1, high: 2 };
  out.sort((a, b) => {
    if (sevR[a.severity] !== sevR[b.severity]) return sevR[a.severity] - sevR[b.severity];
    return effR[a.effort] - effR[b.effort];
  });
  return out.slice(0, 5);
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
