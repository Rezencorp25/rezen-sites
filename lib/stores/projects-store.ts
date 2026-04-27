"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { MOCK_PROJECTS } from "@/lib/mocks/projects";
import type { Project } from "@/types";

type ProjectsStore = {
  projects: Project[];
  getById: (id: string) => Project | undefined;
  addProject: (p: Project) => void;
  removeProject: (id: string) => void;
};

export const useProjectsStore = create<ProjectsStore>()(
  persist(
    (set, get) => ({
      projects: MOCK_PROJECTS,
      getById: (id) => get().projects.find((p) => p.id === id),
      addProject: (p) =>
        set((s) => ({ projects: [p, ...s.projects] })),
      removeProject: (id) =>
        set((s) => ({ projects: s.projects.filter((p) => p.id !== id) })),
    }),
    {
      name: "rezen.projects",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ projects: s.projects }),
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        state.projects = state.projects.map((p) => ({
          ...p,
          createdAt: new Date(p.createdAt),
          updatedAt: new Date(p.updatedAt),
        }));
      },
    },
  ),
);
