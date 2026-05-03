"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { RankSnapshot } from "@/lib/seo/rank-types";
import {
  generateRankSnapshot,
  simulatedRankFetchDelayMs,
} from "@/lib/seo/rank-stub";

const MAX_SNAPSHOTS_PER_PROJECT = 30;

type RankByProject = Record<string, RankSnapshot[]>;

type RankStore = {
  byProject: RankByProject;

  latest: (projectId: string) => RankSnapshot | undefined;
  history: (projectId: string) => RankSnapshot[];

  add: (snapshot: RankSnapshot) => void;
  clear: (projectId: string) => void;
};

export const useRankStore = create<RankStore>()(
  persist(
    (set, get) => ({
      byProject: {},

      latest: (projectId) => {
        const list = get().byProject[projectId];
        return list && list.length > 0 ? list[0] : undefined;
      },
      history: (projectId) => get().byProject[projectId] ?? [],

      add: (snapshot) =>
        set((s) => {
          const prev = s.byProject[snapshot.projectId] ?? [];
          const next = [snapshot, ...prev].slice(0, MAX_SNAPSHOTS_PER_PROJECT);
          return {
            byProject: { ...s.byProject, [snapshot.projectId]: next },
          };
        }),

      clear: (projectId) =>
        set((s) => {
          const { [projectId]: _omit, ...rest } = s.byProject;
          return { byProject: rest };
        }),
    }),
    {
      name: "rezen.rank",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ byProject: s.byProject }),
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

export async function refreshRankSnapshot(input: {
  projectId: string;
  domain: string;
}): Promise<RankSnapshot> {
  await new Promise((r) => setTimeout(r, simulatedRankFetchDelayMs()));
  const snap = generateRankSnapshot(input);
  useRankStore.getState().add(snap);
  return snap;
}

export function ensureRankBootstrap(input: {
  projectId: string;
  domain: string;
}): void {
  const store = useRankStore.getState();
  if (store.latest(input.projectId)) return;
  store.add(generateRankSnapshot(input));
}
