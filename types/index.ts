import type { Data as PuckData } from "@measured/puck";

export type ProjectStatus = "draft" | "staging" | "production";

export type Project = {
  id: string;
  name: string;
  domain: string;
  stagingDomain: string;
  baseDomain: string;
  thumbnail: string;
  status: ProjectStatus;
  createdAt: Date;
  updatedAt: Date;
  kpis: {
    pagesPublished: number;
    organicTraffic30d: number;
    adsenseRevenue30d: number; // CHF
    seoScore: number; // 0-100
  };
  integrations: {
    googleAnalytics?: { measurementId: string; verified: boolean };
    metaPixel?: { pixelId: string; verified: boolean };
    googleAdsense?: { publisherId: string; verified: boolean };
    googleAds?: {
      conversionId: string;
      label: string;
      verified: boolean;
    };
  };
};

export type PageStatus = "draft" | "published";

export type PageSEO = {
  metaTitle: string;
  metaDescription: string;
  canonicalUrl: string;
  indexable: boolean;
  internalSearch: boolean;
  og: {
    title?: string;
    description?: string;
    image?: string;
  };
  /** E-E-A-T author + reviewer (boost AI/Google credibility) */
  author?: {
    name: string;
    url?: string;
    /** Optional bio for AI engines / featured snippets */
    description?: string;
  };
  reviewedBy?: {
    name: string;
    url?: string;
  };
  /** Override Article schema content type */
  schemaType?: "Article" | "NewsArticle" | "BlogPosting";
  /** Entity references mentioned in the page (Person, Organization, Place,
   *  Event, Product). Output as nested @id-linked schema for AI engines. */
  entities?: Array<{
    type: "Person" | "Organization" | "Place" | "Event" | "Product";
    name: string;
    /** Wikipedia / company / LinkedIn URL */
    url?: string;
    /** Wikidata Q-id for entity disambiguation (e.g. Q42) */
    sameAs?: string;
  }>;
  schema?: Record<string, unknown>;
};

export type PageAnalytics = {
  pageviews7d: number;
  pageviews30d: number;
  bounceRate: number; // 0-1
  avgPosition: number;
  topKeyword: string;
  seoScore: number; // 0-100
};

export type Page = {
  id: string;
  projectId: string;
  title: string;
  slug: string;
  status: PageStatus;
  puckData: PuckData;
  seo: PageSEO;
  analytics: PageAnalytics;
  createdAt: Date;
  updatedAt: Date;
};

export type CMSFieldType =
  | "text"
  | "richtext"
  | "image"
  | "date"
  | "number"
  | "boolean"
  | "reference";

export type CMSField = {
  id: string;
  name: string;
  type: CMSFieldType;
  required: boolean;
  referenceCollectionId?: string;
};

export type CMSCollection = {
  id: string;
  projectId: string;
  name: string;
  slug: string;
  fields: CMSField[];
  createdAt: Date;
};

export type CMSItem = {
  id: string;
  collectionId: string;
  projectId: string;
  data: Record<string, unknown>;
  status: PageStatus;
  createdAt: Date;
  updatedAt: Date;
};

export type FormSubmission = {
  id: string;
  projectId: string;
  formName: string;
  fields: Record<string, string>;
  page: string;
  utm?: {
    source?: string;
    medium?: string;
    campaign?: string;
  };
  gclid?: string;
  createdAt: Date;
};

export type Redirect = {
  id: string;
  projectId: string;
  oldPath: string;
  newPath: string;
  type: 301 | 302;
  active: boolean;
  createdAt: Date;
};

export type VersionStatus = "READY" | "BUILDING" | "FAILED" | "LIVE";

export type Version = {
  id: string;
  projectId: string;
  versionTag: string;
  status: VersionStatus;
  publishedBy: string;
  publishedAt: Date;
  changes: string[];
  description?: string;
};

export type AlertSeverity = "critical" | "warning" | "info" | "ok";

export type Alert = {
  id: string;
  projectId: string;
  severity: AlertSeverity;
  title: string;
  description: string;
  page?: string;
  createdAt: Date;
  acknowledged: boolean;
};

export type AdSenseRevenue = {
  id: string;
  projectId: string;
  date: Date;
  pageUrl?: string;
  revenue: number;
  impressions: number;
  ctr: number;
  rpm: number;
};

export type GoogleAdsPerformance = {
  id: string;
  projectId: string;
  date: Date;
  campaign: string;
  spend: number;
  clicks: number;
  impressions: number;
  cpc: number;
  conversions: number;
  roas: number;
  landingPage?: string;
};

export type AIEdit =
  | {
      type: "insert";
      afterId: string | null;
      components: unknown[];
    }
  | { type: "replace"; targetId: string; component: unknown }
  | { type: "modify"; targetId: string; newProps: Record<string, unknown> }
  | { type: "delete"; targetId: string }
  | { type: "full_replace"; root: PuckData };

export type { PuckData };
