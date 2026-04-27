"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

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
  };
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set, getState) => ({
      byProject: {},
      get: (projectId) => {
        const existing = getState().byProject[projectId];
        if (existing) return existing;
        const fresh = defaultsFor(projectId);
        set((state) => ({
          byProject: { ...state.byProject, [projectId]: fresh },
        }));
        return fresh;
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
