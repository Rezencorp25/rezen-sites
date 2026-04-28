"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type ScheduleStatus =
  | "draft"
  | "review"
  | "approved"
  | "scheduled"
  | "published"
  | "rejected";

export type ScheduledRelease = {
  id: string;
  projectId: string;
  /** Pages or settings included in this release */
  scope: string;
  /** ISO timestamp when to publish */
  scheduledFor: string;
  status: ScheduleStatus;
  createdBy: string;
  createdAt: string;
  approvedBy?: string;
  approvedAt?: string;
  notes?: string;
};

type State = {
  releases: ScheduledRelease[];
};

type Actions = {
  list: (projectId: string) => ScheduledRelease[];
  schedule: (
    r: Omit<ScheduledRelease, "id" | "createdAt" | "status"> & {
      status?: ScheduleStatus;
    },
  ) => string;
  approve: (id: string, approvedBy: string) => void;
  reject: (id: string, approvedBy: string, notes?: string) => void;
  cancel: (id: string) => void;
  resetSeed: () => void;
};

const SEED: ScheduledRelease[] = [];

export const useScheduleStore = create<State & Actions>()(
  persist(
    (set, get) => ({
      releases: SEED,
      list: (projectId) =>
        get().releases.filter((r) => r.projectId === projectId),
      schedule: (r) => {
        const id = `rel-${Date.now()}`;
        set((s) => ({
          releases: [
            {
              ...r,
              id,
              status: r.status ?? "review",
              createdAt: new Date().toISOString(),
            },
            ...s.releases,
          ],
        }));
        return id;
      },
      approve: (id, approvedBy) =>
        set((s) => ({
          releases: s.releases.map((r) =>
            r.id === id
              ? {
                  ...r,
                  status: "approved",
                  approvedBy,
                  approvedAt: new Date().toISOString(),
                }
              : r,
          ),
        })),
      reject: (id, approvedBy, notes) =>
        set((s) => ({
          releases: s.releases.map((r) =>
            r.id === id
              ? {
                  ...r,
                  status: "rejected",
                  approvedBy,
                  approvedAt: new Date().toISOString(),
                  notes,
                }
              : r,
          ),
        })),
      cancel: (id) =>
        set((s) => ({
          releases: s.releases.filter((r) => r.id !== id),
        })),
      resetSeed: () => set({ releases: SEED }),
    }),
    {
      name: "rezen-schedule-store",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
