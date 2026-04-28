"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type LocalReview = {
  /** 1-5 */
  rating: number;
  author: string;
  /** ISO date YYYY-MM-DD */
  date: string;
  text: string;
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
  };
  staging: {
    stagingEnabled: boolean;
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
        // MOCK: 60 days from now to demo expiry alerts
        issuedAt: new Date(Date.now() - 30 * 86400000).toISOString(),
        expiresAt: new Date(Date.now() + 60 * 86400000).toISOString(),
        autoRenew: true,
        alertDaysBeforeExpiry: 30,
      },
    },
    staging: {
      stagingEnabled: projectId === "verumflow-ch",
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
        if (!existing) {
          set((state) => ({
            byProject: { ...state.byProject, [projectId]: fresh },
          }));
          return fresh;
        }
        // Forward-compat merge: inject any new sections (robots, localBusiness)
        // that may be missing from settings persisted by previous versions.
        const merged: ProjectSettings = {
          ...fresh,
          ...existing,
          general: { ...fresh.general, ...existing.general },
          domain: {
            ...fresh.domain,
            ...existing.domain,
            ssl: { ...fresh.domain.ssl, ...(existing.domain?.ssl ?? {}) },
          },
          staging: { ...fresh.staging, ...existing.staging },
          tracking: { ...fresh.tracking, ...existing.tracking },
          robots: { ...fresh.robots, ...(existing.robots ?? {}) },
          localBusiness: {
            ...fresh.localBusiness,
            ...(existing.localBusiness ?? {}),
          },
          consent: { ...fresh.consent, ...(existing.consent ?? {}) },
        };
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
    },
  ),
);
