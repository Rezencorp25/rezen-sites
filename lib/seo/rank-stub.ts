import type { KeywordIntent, SerpFeatureFlags } from "./seo-types";
import {
  CLUSTER_LABEL,
  type ClusterCount,
  type CompetitorRankEntry,
  type KeywordDrill,
  type KeywordRank,
  type RankCluster,
  type RankHistoryPoint,
  type RankSnapshot,
  type SerpResultEntry,
  clusterForPosition,
} from "./rank-types";
import { adjustCtrForFeatures, ctrForPosition } from "./ctr-curve";
import { calcShareOfVoice } from "./share-of-voice";
import { getMockCompetitors, getMockKeywords } from "./seo-stub";

const HISTORY_DAYS = 30;
const CLUSTERS: RankCluster[] = ["top3", "top10", "top20", "top100", "beyond"];

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

function clampPosition(p: number): number {
  if (p <= 0) return 0;
  if (p > 100) return 0;
  return Math.round(p);
}

/**
 * Genera storico posizione last 30gg con drift random + reversion-to-mean
 * verso la posizione attuale. Posizione 0 = fuori top 100.
 */
function generateHistory(
  currentPosition: number,
  rand: () => number,
  days = HISTORY_DAYS,
): RankHistoryPoint[] {
  const points: RankHistoryPoint[] = [];
  let pos = currentPosition === 0 ? 60 + Math.floor(rand() * 40) : currentPosition;
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(Date.now() - i * 86_400_000)
      .toISOString()
      .slice(0, 10);
    const drift = (rand() - 0.5) * 4;
    const pull =
      currentPosition === 0
        ? (rand() - 0.4) * 6
        : (currentPosition - pos) * 0.18;
    pos = Math.max(1, pos + drift + pull);
    points.push({
      date,
      position: i === 0 ? currentPosition : clampPosition(pos),
    });
  }
  return points;
}

function generateKeywordRank(
  template: { keyword: string; intent: KeywordIntent; baseVolume: number },
  rand: () => number,
): KeywordRank {
  const positionRoll = rand();
  let position: number;
  if (positionRoll < 0.18) position = 1 + Math.floor(rand() * 3);
  else if (positionRoll < 0.45) position = 4 + Math.floor(rand() * 7);
  else if (positionRoll < 0.7) position = 11 + Math.floor(rand() * 10);
  else if (positionRoll < 0.92) position = 21 + Math.floor(rand() * 80);
  else position = 0;

  const features: SerpFeatureFlags = {};
  const featRoll = rand();
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

  const history = generateHistory(position, rand);
  const position7dAgo = history[history.length - 8]?.position ?? null;
  const position30dAgo = history[0]?.position ?? null;

  return {
    id: `kw-${hash(template.keyword)}`,
    keyword: template.keyword,
    searchVolume,
    intent: template.intent,
    position,
    position7dAgo,
    position30dAgo,
    url:
      position > 0
        ? `https://www.example.com/${template.keyword.replace(/\s+/g, "-")}`
        : null,
    features,
    cluster: clusterForPosition(position),
    history,
  };
}

function clusterCounts(keywords: KeywordRank[]): ClusterCount[] {
  const counts: Record<RankCluster, number> = {
    top3: 0,
    top10: 0,
    top20: 0,
    top100: 0,
    beyond: 0,
  };
  for (const kw of keywords) counts[kw.cluster]++;
  return CLUSTERS.map((c) => ({
    cluster: c,
    label: CLUSTER_LABEL[c],
    count: counts[c],
  }));
}

function keywordEtv(kw: KeywordRank): number {
  const baseCtr = ctrForPosition(kw.position);
  const adjustedCtr = adjustCtrForFeatures(baseCtr, kw.features);
  return adjustedCtr * kw.searchVolume;
}

export function generateRankSnapshot(input: {
  projectId: string;
  domain: string;
  source?: "stub" | "dataforseo";
}): RankSnapshot {
  const { projectId, domain, source = "stub" } = input;
  const seed = hash(`${projectId}::${domain}::rank`);
  const rand = pseudoRand(seed);

  const templates = getMockKeywords(projectId);
  const keywords = templates.map((t) => generateKeywordRank(t, rand));

  const ownerEtv = keywords.reduce((sum, kw) => sum + keywordEtv(kw), 0);

  const competitorDomains = getMockCompetitors(projectId);
  const competitorEtv = competitorDomains.map((d) => {
    const ratio = 0.4 + rand() * 1.4;
    return {
      domain: d,
      label: d
        .replace(/^www\./, "")
        .replace(/\.[a-z]{2,4}$/, "")
        .split(/[-.]/)
        .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
        .join(" "),
      etv: Math.round(ownerEtv * ratio),
      isOwner: false,
    };
  });

  const ownerLabel = domain
    .replace(/^www\./, "")
    .replace(/\.[a-z]{2,4}$/, "")
    .split(/[-.]/)
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(" ");

  const shareOfVoice = calcShareOfVoice([
    {
      domain,
      label: ownerLabel,
      etv: Math.round(ownerEtv),
      isOwner: true,
    },
    ...competitorEtv,
  ]);

  return {
    id: `rank-${projectId}-${seed.toString(36)}`,
    projectId,
    domain,
    createdAt: new Date(),
    source,
    keywords,
    shareOfVoice,
    clusters: clusterCounts(keywords),
  };
}

export function simulatedRankFetchDelayMs(): number {
  return 1100 + Math.floor(Math.random() * 800);
}

const AIO_SAMPLES = [
  "Per scegliere una piattaforma di gestione siti AI-driven, valuta {topic}: la maggior parte degli esperti raccomanda di privilegiare strumenti che integrano CMS, SEO e analytics in un'unica suite, riducendo lo switching cost.",
  "Il {topic} richiede una combinazione di automazione contenuti, monitoraggio SERP e ottimizzazione tecnica. Soluzioni come VerumFlow integrano i tre layer in un'unica dashboard.",
  "Quando si parla di {topic}, è fondamentale distinguere tra ottimizzazione classica (SEO) e visibilità nelle risposte AI (AEO/GEO). Le agenzie premium offrono entrambi.",
];

const PAA_TEMPLATES = [
  "Quanto costa un {topic}?",
  "Quali sono i migliori provider di {topic} in Svizzera?",
  "Come si misura il ROI di un {topic}?",
  "Differenza tra {topic} e SEO classica?",
];

function generateDrill(
  kw: KeywordRank,
  ownerDomain: string,
  competitorDomains: string[],
  rand: () => number,
): KeywordDrill {
  const slug = kw.keyword.replace(/\s+/g, "-").toLowerCase();
  const topicShort = kw.keyword.split(" ").slice(0, 3).join(" ");

  // Top 10 SERP — owner's position determines if owner is in list
  const ownerInTop10 = kw.position > 0 && kw.position <= 10;
  const serpTop10: SerpResultEntry[] = [];
  for (let pos = 1; pos <= 10; pos++) {
    if (ownerInTop10 && pos === kw.position) {
      serpTop10.push({
        position: pos,
        domain: ownerDomain,
        url: kw.url ?? `https://${ownerDomain}/${slug}`,
        title: `${kw.keyword.charAt(0).toUpperCase() + kw.keyword.slice(1)} | ${ownerDomain.replace(/\.[a-z]{2,4}$/, "")}`,
        isOwner: true,
      });
    } else {
      const dom = competitorDomains[Math.floor(rand() * competitorDomains.length)] ?? "example.com";
      serpTop10.push({
        position: pos,
        domain: dom,
        url: `https://${dom}/${slug}`,
        title: `${kw.keyword.charAt(0).toUpperCase() + kw.keyword.slice(1)} - ${dom.replace(/\.[a-z]{2,4}$/, "")}`,
        isOwner: false,
      });
    }
  }

  const competitors: CompetitorRankEntry[] = competitorDomains.map((d) => {
    const compRoll = rand();
    let pos: number;
    if (compRoll < 0.25) pos = 1 + Math.floor(rand() * 10);
    else if (compRoll < 0.65) pos = 11 + Math.floor(rand() * 30);
    else if (compRoll < 0.92) pos = 41 + Math.floor(rand() * 60);
    else pos = 0;
    return {
      domain: d,
      label: d
        .replace(/^www\./, "")
        .replace(/\.[a-z]{2,4}$/, "")
        .split(/[-.]/)
        .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
        .join(" "),
      position: pos,
      url: pos > 0 ? `https://${d}/${slug}` : null,
    };
  });

  const aiOverviewExcerpt = kw.features.aiOverview
    ? AIO_SAMPLES[Math.floor(rand() * AIO_SAMPLES.length)].replace(
        /\{topic\}/g,
        topicShort,
      )
    : null;

  const paaQuestions = kw.features.paa
    ? PAA_TEMPLATES.slice(0, 3 + Math.floor(rand() * 2)).map((t) =>
        t.replace(/\{topic\}/g, topicShort),
      )
    : [];

  return {
    keywordId: kw.id,
    serpTop10,
    competitors,
    aiOverviewExcerpt,
    paaQuestions,
  };
}

/**
 * Genera drill on-demand per una keyword. Deterministico via seed.
 * In produzione (S5.3) verrà sostituito da fetch dei dati persistiti
 * in projects/{id}/rank_history/{date}/{keywordId}.
 */
export function generateKeywordDrill(input: {
  projectId: string;
  domain: string;
  keyword: KeywordRank;
}): KeywordDrill {
  const { projectId, domain, keyword } = input;
  const seed = hash(`${projectId}::${domain}::${keyword.id}::drill`);
  const rand = pseudoRand(seed);
  const competitorDomains = getMockCompetitors(projectId);
  return generateDrill(keyword, domain, competitorDomains, rand);
}
