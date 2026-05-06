"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import {
  type OnboardingState,
  type OnboardingStep,
  type OnboardingKeyword,
  type OnboardingCompetitor,
  type OnboardingSiteBasics,
  validateStep,
} from "@/lib/onboarding/types";

/**
 * Onboarding wizard store (S6d). Persiste in localStorage per progetto:
 *  - draft state mentre l'utente compila il wizard (resilient a refresh)
 *  - flag completedAt per banner UI in /seo /aeo /geo
 *
 * In produzione (S6d.2 backend) dovrà sincronizzare su Firestore
 * `projects/{id}/onboarding/state` e `projects/{id}/seo_keywords/*` +
 * `projects/{id}/competitors/*`. Per ora lo store mantiene tutto client-side.
 */

type OnboardingByProject = Record<string, OnboardingState>;

type OnboardingStore = {
  byProject: OnboardingByProject;

  get: (projectId: string) => OnboardingState | null;
  isComplete: (projectId: string) => boolean;

  /** Crea draft vuoto se non esiste. Usato dal route /onboarding al mount. */
  ensureDraft: (input: {
    projectId: string;
    domain: string;
    brandHint?: string;
  }) => void;

  setSiteBasics: (projectId: string, basics: OnboardingSiteBasics) => void;
  setKeywords: (projectId: string, keywords: OnboardingKeyword[]) => void;
  setCompetitors: (projectId: string, competitors: OnboardingCompetitor[]) => void;

  setStep: (projectId: string, step: OnboardingStep) => void;
  /** Step 4 conferma → setta completedAt. Idempotente. */
  activate: (projectId: string) => void;
  reset: (projectId: string) => void;
};

const EMPTY_STATE = (
  domain: string,
  brandHint?: string,
): OnboardingState => ({
  step: 1,
  completedAt: null,
  siteBasics: {
    domain,
    countryCode: "CH",
    languageCode: "it",
    brandName: brandHint ?? deriveBrandFromDomain(domain),
  },
  keywords: [],
  competitors: [],
});

export const useOnboardingStore = create<OnboardingStore>()(
  persist(
    (set, get) => ({
      byProject: {},

      get: (projectId) => get().byProject[projectId] ?? null,
      isComplete: (projectId) => {
        const s = get().byProject[projectId];
        return !!s && s.step >= 4 && s.completedAt !== null;
      },

      ensureDraft: ({ projectId, domain, brandHint }) =>
        set((s) => {
          if (s.byProject[projectId]) return s;
          return {
            byProject: {
              ...s.byProject,
              [projectId]: EMPTY_STATE(domain, brandHint),
            },
          };
        }),

      setSiteBasics: (projectId, basics) =>
        set((s) => {
          const cur = s.byProject[projectId] ?? EMPTY_STATE(basics.domain);
          return {
            byProject: {
              ...s.byProject,
              [projectId]: { ...cur, siteBasics: basics },
            },
          };
        }),

      setKeywords: (projectId, keywords) =>
        set((s) => {
          const cur = s.byProject[projectId] ?? EMPTY_STATE("");
          return {
            byProject: {
              ...s.byProject,
              [projectId]: { ...cur, keywords },
            },
          };
        }),

      setCompetitors: (projectId, competitors) =>
        set((s) => {
          const cur = s.byProject[projectId] ?? EMPTY_STATE("");
          return {
            byProject: {
              ...s.byProject,
              [projectId]: { ...cur, competitors },
            },
          };
        }),

      setStep: (projectId, step) =>
        set((s) => {
          const cur = s.byProject[projectId];
          if (!cur) return s;
          return {
            byProject: { ...s.byProject, [projectId]: { ...cur, step } },
          };
        }),

      activate: (projectId) =>
        set((s) => {
          const cur = s.byProject[projectId];
          if (!cur) return s;
          // Hard validation prima di attivare. Se fallisce, no-op (UI lo blocca prima).
          if (validateStep(4, cur)) return s;
          return {
            byProject: {
              ...s.byProject,
              [projectId]: {
                ...cur,
                step: 4,
                completedAt: cur.completedAt ?? new Date(),
              },
            },
          };
        }),

      reset: (projectId) =>
        set((s) => {
          const { [projectId]: _omit, ...rest } = s.byProject;
          return { byProject: rest };
        }),
    }),
    {
      name: "rezen.onboarding",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ byProject: s.byProject }),
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        for (const pid of Object.keys(state.byProject)) {
          const s = state.byProject[pid];
          if (s.completedAt) s.completedAt = new Date(s.completedAt);
        }
      },
    },
  ),
);

function deriveBrandFromDomain(domain: string): string {
  if (!domain) return "";
  const stripped = domain.replace(/^www\./, "").split(".")[0];
  return stripped.charAt(0).toUpperCase() + stripped.slice(1);
}

/** Helper: id univoco per nuove keyword/competitor in lista. */
export function generateOnboardingId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}
