"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { MetaSnapshot, MetaTrendPoint } from "@/lib/marketing/meta-types";
import {
  generateMetaStubSnapshot,
  generateMetaStubTrend,
  simulatedMetaFetchDelayMs,
} from "@/lib/marketing/meta-stub";

const MAX_SNAPSHOTS_PER_PROJECT = 30;

type MetaByProject = Record<string, MetaSnapshot[]>;
type TrendByProject = Record<string, MetaTrendPoint[]>;

type MetaStore = {
  byProject: MetaByProject;
  trendByProject: TrendByProject;

  latest: (projectId: string) => MetaSnapshot | undefined;
  trend: (projectId: string) => MetaTrendPoint[];

  add: (snapshot: MetaSnapshot) => void;
  setTrend: (projectId: string, trend: MetaTrendPoint[]) => void;
  clear: (projectId: string) => void;
};

export const useMetaStore = create<MetaStore>()(
  persist(
    (set, get) => ({
      byProject: {},
      trendByProject: {},

      latest: (projectId) => {
        const list = get().byProject[projectId];
        return list && list.length > 0 ? list[0] : undefined;
      },
      trend: (projectId) => get().trendByProject[projectId] ?? [],

      add: (snapshot) =>
        set((s) => {
          const prev = s.byProject[snapshot.projectId] ?? [];
          const next = [snapshot, ...prev].slice(0, MAX_SNAPSHOTS_PER_PROJECT);
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
      name: "rezen.meta",
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

export async function refreshMetaSnapshot(input: {
  projectId: string;
  domain: string;
}): Promise<MetaSnapshot> {
  await new Promise((r) => setTimeout(r, simulatedMetaFetchDelayMs()));
  const snap = generateMetaStubSnapshot(input);
  const trend = generateMetaStubTrend(input);
  const store = useMetaStore.getState();
  store.add(snap);
  store.setTrend(input.projectId, trend);
  return snap;
}

export function ensureMetaBootstrap(input: {
  projectId: string;
  domain: string;
}): void {
  const store = useMetaStore.getState();
  if (store.latest(input.projectId)) return;
  const snap = generateMetaStubSnapshot(input);
  const trend = generateMetaStubTrend(input);
  store.add(snap);
  store.setTrend(input.projectId, trend);
}
