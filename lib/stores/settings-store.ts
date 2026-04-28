"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { NOW_ANCHOR } from "@/lib/mocks/now-anchor";

export type LocalReview = {
  /** 1-5 */
  rating: number;
  author: string;
  /** ISO date YYYY-MM-DD */
  date: string;
  text: string;
};

export type LocalBusinessLocation = {
  id: string;
  name: string;
  streetAddress: string;
  postalCode: string;
  addressLocality: string;
  addressRegion: string;
  addressCountry: string;
  telephone: string;
  geoLat?: number;
  geoLng?: number;
  openingHours: string[];
};

export type LocalBusinessSettings = {
  enabled: boolean;
  /** legalName fallback to project.name when empty */
  legalName: string;
  telephone: string;
  email: string;
  streetAddress: string;
  postalCode: string;
  addressLocality: string;
  addressRegion: string;
  addressCountry: string;
  geoLat?: number;
  geoLng?: number;
  /** OpenStreetMap-style hours, e.g. ["Mo-Fr 09:00-18:00"] */
  openingHours: string[];
  priceRange: string;
  serviceArea: string[];
  /** Social profile URLs */
  sameAs: string[];
  /** Customer reviews — render as Review/AggregateRating schema */
  reviews: LocalReview[];
  /** Multi-location support — additional sedes/branches.
   *  Each generates its own LocalBusiness schema in export. */
  additionalLocations: LocalBusinessLocation[];
};

export type LocaleAlternate = {
  /** ISO 639-1 + optional region: it, en-US, de-CH */
  hreflang: string;
  /** Absolute URL of the localised page (or root) */
  href: string;
};

export type ProjectSettings = {
  general: {
    siteTitle: string;
    siteUrl: string;
    description: string;
    indexable: boolean;
    canonical: boolean;
    socialImage?: string;
    /** Default page language (BCP 47 short) */
    defaultLocale: string;
    /** Project-wide alternate locales mapped to roots/subdomains */
    alternates: LocaleAlternate[];
  };
  domain: {
    customDomain: string;
    sslActive: boolean;
    canonicalDomain: "apex" | "www";
    /** Cert details (mock today, real Let's Encrypt at go-live) */
    ssl: {
      issuer: "letsencrypt" | "manual" | "cloudflare";
      issuedAt?: string; // ISO date
      expiresAt?: string; // ISO date
      autoRenew: boolean;
      alertDaysBeforeExpiry: number;
    };
    /** Email deliverability records */
    emailAuth: {
      spf: string;
      dkim: string;
      dmarc: string;
      mxProvider: "google" | "microsoft365" | "fastmail" | "infomaniak" | "custom" | "none";
    };
    /** CDN + cache configuration */
    cdn: {
      provider: "none" | "cloudflare" | "fastly" | "vercel" | "bunnynet";
      compression: "gzip" | "brotli" | "both";
      browserCacheSeconds: number;
      edgeCacheSeconds: number;
      /** Bypass cache for these path patterns (regex-friendly) */
      bypassPaths: string[];
    };
  };
  staging: {
    stagingEnabled: boolean;
    stagingDomain: string;
    /** Optional password protection for staging URL */
    passwordProtected: boolean;
    stagingPassword: string;
    /** Promote-to-prod flow */
    promoteRequiresApproval: boolean;
  };
  tracking: {
    ga4: { id: string; verified: boolean };
    metaPixel: { id: string; verified: boolean };
    adsense: { id: string; verified: boolean };
    googleAds: { id: string; verified: boolean };
    headerCode: string;
    footerCode: string;
  };
  robots: {
    allowAll: boolean;
    disallow: string[];
    crawlDelay: number;
    includeSitemap: boolean;
  };
  localBusiness: LocalBusinessSettings;
  consent: {
    enabled: boolean;
    /** Cookie banner language; uses general.defaultLocale if empty */
    locale: string;
    /** Privacy policy URL (full or relative) */
    privacyPolicyUrl: string;
    /** Cookie policy URL */
    cookiePolicyUrl: string;
    /** Vendor categories to gate behind consent */
    vendors: {
      analytics: boolean;
      ads: boolean;
      marketing: boolean;
      social: boolean;
    };
    /** Regional regimes to comply with */
    regions: {
      gdpr: boolean; // EU 27 + UK + CH
      ccpa: boolean; // California "Do Not Sell My Personal Information"
      lgpd: boolean; // Brasil
      pipeda: boolean; // Canada
    };
  };
  privacy: {
    /** Data residency for form submissions and analytics */
    dataResidency: "eu" | "us" | "ch" | "auto";
    /** PII field name hints — fields matching these are encrypted/masked */
    piiFieldHints: string[];
    /** Hash strategy for analytics enhanced conversions */
    hashStrategy: "sha256" | "none";
    /** DSAR (Data Subject Access Request) contact email */
    dsarEmail: string;
    /** Default retention days for form submissions */
    retentionDays: number;
  };
  uptime: {
    enabled: boolean;
    /** URL to ping (defaults to canonical site URL) */
    monitorUrl: string;
    /** Minutes between checks */
    checkInterval: number;
    /** Where to send incident alerts */
    alertChannel: "email" | "slack" | "sms" | "none";
    alertEmail: string;
    /** Mock incident log (real provider at go-live) */
    lastIncidentAt?: string;
    /** 0-100 uptime % over 30d (mock today) */
    uptime30d: number;
  };
};

type SettingsStore = {
  byProject: Record<string, ProjectSettings>;
  get: (projectId: string) => ProjectSettings;
  update: (projectId: string, patch: Partial<ProjectSettings>) => void;
  updateSection: <K extends keyof ProjectSettings>(
    projectId: string,
    section: K,
    patch: Partial<ProjectSettings[K]>,
  ) => void;
};

function defaultsFor(projectId: string): ProjectSettings {
  return {
    general: {
      siteTitle: "",
      siteUrl: "",
      description: "",
      indexable: true,
      canonical: true,
      defaultLocale: "it",
      alternates: [],
    },
    domain: {
      customDomain: "",
      sslActive: true,
      canonicalDomain: "apex",
      ssl: {
        issuer: "letsencrypt",
        // MOCK: 60 days from anchor to demo expiry alerts
        issuedAt: new Date(NOW_ANCHOR - 30 * 86400000).toISOString(),
        expiresAt: new Date(NOW_ANCHOR + 60 * 86400000).toISOString(),
        autoRenew: true,
        alertDaysBeforeExpiry: 30,
      },
      emailAuth: {
        spf: "",
        dkim: "",
        dmarc: "v=DMARC1; p=none; rua=mailto:dmarc@example.ch",
        mxProvider: "none",
      },
      cdn: {
        provider: "none",
        compression: "brotli",
        browserCacheSeconds: 3600,
        edgeCacheSeconds: 86400,
        bypassPaths: ["/api", "/admin"],
      },
    },
    staging: {
      // Generalised: any project can opt-in to staging
      stagingEnabled: projectId === "verumflow-ch",
      stagingDomain: `staging-${projectId}.rezen.sites`,
      passwordProtected: false,
      stagingPassword: "",
      promoteRequiresApproval: false,
    },
    tracking: {
      ga4: { id: "", verified: false },
      metaPixel: { id: "", verified: false },
      adsense: { id: "", verified: false },
      googleAds: { id: "", verified: false },
      headerCode: "",
      footerCode: "",
    },
    robots: {
      allowAll: true,
      disallow: ["/admin", "/api", "/_next"],
      crawlDelay: 0,
      includeSitemap: true,
    },
    localBusiness: {
      enabled: false,
      legalName: "",
      telephone: "",
      email: "",
      streetAddress: "",
      postalCode: "",
      addressLocality: "",
      addressRegion: "",
      addressCountry: "CH",
      openingHours: [],
      priceRange: "",
      serviceArea: [],
      sameAs: [],
      reviews: [],
      additionalLocations: [],
    },
    consent: {
      enabled: false,
      locale: "",
      privacyPolicyUrl: "/privacy",
      cookiePolicyUrl: "/cookies",
      vendors: {
        analytics: true,
        ads: true,
        marketing: true,
        social: false,
      },
      regions: {
        gdpr: true,
        ccpa: false,
        lgpd: false,
        pipeda: false,
      },
    },
    privacy: {
      dataResidency: "eu",
      piiFieldHints: ["email", "phone", "tel", "ssn", "iban", "credit"],
      hashStrategy: "sha256",
      dsarEmail: "",
      retentionDays: 365,
    },
    uptime: {
      enabled: false,
      monitorUrl: "",
      checkInterval: 5,
      alertChannel: "email",
      alertEmail: "",
      // MOCK: realistic uptime for demo
      uptime30d: 99.97,
    },
  };
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set, getState) => ({
      byProject: {},
      get: (projectId) => {
        const existing = getState().byProject[projectId];
        const fresh = defaultsFor(projectId);
        // Detect if backfill needed (missing sections from previous shape).
        const needsBackfill =
          !existing ||
          !existing.consent ||
          !existing.consent.regions ||
          !existing.privacy ||
          !existing.uptime ||
          !existing.robots ||
          !existing.localBusiness ||
          !existing.domain?.ssl ||
          !existing.domain?.emailAuth ||
          !existing.domain?.cdn ||
          !existing.staging?.stagingDomain;
        if (!needsBackfill) {
          // Stable reference — Zustand selectors stay equal, no re-render loop.
          return existing as ProjectSettings;
        }
        // Forward-compat merge: inject missing sections, persist once.
        const merged: ProjectSettings = {
          ...fresh,
          ...(existing ?? {}),
          general: { ...fresh.general, ...(existing?.general ?? {}) },
          domain: {
            ...fresh.domain,
            ...(existing?.domain ?? {}),
            ssl: { ...fresh.domain.ssl, ...(existing?.domain?.ssl ?? {}) },
            emailAuth: {
              ...fresh.domain.emailAuth,
              ...(existing?.domain?.emailAuth ?? {}),
            },
            cdn: { ...fresh.domain.cdn, ...(existing?.domain?.cdn ?? {}) },
          },
          staging: { ...fresh.staging, ...(existing?.staging ?? {}) },
          tracking: { ...fresh.tracking, ...(existing?.tracking ?? {}) },
          robots: { ...fresh.robots, ...(existing?.robots ?? {}) },
          localBusiness: {
            ...fresh.localBusiness,
            ...(existing?.localBusiness ?? {}),
          },
          consent: {
            ...fresh.consent,
            ...(existing?.consent ?? {}),
            regions: {
              ...fresh.consent.regions,
              ...(existing?.consent?.regions ?? {}),
            },
          },
          privacy: { ...fresh.privacy, ...(existing?.privacy ?? {}) },
          uptime: { ...fresh.uptime, ...(existing?.uptime ?? {}) },
        };
        // Persist so next call returns stable reference.
        set((state) => ({
          byProject: { ...state.byProject, [projectId]: merged },
        }));
        return merged;
      },
      update: (projectId, patch) =>
        set((state) => ({
          byProject: {
            ...state.byProject,
            [projectId]: {
              ...(state.byProject[projectId] ?? defaultsFor(projectId)),
              ...patch,
            },
          },
        })),
      updateSection: (projectId, section, patch) =>
        set((state) => {
          const current =
            state.byProject[projectId] ?? defaultsFor(projectId);
          return {
            byProject: {
              ...state.byProject,
              [projectId]: {
                ...current,
                [section]: { ...current[section], ...patch },
              },
            },
          };
        }),
    }),
    {
      name: "rezen-settings-store",
      storage: createJSONStorage(() => localStorage),
      version: 7,
      migrate: (persisted: unknown, fromVersion: number) => {
        // Cumulative migrations across batches R1-R7. Forward-compat merge
        // in get() handles most shape drift, but if the cache is older than
        // R5 (added consent + uptime + ssl + emailAuth + many sub-fields)
        // start fresh to avoid type mismatches.
        if (fromVersion < 5) return { byProject: {} };
        return persisted as { byProject: Record<string, ProjectSettings> };
      },
    },
  ),
);
