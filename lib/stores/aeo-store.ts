"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { AeoSnapshot, AeoTrendPoint } from "@/lib/seo/aeo-types";
import {
  generateAeoStubSnapshot,
  generateAeoStubTrend,
  simulatedAeoFetchDelayMs,
} from "@/lib/seo/aeo-stub";

const MAX_SNAPSHOTS_PER_PROJECT = 30;

type AeoByProject = Record<string, AeoSnapshot[]>;
type TrendByProject = Record<string, AeoTrendPoint[]>;

type AeoStore = {
  byProject: AeoByProject;
  trendByProject: TrendByProject;

  latest: (projectId: string) => AeoSnapshot | undefined;
  history: (projectId: string) => AeoSnapshot[];
  trend: (projectId: string) => AeoTrendPoint[];

  add: (snapshot: AeoSnapshot) => void;
  setTrend: (projectId: string, trend: AeoTrendPoint[]) => void;
  clear: (projectId: string) => void;
};

export const useAeoStore = create<AeoStore>()(
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
          const enriched: AeoSnapshot = {
            ...snapshot,
            prevAeoScore: prevLatest?.aeoScore ?? null,
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
      name: "rezen.aeo",
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

export async function refreshAeoSnapshot(input: {
  projectId: string;
  domain: string;
}): Promise<AeoSnapshot> {
  await new Promise((r) => setTimeout(r, simulatedAeoFetchDelayMs()));
  const snap = generateAeoStubSnapshot(input);
  const trend = generateAeoStubTrend(input);
  const store = useAeoStore.getState();
  store.add(snap);
  store.setTrend(input.projectId, trend);
  return snap;
}

export function ensureAeoBootstrap(input: {
  projectId: string;
  domain: string;
}): void {
  const store = useAeoStore.getState();
  if (store.latest(input.projectId)) return;
  const snap = generateAeoStubSnapshot(input);
  const trend = generateAeoStubTrend(input);
  store.add(snap);
  store.setTrend(input.projectId, trend);
}
