"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { NOW_ANCHOR } from "@/lib/mocks/now-anchor";

export type TaskStatus = "todo" | "in_progress" | "done" | "blocked";
export type TaskPriority = "low" | "medium" | "high" | "urgent";

export type ProjectTask = {
  id: string;
  projectId: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  /** Hours spent so far (for cost allocation I.90) */
  hoursSpent: number;
  /** Estimated hours preventive (S11 export per cliente) */
  estimatedHours: number;
  /** Per-task rate override; null = usa workspace billing.hourlyRate */
  customRate: number | null;
  /** Include in customer export (S11). Default true. */
  customerPriced: boolean;
  assigneeName: string;
  /** ISO date YYYY-MM-DD */
  dueDate: string;
  /** Optional alert/audit id link */
  fromAlertId?: string;
  createdAt: string;
};

const SEED: ProjectTask[] = [
  {
    id: "tk-1",
    projectId: "verumflow-ch",
    title: "Aggiungere meta description su /blog/post-3",
    description: "Triggered by alert #a1. Generato AI fallback OK.",
    status: "in_progress",
    priority: "high",
    hoursSpent: 0.5,
    estimatedHours: 1,
    customRate: null,
    customerPriced: true,
    assigneeName: "Anna Bianchi",
    dueDate: new Date(NOW_ANCHOR + 2 * 86400000).toISOString().slice(0, 10),
    createdAt: new Date(NOW_ANCHOR - 1 * 86400000).toISOString(),
  },
  {
    id: "tk-2",
    projectId: "verumflow-ch",
    title: "Verificare bounce rate /contact",
    description: "Bounce >80%. Possibile UX issue.",
    status: "todo",
    priority: "medium",
    hoursSpent: 0,
    estimatedHours: 2,
    customRate: null,
    customerPriced: true,
    assigneeName: "Te",
    dueDate: new Date(NOW_ANCHOR + 5 * 86400000).toISOString().slice(0, 10),
    createdAt: new Date(NOW_ANCHOR - 2 * 86400000).toISOString(),
  },
];

type State = { tasks: ProjectTask[] };
type Actions = {
  add: (t: Omit<ProjectTask, "id" | "createdAt">) => string;
  update: (id: string, patch: Partial<ProjectTask>) => void;
  remove: (id: string) => void;
  resetSeed: () => void;
};

export const useTasksStore = create<State & Actions>()(
  persist(
    (set) => ({
      tasks: SEED,
      add: (t) => {
        const id = `tk-${Date.now()}`;
        set((s) => ({
          tasks: [
            ...s.tasks,
            { ...t, id, createdAt: new Date().toISOString() },
          ],
        }));
        return id;
      },
      update: (id, patch) =>
        set((s) => ({
          tasks: s.tasks.map((t) => (t.id === id ? { ...t, ...patch } : t)),
        })),
      remove: (id) => set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) })),
      resetSeed: () => set({ tasks: SEED }),
    }),
    {
      name: "rezen-tasks-store",
      version: 2,
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        // Migration v1→v2: aggiungi campi S11 a task pre-esistenti.
        state.tasks = state.tasks.map((t) => ({
          ...t,
          estimatedHours: t.estimatedHours ?? t.hoursSpent ?? 0,
          customRate: t.customRate ?? null,
          customerPriced: t.customerPriced ?? true,
        }));
      },
    },
  ),
);
