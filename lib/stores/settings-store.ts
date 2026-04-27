"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

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
};

export type ProjectSettings = {
  general: {
    siteTitle: string;
    siteUrl: string;
    description: string;
    indexable: boolean;
    canonical: boolean;
    socialImage?: string;
  };
  domain: {
    customDomain: string;
    sslActive: boolean;
    canonicalDomain: "apex" | "www";
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
    },
    domain: {
      customDomain: "",
      sslActive: true,
      canonicalDomain: "apex",
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
          domain: { ...fresh.domain, ...existing.domain },
          staging: { ...fresh.staging, ...existing.staging },
          tracking: { ...fresh.tracking, ...existing.tracking },
          robots: { ...fresh.robots, ...(existing.robots ?? {}) },
          localBusiness: {
            ...fresh.localBusiness,
            ...(existing.localBusiness ?? {}),
          },
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
