"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

/**
 * S9 — Actions store.
 * Tiene traccia delle action items "risolte" dal team localmente. Key è
 * `actionItemKey(projectId, source, title)` (vedi lib/reports/action-items.ts).
 *
 * Persist locale (localStorage); future iteration S9.2 può sincronizzare su
 * Firestore `projects/{id}/resolved_actions/{key}` per condivisione team.
 */

type ResolvedByProject = Record<string, string[]>;

type ActionsStore = {
  resolvedByProject: ResolvedByProject;

  isResolved: (projectId: string, key: string) => boolean;
  markResolved: (projectId: string, key: string) => void;
  unResolved: (projectId: string, key: string) => void;
  clearProject: (projectId: string) => void;
};

export const useActionsStore = create<ActionsStore>()(
  persist(
    (set, get) => ({
      resolvedByProject: {},

      isResolved: (projectId, key) => {
        const list = get().resolvedByProject[projectId];
        return list ? list.includes(key) : false;
      },

      markResolved: (projectId, key) =>
        set((s) => {
          const prev = s.resolvedByProject[projectId] ?? [];
          if (prev.includes(key)) return s;
          return {
            resolvedByProject: {
              ...s.resolvedByProject,
              [projectId]: [...prev, key],
            },
          };
        }),

      unResolved: (projectId, key) =>
        set((s) => {
          const prev = s.resolvedByProject[projectId] ?? [];
          return {
            resolvedByProject: {
              ...s.resolvedByProject,
              [projectId]: prev.filter((k) => k !== key),
            },
          };
        }),

      clearProject: (projectId) =>
        set((s) => {
          const { [projectId]: _omit, ...rest } = s.resolvedByProject;
          return { resolvedByProject: rest };
        }),
    }),
    {
      name: "rezen.actions",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ resolvedByProject: s.resolvedByProject }),
    },
  ),
);
