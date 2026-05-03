import type {
  KeywordIntent,
  SerpFeatureFlags,
  TrackedKeyword,
} from "./seo-types";

export type RankCluster = "top3" | "top10" | "top20" | "top100" | "beyond";

export type RankHistoryPoint = {
  date: string;
  position: number;
};

/**
 * Estensione di TrackedKeyword con storico posizione e delta calcolati.
 * Posizione 0 = "fuori ranking" (non in top 100).
 */
export type KeywordRank = {
  id: string;
  keyword: string;
  searchVolume: number;
  intent: KeywordIntent;
  position: number;
  position7dAgo: number | null;
  position30dAgo: number | null;
  url: string | null;
  features: SerpFeatureFlags;
  cluster: RankCluster;
  history: RankHistoryPoint[];
};

export type ShareOfVoiceEntry = {
  domain: string;
  label: string;
  etv: number;
  sharePct: number;
  isOwner: boolean;
};

export type SerpResultEntry = {
  position: number;
  domain: string;
  url: string;
  title: string;
  isOwner: boolean;
};

export type CompetitorRankEntry = {
  domain: string;
  label: string;
  position: number;
  url: string | null;
};

export type KeywordDrill = {
  keywordId: string;
  serpTop10: SerpResultEntry[];
  competitors: CompetitorRankEntry[];
  aiOverviewExcerpt: string | null;
  paaQuestions: string[];
};

export type ClusterCount = {
  cluster: RankCluster;
  label: string;
  count: number;
};

export type RankSnapshot = {
  id: string;
  projectId: string;
  domain: string;
  createdAt: Date;
  source: "stub" | "dataforseo";
  keywords: KeywordRank[];
  shareOfVoice: ShareOfVoiceEntry[];
  clusters: ClusterCount[];
};

export const CLUSTER_LABEL: Record<RankCluster, string> = {
  top3: "Top 3",
  top10: "Top 10",
  top20: "Top 20",
  top100: "Top 100",
  beyond: "Oltre 100",
};

export function clusterForPosition(pos: number): RankCluster {
  if (pos <= 0) return "beyond";
  if (pos <= 3) return "top3";
  if (pos <= 10) return "top10";
  if (pos <= 20) return "top20";
  if (pos <= 100) return "top100";
  return "beyond";
}

export type SerpFeatureFilter =
  | "all"
  | "aiOverview"
  | "featuredSnippet"
  | "paa"
  | "adsPack";

export type IntentFilter = "all" | KeywordIntent;

export type ClusterFilter = "all" | RankCluster;

export function isTrackedKeywordInCluster(
  kw: Pick<TrackedKeyword, "position">,
  cluster: ClusterFilter,
): boolean {
  if (cluster === "all") return true;
  return clusterForPosition(kw.position) === cluster;
}
