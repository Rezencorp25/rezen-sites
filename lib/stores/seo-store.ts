"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { SeoSnapshot, SeoTrendPoint } from "@/lib/seo/seo-types";
import {
  generateStubSnapshot,
  generateStubTrend,
  simulatedSeoFetchDelayMs,
} from "@/lib/seo/seo-stub";

const MAX_SNAPSHOTS_PER_PROJECT = 30;

type SeoByProject = Record<string, SeoSnapshot[]>;
type TrendByProject = Record<string, SeoTrendPoint[]>;

type SeoStore = {
  byProject: SeoByProject;
  trendByProject: TrendByProject;

  latest: (projectId: string) => SeoSnapshot | undefined;
  history: (projectId: string) => SeoSnapshot[];
  trend: (projectId: string) => SeoTrendPoint[];

  add: (snapshot: SeoSnapshot) => void;
  setTrend: (projectId: string, trend: SeoTrendPoint[]) => void;
  clear: (projectId: string) => void;
};

export const useSeoStore = create<SeoStore>()(
  persist(
    (set, get) => ({
      byProject: {},
      trendByProject: {},

      latest: (projectId) => {
        const list = get().byProject[projectId];
        return list && list.length > 0 ? list[0] : undefined;
      },
      history: (projectId) => get().byProject[projectId] ?? [],
      trend: (projectId) => get().trendByProject[projectId] ?? [],

      add: (snapshot) =>
        set((s) => {
          const prev = s.byProject[snapshot.projectId] ?? [];
          const prevLatest = prev[0];
          const enriched: SeoSnapshot = {
            ...snapshot,
            prevVisibilityScore: prevLatest?.visibilityScore ?? null,
          };
          const next = [enriched, ...prev].slice(0, MAX_SNAPSHOTS_PER_PROJECT);
          return {
            byProject: { ...s.byProject, [snapshot.projectId]: next },
          };
        }),

      setTrend: (projectId, trend) =>
        set((s) => ({
          trendByProject: { ...s.trendByProject, [projectId]: trend },
        })),

      clear: (projectId) =>
        set((s) => {
          const { [projectId]: _omit, ...rest } = s.byProject;
          const { [projectId]: _omitTrend, ...restTrend } = s.trendByProject;
          return { byProject: rest, trendByProject: restTrend };
        }),
    }),
    {
      name: "rezen.seo",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        byProject: s.byProject,
        trendByProject: s.trendByProject,
      }),
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        for (const pid of Object.keys(state.byProject)) {
          state.byProject[pid] = state.byProject[pid].map((snap) => ({
            ...snap,
            createdAt: new Date(snap.createdAt),
          }));
        }
      },
    },
  ),
);

export async function refreshSeoSnapshot(input: {
  projectId: string;
  domain: string;
}): Promise<SeoSnapshot> {
  await new Promise((r) => setTimeout(r, simulatedSeoFetchDelayMs()));
  const snap = generateStubSnapshot(input);
  const trend = generateStubTrend(input);
  const store = useSeoStore.getState();
  store.add(snap);
  store.setTrend(input.projectId, trend);
  return snap;
}

/**
 * Inizializza lo store con un primo snapshot stub per il progetto se vuoto.
 * Usata dalle pagine SEO per evitare empty state al primo caricamento.
 */
export function ensureSeoBootstrap(input: {
  projectId: string;
  domain: string;
}): void {
  const store = useSeoStore.getState();
  if (store.latest(input.projectId)) return;
  const snap = generateStubSnapshot(input);
  const trend = generateStubTrend(input);
  store.add(snap);
  store.setTrend(input.projectId, trend);
}
