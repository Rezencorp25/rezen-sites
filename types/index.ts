import type { Data as PuckData } from "@measured/puck";
import type { IntegrationProviderId } from "@/lib/integrations/providers";

export type ProjectStatus = "draft" | "staging" | "production";

/**
 * S13 — Self-Service Integrations metadata.
 *
 * Mai contiene il valore della chiave (quello sta in Secret Manager).
 * Solo metadata sicuri da esporre via Firestore: stato + last4 + audit.
 */
export type IntegrationStatus = "active" | "revoked" | "error";

export type IntegrationMetadata = {
  /** Provider configurato. */
  provider: IntegrationProviderId;
  /** Ultimi 4 caratteri della chiave/token primario (UI display only). */
  last4: string;
  /** Stato corrente. */
  status: IntegrationStatus;
  /** Quando il test connection è andato a buon fine l'ultima volta. */
  verifiedAt: Date | null;
  /** Ultimo errore test connection (se status=error). */
  lastError?: string;
  /** Timestamp ultimo update metadata. */
  updatedAt: Date;
  /** UID utente che ha fatto l'ultimo set/test (audit). */
  configuredBy: string;
};

/**
 * Per-project override flag. Se useOverride=true, le CF leggono Secret
 * `proj-{projectId}-{provider}`; altrimenti `ws-{workspaceId}-{provider}`.
 */
export type ProjectIntegrationOverride = {
  useOverride: boolean;
  /** Metadata override valido solo se useOverride=true. */
  metadata?: IntegrationMetadata;
};

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
    /** Pre-S13 legacy (Pixel/measurement IDs front-end embed only). */
    googleAnalytics?: { measurementId: string; verified: boolean };
    metaPixel?: { pixelId: string; verified: boolean };
    googleAdsense?: { publisherId: string; verified: boolean };
    googleAds?: {
      conversionId: string;
      label: string;
      verified: boolean;
    };
    metaAds?: {
      businessAccountId: string;
      adAccountId: string;
      accessTokenLast4: string;
      verified: boolean;
    };
    /**
     * S13 — Self-Service Integrations override per-project.
     * Default: ereditate da workspace. Se override=true → CF usa secret
     * `proj-{projectId}-{providerId}` invece di `ws-{wsId}-{providerId}`.
     */
    apiOverrides?: Partial<
      Record<IntegrationProviderId, ProjectIntegrationOverride>
    >;
  };
  /**
   * S13 — Workspace di appartenenza. Default "default" (singleton oggi).
   * Multi-workspace future: ogni progetto avrà workspaceId reale.
   */
  workspaceId?: string;
  /**
   * S8: branding white-label per Reports PDF mensili. Hardcoded da settings.
   * Se omesso, fallback ai colori REZEN default.
   */
  branding?: {
    logoUrl: string;
    primaryColor: string;
  };
  /**
   * S7.13 — Source of truth GitHub repo per il sito. Quando present, le
   * edits inline producono commit nel repo (branch `main`) e il preview
   * dell'editor legge file da lì invece che da /public/imports/.
   * Pubblica = merge main→production + Firebase App Hosting rollout.
   */
  githubRepo?: {
    /** Org GitHub che possiede il repo (es. "Rezencorp26"). */
    owner: string;
    /** Nome repo, convenzione `site-{projectId}`. */
    name: string;
    /** Branch workspace (live editing). */
    branch: string;
    /** Branch published (deploy production). */
    productionBranch: string;
    /** SHA dell'ultimo commit conosciuto su branch workspace. */
    lastSha?: string;
    /** ISO timestamp dell'init del repo. */
    initializedAt?: string;
  };
};

/**
 * S13 — Workspace integrations doc Firestore.
 * Path: `workspaces/{workspaceId}/integrations/{providerId}`
 *
 * Contiene SOLO metadata. Il valore reale del secret sta in Secret Manager
 * con resource name `ws-{workspaceId}-{providerId}`.
 */
export type WorkspaceIntegration = IntegrationMetadata;

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
  /**
   * S7.7 — CMS binding: pesca il valore da un fieldId della collection
   * dell'item corrente. Se settato, sovrascrive il valore statico.
   */
  bindings?: {
    metaTitle?: string;
    metaDescription?: string;
    ogImage?: string;
    canonical?: string;
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
  /**
   * Se settato, questa Page è il template Webflow-style "Collection Page":
   * viene renderizzata 1 volta per item della collection target.
   * URL pattern dinamico: `/{collection.slug}/{item.slug}`.
   */
  templateForCollectionId?: string;
  createdAt: Date;
  updatedAt: Date;
};

export type {
  CMSFieldType,
  CMSField,
  CMSCollection,
  CMSCollectionLimits,
  CMSItem,
  CMSItemStatus,
  CMSItemFieldData,
  CMSItemVersion,
  CMSValidationRule,
  CMSOptionChoice,
} from "./cms";
export {
  BAKED_IN_FIELDS,
  DEFAULT_COLLECTION_LIMITS,
  isReferenceField,
} from "./cms";

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

/**
 * S12: identificativo handler auto-fix. Mappato in lib/alerts/auto-fixers.ts.
 * Quando alert.fixAction === "auto", il sistema può applicare una correzione
 * client-side (modifica store) senza intervento umano.
 */
export type AlertAutoFixId =
  | "set-meta-title-from-page-title"
  | "generate-meta-description-fallback"
  | "set-default-og-image"
  | "enable-consent-banner";

export type Alert = {
  id: string;
  projectId: string;
  severity: AlertSeverity;
  title: string;
  description: string;
  page?: string;
  createdAt: Date;
  acknowledged: boolean;
  /** S12: kind of fix supported. "auto" = sistema può risolverlo. "manual" = serve intervento umano. */
  fixAction: "auto" | "manual";
  /** S12: handler id quando fixAction === "auto". */
  fixActionId?: AlertAutoFixId;
  /** S12: pageId target per fix che modificano una specifica Page. */
  fixPageId?: string;
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
