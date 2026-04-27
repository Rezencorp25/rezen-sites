"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

type AppStore = {
  currentProjectId: string | null;
  setCurrentProjectId: (id: string | null) => void;
};

export const useAppStore = create<AppStore>()(
  persist(
    (set) => ({
      currentProjectId: null,
      setCurrentProjectId: (id) => set({ currentProjectId: id }),
    }),
    {
      name: "rezen-app-store",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
