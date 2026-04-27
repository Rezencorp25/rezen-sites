"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { MOCK_VERSIONS } from "@/lib/mocks/misc";
import type { PuckData, Version } from "@/types";

/**
 * Extended version record that also carries a snapshot of pageId → puckData at publish time.
 * Used to rollback the pages store to a known state.
 */
export type VersionSnapshot = Version & {
  snapshot?: Record<string, PuckData>;
};

type State = { versions: VersionSnapshot[] };

type Actions = {
  forProject: (projectId: string) => VersionSnapshot[];
  record: (args: {
    projectId: string;
    description: string;
    changes: string[];
    snapshot: Record<string, PuckData>;
    publishedBy?: string;
  }) => VersionSnapshot;
  setLive: (versionId: string) => void;
};

export const useVersionsStore = create<State & Actions>()(
  persist(
    (set, get) => ({
      versions: MOCK_VERSIONS,
      forProject: (projectId) =>
        get().versions.filter((v) => v.projectId === projectId),
      record: ({ projectId, description, changes, snapshot, publishedBy }) => {
        const all = get().versions.filter((v) => v.projectId === projectId);
        const nextTag = `v0.${all.length + 1}`;
        const v: VersionSnapshot = {
          id: `ver-${Date.now()}`,
          projectId,
          versionTag: nextTag,
          status: "LIVE",
          publishedBy: publishedBy ?? "REZEN Team",
          publishedAt: new Date(),
          description,
          changes,
          snapshot,
        };
        set((s) => ({
          versions: [
            v,
            ...s.versions.map((x) =>
              x.projectId === projectId && x.status === "LIVE"
                ? { ...x, status: "READY" as const }
                : x,
            ),
          ],
        }));
        return v;
      },
      setLive: (versionId) =>
        set((s) => {
          const target = s.versions.find((v) => v.id === versionId);
          if (!target) return s;
          return {
            versions: s.versions.map((v) => {
              if (v.projectId !== target.projectId) return v;
              if (v.id === versionId) return { ...v, status: "LIVE" as const };
              if (v.status === "LIVE") return { ...v, status: "READY" as const };
              return v;
            }),
          };
        }),
    }),
    {
      name: "rezen.versions",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ versions: s.versions }),
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        state.versions = state.versions.map((v) => ({
          ...v,
          publishedAt: new Date(v.publishedAt),
        }));
      },
    },
  ),
);
