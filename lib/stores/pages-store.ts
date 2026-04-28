"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { VERUMFLOW_PAGES, CARFI_PAGES, BIO_PAGES } from "@/lib/mocks/pages";
import type { Page, PuckData } from "@/types";

const SEED: Page[] = [...VERUMFLOW_PAGES, ...CARFI_PAGES, ...BIO_PAGES];

type State = {
  pages: Page[];
};

type Actions = {
  getById: (pageId: string) => Page | undefined;
  forProject: (projectId: string) => Page[];
  savePuckData: (pageId: string, puckData: PuckData) => void;
  updatePage: (pageId: string, patch: Partial<Page>) => void;
  addPage: (page: Page) => void;
  removePage: (pageId: string) => void;
  /** Bulk: update many pages at once */
  bulkUpdate: (ids: string[], patch: Partial<Page>) => void;
  /** Bulk: update SEO sub-fields */
  bulkUpdateSEO: (ids: string[], seoPatch: Partial<Page["seo"]>) => void;
  bulkRemove: (ids: string[]) => void;
  resetSeed: () => void;
};

export const usePagesStore = create<State & Actions>()(
  persist(
    (set, get) => ({
      pages: SEED,
      getById: (pageId) => get().pages.find((p) => p.id === pageId),
      forProject: (projectId) => get().pages.filter((p) => p.projectId === projectId),
      savePuckData: (pageId, puckData) =>
        set((s) => ({
          pages: s.pages.map((p) =>
            p.id === pageId ? { ...p, puckData, updatedAt: new Date() } : p,
          ),
        })),
      updatePage: (pageId, patch) =>
        set((s) => ({
          pages: s.pages.map((p) =>
            p.id === pageId ? { ...p, ...patch, updatedAt: new Date() } : p,
          ),
        })),
      addPage: (page) => set((s) => ({ pages: [page, ...s.pages] })),
      removePage: (pageId) =>
        set((s) => ({ pages: s.pages.filter((p) => p.id !== pageId) })),
      bulkUpdate: (ids, patch) =>
        set((s) => {
          const idSet = new Set(ids);
          return {
            pages: s.pages.map((p) =>
              idSet.has(p.id) ? { ...p, ...patch, updatedAt: new Date() } : p,
            ),
          };
        }),
      bulkUpdateSEO: (ids, seoPatch) =>
        set((s) => {
          const idSet = new Set(ids);
          return {
            pages: s.pages.map((p) =>
              idSet.has(p.id)
                ? {
                    ...p,
                    seo: { ...p.seo, ...seoPatch },
                    updatedAt: new Date(),
                  }
                : p,
            ),
          };
        }),
      bulkRemove: (ids) =>
        set((s) => {
          const idSet = new Set(ids);
          return { pages: s.pages.filter((p) => !idSet.has(p.id)) };
        }),
      resetSeed: () => set({ pages: SEED }),
    }),
    {
      name: "rezen.pages",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ pages: s.pages }),
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        state.pages = state.pages.map((p) => ({
          ...p,
          createdAt: new Date(p.createdAt),
          updatedAt: new Date(p.updatedAt),
        }));
      },
    },
  ),
);
