"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { SiteAuditDoc } from "@/lib/audit/audit-types";

type AuditsByProject = Record<string, SiteAuditDoc[]>;

type AuditsStore = {
  byProject: AuditsByProject;
  add: (projectId: string, audit: SiteAuditDoc) => void;
  list: (projectId: string) => SiteAuditDoc[];
  latest: (projectId: string) => SiteAuditDoc | undefined;
  clear: (projectId: string) => void;
};

export const useAuditsStore = create<AuditsStore>()(
  persist(
    (set, get) => ({
      byProject: {},
      add: (projectId, audit) =>
        set((s) => ({
          byProject: {
            ...s.byProject,
            [projectId]: [audit, ...(s.byProject[projectId] ?? [])].slice(
              0,
              50,
            ),
          },
        })),
      list: (projectId) => get().byProject[projectId] ?? [],
      latest: (projectId) => get().byProject[projectId]?.[0],
      clear: (projectId) =>
        set((s) => {
          const next = { ...s.byProject };
          delete next[projectId];
          return { byProject: next };
        }),
    }),
    {
      name: "rezen.audits",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ byProject: s.byProject }),
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        for (const pid of Object.keys(state.byProject)) {
          state.byProject[pid] = state.byProject[pid].map((a) => ({
            ...a,
            createdAt: new Date(a.createdAt),
          }));
        }
      },
    },
  ),
);
