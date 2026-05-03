import type {
  Competitor,
  KeywordIntent,
  SeoSnapshot,
  SeoTrendPoint,
  TrackedKeyword,
} from "./seo-types";
import { calcDistribution, calcEstimatedTraffic, calcVisibility } from "./visibility";
import { calcVfAuthority } from "./vf-authority";

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

const INTENTS: KeywordIntent[] = [
  "informational",
  "commercial",
  "transactional",
  "navigational",
];

/**
 * Mock keyword set per progetto demo. Verrà sostituito da set generato
 * dal wizard onboarding (S6d) — per ora hardcoded per popolare grafici.
 */
const MOCK_KEYWORDS_BY_PROJECT: Record<
  string,
  { keyword: string; intent: KeywordIntent; baseVolume: number }[]
> = {
  "verumflow-ch": [
    { keyword: "cms svizzera", intent: "commercial", baseVolume: 720 },
    { keyword: "agenzia web ticino", intent: "commercial", baseVolume: 480 },
    { keyword: "sito web aziendale lugano", intent: "commercial", baseVolume: 390 },
    { keyword: "creazione siti web pmi", intent: "commercial", baseVolume: 1100 },
    { keyword: "verumflow", intent: "navigational", baseVolume: 90 },
    { keyword: "rezen sites", intent: "navigational", baseVolume: 60 },
    { keyword: "alternative a webflow italiano", intent: "informational", baseVolume: 320 },
    { keyword: "miglior cms ai-driven 2026", intent: "informational", baseVolume: 880 },
    { keyword: "webflow vs framer pmi", intent: "informational", baseVolume: 560 },
    { keyword: "preventivo sito ecommerce ticino", intent: "transactional", baseVolume: 240 },
    { keyword: "headless cms italiano", intent: "informational", baseVolume: 410 },
    { keyword: "seo lugano agenzia", intent: "commercial", baseVolume: 290 },
    { keyword: "site builder pro agency", intent: "commercial", baseVolume: 510 },
    { keyword: "automazione contenuti ai cms", intent: "informational", baseVolume: 670 },
    { keyword: "lead generation per agenzie web", intent: "commercial", baseVolume: 380 },
    { keyword: "site speed optimization servizio", intent: "transactional", baseVolume: 150 },
    { keyword: "audit seo automatizzato saas", intent: "commercial", baseVolume: 220 },
    { keyword: "rebrand digital agency 2026", intent: "informational", baseVolume: 90 },
    { keyword: "monitoraggio ai overviews tool", intent: "informational", baseVolume: 340 },
    { keyword: "geo seo generative engine optimization", intent: "informational", baseVolume: 1200 },
  ],
  "impresa-edile-carfi": [
    { keyword: "impresa edile ticino", intent: "commercial", baseVolume: 880 },
    { keyword: "ristrutturazione bagno lugano", intent: "transactional", baseVolume: 540 },
    { keyword: "preventivo edile gratuito", intent: "transactional", baseVolume: 720 },
    { keyword: "ristrutturazione condominio", intent: "commercial", baseVolume: 410 },
    { keyword: "carfi impresa", intent: "navigational", baseVolume: 70 },
    { keyword: "appalto edile ticino", intent: "commercial", baseVolume: 230 },
    { keyword: "ristrutturazione hotel ticino", intent: "commercial", baseVolume: 180 },
    { keyword: "imbianchino lugano", intent: "transactional", baseVolume: 990 },
    { keyword: "impresa costruzioni mendrisio", intent: "commercial", baseVolume: 320 },
    { keyword: "rifacimento facciate ticino", intent: "commercial", baseVolume: 270 },
  ],
  "consulting-bio": [
    { keyword: "consulenza certificazione bio", intent: "commercial", baseVolume: 410 },
    { keyword: "agricoltura biologica certificazione", intent: "informational", baseVolume: 870 },
    { keyword: "consulente bio svizzera", intent: "commercial", baseVolume: 220 },
    { keyword: "iter certificazione bio italia", intent: "informational", baseVolume: 680 },
  ],
};

const MOCK_COMPETITORS_BY_PROJECT: Record<string, string[]> = {
  "verumflow-ch": ["webflow.com", "framer.com", "squarespace.com"],
  "impresa-edile-carfi": [
    "ediliziaprofessionale.ch",
    "construction-ticino.ch",
    "edilcasa-lugano.ch",
  ],
  "consulting-bio": [
    "biosuisse.ch",
    "consulenza-bio.it",
    "icea-organic.com",
  ],
};

export function getMockKeywords(projectId: string) {
  return MOCK_KEYWORDS_BY_PROJECT[projectId] ?? [];
}

export function getMockCompetitors(projectId: string) {
  return MOCK_COMPETITORS_BY_PROJECT[projectId] ?? [];
}

function generateKeyword(
  template: { keyword: string; intent: KeywordIntent; baseVolume: number },
  rand: () => number,
  trendBias: number,
): TrackedKeyword {
  const positionRoll = rand();
  let position: number;
  if (positionRoll < 0.18) position = 1 + Math.floor(rand() * 3);
  else if (positionRoll < 0.45) position = 4 + Math.floor(rand() * 7);
  else if (positionRoll < 0.7) position = 11 + Math.floor(rand() * 10);
  else if (positionRoll < 0.92) position = 21 + Math.floor(rand() * 80);
  else position = 0;

  const prevDelta = Math.floor((rand() - 0.5) * 6);
  const prevPosition =
    position === 0 ? null : Math.max(1, position + prevDelta + trendBias);

  const featRoll = rand();
  const features: TrackedKeyword["features"] = {};
  if (featRoll < 0.25) features.aiOverview = true;
  if (featRoll > 0.85) features.featuredSnippet = true;
  if (featRoll > 0.55 && featRoll < 0.7) features.paa = true;
  if (rand() < 0.12 && (features.aiOverview || features.featuredSnippet)) {
    if (features.aiOverview) features.aiOverviewOwner = true;
    if (features.featuredSnippet) features.featuredSnippetOwner = true;
  }
  if (rand() < 0.18) features.adsPack = true;

  const volumeJitter = 0.7 + rand() * 0.6;
  const searchVolume = Math.round(template.baseVolume * volumeJitter);

  return {
    id: `kw-${hash(template.keyword)}`,
    keyword: template.keyword,
    searchVolume,
    intent: template.intent,
    position,
    prevPosition,
    url: position > 0 ? `https://www.example.com/${template.keyword.replace(/\s+/g, "-")}` : null,
    features,
  };
}

function generateCompetitor(
  domain: string,
  rand: () => number,
  ownerEtv: number,
): Competitor {
  const ratio = 0.4 + rand() * 1.4;
  return {
    domain,
    label: domain
      .replace(/^www\./, "")
      .replace(/\.[a-z]{2,4}$/, "")
      .split(/[-.]/)
      .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
      .join(" "),
    estimatedTraffic: Math.round(ownerEtv * ratio),
    authorityScore: Math.round(35 + rand() * 55),
  };
}

export function generateStubSnapshot(input: {
  projectId: string;
  domain: string;
  source?: "stub" | "dataforseo";
  trendDayOffset?: number;
}): SeoSnapshot {
  const { projectId, domain, source = "stub", trendDayOffset = 0 } = input;
  const seed = hash(`${projectId}::${domain}::${trendDayOffset}`);
  const rand = pseudoRand(seed);

  const templates = getMockKeywords(projectId);
  const trendBias = trendDayOffset === 0 ? 0 : Math.sign(rand() - 0.45);
  const keywords = templates.map((t) => generateKeyword(t, rand, trendBias));

  const visibilityScore = calcVisibility(keywords);
  const estimatedTraffic = calcEstimatedTraffic(keywords);
  const distribution = calcDistribution(keywords);

  const domainRank = Math.round(180 + rand() * 620);
  const spamScore = Math.round(2 + rand() * 14);
  const referringDomains = Math.round(120 + rand() * 880);

  const authority = calcVfAuthority({
    domainRank,
    etvMonthly: estimatedTraffic,
    spamScore,
    referringDomains,
  });

  const competitors = getMockCompetitors(projectId).map((d) =>
    generateCompetitor(d, rand, estimatedTraffic),
  );

  const prev = trendDayOffset === 0 ? null : null;

  return {
    id: `seo-${projectId}-${seed.toString(36)}`,
    projectId,
    domain,
    createdAt: new Date(Date.now() - trendDayOffset * 86_400_000),
    source,
    authority,
    estimatedTraffic,
    visibilityScore,
    prevVisibilityScore: prev,
    distribution,
    keywords,
    competitors,
  };
}

export function generateStubTrend(input: {
  projectId: string;
  domain: string;
  days?: number;
}): SeoTrendPoint[] {
  const days = input.days ?? 30;
  const points: SeoTrendPoint[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const snap = generateStubSnapshot({
      projectId: input.projectId,
      domain: input.domain,
      trendDayOffset: i,
    });
    points.push({
      date: snap.createdAt.toISOString().slice(0, 10),
      authority: snap.authority.score,
      visibility: snap.visibilityScore,
      estimatedTraffic: snap.estimatedTraffic,
    });
  }
  return points;
}

export function simulatedSeoFetchDelayMs(): number {
  return 900 + Math.floor(Math.random() * 600);
}
