export type KeywordIntent =
  | "informational"
  | "navigational"
  | "transactional"
  | "commercial";

export type SerpFeatureFlags = {
  aiOverview?: boolean;
  aiOverviewOwner?: boolean;
  featuredSnippet?: boolean;
  featuredSnippetOwner?: boolean;
  paa?: boolean;
  paaOwner?: boolean;
  knowledgePanel?: boolean;
  adsPack?: boolean;
};

export type TrackedKeyword = {
  id: string;
  keyword: string;
  searchVolume: number;
  intent: KeywordIntent;
  position: number;
  prevPosition: number | null;
  url: string | null;
  features: SerpFeatureFlags;
};

export type Competitor = {
  domain: string;
  label: string;
  estimatedTraffic: number;
  authorityScore: number;
};

export type PositionDistribution = {
  top3: number;
  top10: number;
  top20: number;
  top100: number;
  beyond: number;
};

export type AuthorityComponents = {
  linkPower: number;
  traffic: number;
  naturalProfile: number;
  domainRank: number;
  spamScore: number;
  referringDomains: number;
};

export type SeoSnapshot = {
  id: string;
  projectId: string;
  domain: string;
  createdAt: Date;
  source: "stub" | "dataforseo";
  authority: {
    score: number;
    components: AuthorityComponents;
  };
  estimatedTraffic: number;
  visibilityScore: number;
  prevVisibilityScore: number | null;
  distribution: PositionDistribution;
  keywords: TrackedKeyword[];
  competitors: Competitor[];
};

export type SeoTrendPoint = {
  date: string;
  authority: number;
  visibility: number;
  estimatedTraffic: number;
};
