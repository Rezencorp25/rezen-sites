"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { GeoSnapshot, GeoTrendPoint } from "@/lib/seo/geo-types";
import {
  generateGeoStubSnapshot,
  generateGeoStubTrend,
  simulatedGeoFetchDelayMs,
} from "@/lib/seo/geo-stub";

const MAX_SNAPSHOTS_PER_PROJECT = 30;

type GeoByProject = Record<string, GeoSnapshot[]>;
type TrendByProject = Record<string, GeoTrendPoint[]>;

type GeoStore = {
  byProject: GeoByProject;
  trendByProject: TrendByProject;

  latest: (projectId: string) => GeoSnapshot | undefined;
  history: (projectId: string) => GeoSnapshot[];
  trend: (projectId: string) => GeoTrendPoint[];

  add: (snapshot: GeoSnapshot) => void;
  setTrend: (projectId: string, trend: GeoTrendPoint[]) => void;
  clear: (projectId: string) => void;
};

export const useGeoStore = create<GeoStore>()(
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
          const enriched: GeoSnapshot = {
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
      name: "rezen.geo",
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

export async function refreshGeoSnapshot(input: {
  projectId: string;
  domain: string;
}): Promise<GeoSnapshot> {
  await new Promise((r) => setTimeout(r, simulatedGeoFetchDelayMs()));
  const snap = generateGeoStubSnapshot(input);
  const trend = generateGeoStubTrend(input);
  const store = useGeoStore.getState();
  store.add(snap);
  store.setTrend(input.projectId, trend);
  return snap;
}

export function ensureGeoBootstrap(input: {
  projectId: string;
  domain: string;
}): void {
  const store = useGeoStore.getState();
  if (store.latest(input.projectId)) return;
  const snap = generateGeoStubSnapshot(input);
  const trend = generateGeoStubTrend(input);
  store.add(snap);
  store.setTrend(input.projectId, trend);
}
