"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { NOW_ANCHOR } from "@/lib/mocks/now-anchor";

export type CustomEvent = {
  id: string;
  projectId: string;
  /** GA4 event name (snake_case ≤40 char) */
  name: string;
  /** Trigger type */
  trigger: "click" | "view" | "submit" | "scroll" | "custom";
  /** CSS selector / element id / page path that triggers it */
  selector: string;
  /** Mark as conversion event in GA4 */
  isConversion: boolean;
  /** Optional value (CHF) */
  value?: number;
  /** Mock fire count last 30d */
  count30d: number;
  createdAt: string;
};

const SEED: CustomEvent[] = [
  {
    id: "evt-1",
    projectId: "verumflow-ch",
    name: "form_submit",
    trigger: "submit",
    selector: "form.contact",
    isConversion: true,
    value: 50,
    count30d: 48,
    createdAt: new Date(NOW_ANCHOR - 60 * 86400000).toISOString(),
  },
  {
    id: "evt-2",
    projectId: "verumflow-ch",
    name: "cta_click",
    trigger: "click",
    selector: "a.btn-molten",
    isConversion: false,
    count30d: 312,
    createdAt: new Date(NOW_ANCHOR - 30 * 86400000).toISOString(),
  },
  {
    id: "evt-3",
    projectId: "verumflow-ch",
    name: "scroll_75",
    trigger: "scroll",
    selector: "75",
    isConversion: false,
    count30d: 1247,
    createdAt: new Date(NOW_ANCHOR - 14 * 86400000).toISOString(),
  },
];

type State = {
  events: CustomEvent[];
};

type Actions = {
  add: (
    e: Omit<CustomEvent, "id" | "createdAt" | "count30d">,
  ) => string;
  update: (id: string, patch: Partial<CustomEvent>) => void;
  remove: (id: string) => void;
  resetSeed: () => void;
};

export const useEventsStore = create<State & Actions>()(
  persist(
    (set) => ({
      events: SEED,
      add: (e) => {
        const id = `evt-${Date.now()}`;
        set((s) => ({
          events: [
            ...s.events,
            {
              ...e,
              id,
              count30d: 0,
              createdAt: new Date().toISOString(),
            },
          ],
        }));
        return id;
      },
      update: (id, patch) =>
        set((s) => ({
          events: s.events.map((e) => (e.id === id ? { ...e, ...patch } : e)),
        })),
      remove: (id) =>
        set((s) => ({ events: s.events.filter((e) => e.id !== id) })),
      resetSeed: () => set({ events: SEED }),
    }),
    {
      name: "rezen-events-store",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
