"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { MOCK_REDIRECTS } from "@/lib/mocks/misc";
import type { Redirect } from "@/types";

type State = {
  byProject: Record<string, Redirect[]>;
};

type Actions = {
  list: (projectId: string) => Redirect[];
  add: (
    projectId: string,
    r: Omit<Redirect, "id" | "projectId" | "createdAt">,
  ) => void;
  toggle: (projectId: string, id: string) => void;
  remove: (projectId: string, id: string) => void;
};

function seedForProject(projectId: string): Redirect[] {
  return MOCK_REDIRECTS.filter((r) => r.projectId === projectId);
}

export const useRedirectsStore = create<State & Actions>()(
  persist(
    (set, get) => ({
      byProject: {},
      list: (projectId) => {
        const cached = get().byProject[projectId];
        if (cached) return cached;
        const seeded = seedForProject(projectId);
        set((s) => ({
          byProject: { ...s.byProject, [projectId]: seeded },
        }));
        return seeded;
      },
      add: (projectId, r) =>
        set((s) => {
          const current = s.byProject[projectId] ?? seedForProject(projectId);
          const next: Redirect = {
            ...r,
            id: `${projectId}-${Date.now()}`,
            projectId,
            createdAt: new Date(),
          };
          return {
            byProject: { ...s.byProject, [projectId]: [next, ...current] },
          };
        }),
      toggle: (projectId, id) =>
        set((s) => {
          const current = s.byProject[projectId] ?? seedForProject(projectId);
          return {
            byProject: {
              ...s.byProject,
              [projectId]: current.map((r) =>
                r.id === id ? { ...r, active: !r.active } : r,
              ),
            },
          };
        }),
      remove: (projectId, id) =>
        set((s) => {
          const current = s.byProject[projectId] ?? seedForProject(projectId);
          return {
            byProject: {
              ...s.byProject,
              [projectId]: current.filter((r) => r.id !== id),
            },
          };
        }),
    }),
    {
      name: "rezen-redirects-store",
      storage: createJSONStorage(() => localStorage),
      // Custom date revival for Redirects.
      partialize: (state) => ({
        byProject: Object.fromEntries(
          Object.entries(state.byProject).map(([k, v]) => [
            k,
            v.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() })),
          ]),
        ),
      }),
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        for (const key of Object.keys(state.byProject)) {
          state.byProject[key] = (
            state.byProject[key] as unknown as (Redirect & {
              createdAt: string | Date;
            })[]
          ).map((r) => ({ ...r, createdAt: new Date(r.createdAt) }));
        }
      },
    },
  ),
);
