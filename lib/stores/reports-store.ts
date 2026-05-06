"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

/**
 * S8: store locale per report PDF mensili. In stub-mode mantiene mock entries
 * generate da `simulateGenerateReport()`. In live-mode (httpsCallable) lo
 * store viene popolato dalla risposta della CF + sync da Firestore listener
 * (S8.2 future iteration).
 */

export type ReportEntry = {
  monthKey: string; // "YYYY-MM"
  periodLabel: string; // "Aprile 2026"
  url: string | null; // signed URL (download)
  sizeBytes: number | null;
  pageCount: number;
  status: "ready" | "generating" | "failed";
  generatedAt: Date;
};

type ReportsByProject = Record<string, ReportEntry[]>;

type ReportsStore = {
  byProject: ReportsByProject;

  list: (projectId: string) => ReportEntry[];
  upsert: (projectId: string, entry: ReportEntry) => void;
  remove: (projectId: string, monthKey: string) => void;
};

const MAX_REPORTS_PER_PROJECT = 24; // 2 anni

export const useReportsStore = create<ReportsStore>()(
  persist(
    (set, get) => ({
      byProject: {},

      list: (projectId) =>
        (get().byProject[projectId] ?? []).slice().sort((a, b) =>
          b.monthKey.localeCompare(a.monthKey),
        ),

      upsert: (projectId, entry) =>
        set((s) => {
          const prev = s.byProject[projectId] ?? [];
          const filtered = prev.filter((p) => p.monthKey !== entry.monthKey);
          const next = [entry, ...filtered].slice(0, MAX_REPORTS_PER_PROJECT);
          return {
            byProject: { ...s.byProject, [projectId]: next },
          };
        }),

      remove: (projectId, monthKey) =>
        set((s) => ({
          byProject: {
            ...s.byProject,
            [projectId]: (s.byProject[projectId] ?? []).filter(
              (p) => p.monthKey !== monthKey,
            ),
          },
        })),
    }),
    {
      name: "rezen.reports",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ byProject: s.byProject }),
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        for (const pid of Object.keys(state.byProject)) {
          state.byProject[pid] = state.byProject[pid].map((r) => ({
            ...r,
            generatedAt: new Date(r.generatedAt),
          }));
        }
      },
    },
  ),
);

const ITALIAN_MONTHS = [
  "Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno",
  "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre",
];

export function monthKeyOf(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

export function periodLabelOf(monthKey: string): string {
  const [y, m] = monthKey.split("-");
  const monthIdx = Number(m) - 1;
  if (monthIdx < 0 || monthIdx > 11) return monthKey;
  return `${ITALIAN_MONTHS[monthIdx]} ${y}`;
}

export function listAvailableMonthKeys(count = 12): string[] {
  const out: string[] = [];
  const now = new Date();
  for (let i = 0; i < count; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    out.push(monthKeyOf(d));
  }
  return out;
}

/**
 * Stub: simula generazione report (delay 2s + dummy URL). Usato in dev mode
 * mentre la CF callable non è ancora wirata.
 */
export async function simulateGenerateReport(
  projectId: string,
  monthKey: string,
): Promise<ReportEntry> {
  const store = useReportsStore.getState();
  // Insert in "generating" state
  store.upsert(projectId, {
    monthKey,
    periodLabel: periodLabelOf(monthKey),
    url: null,
    sizeBytes: null,
    pageCount: 8,
    status: "generating",
    generatedAt: new Date(),
  });
  await new Promise((r) => setTimeout(r, 1500));
  const entry: ReportEntry = {
    monthKey,
    periodLabel: periodLabelOf(monthKey),
    url: `data:application/pdf;base64,JVBERi0xLjQKJeLjz9MKMSAwIG9iago8PC9UeXBlL0NhdGFsb2cvUGFnZXMgMiAwIFI+PgplbmRvYmoKMiAwIG9iago8PC9UeXBlL1BhZ2VzL0tpZHNbMyAwIFJdL0NvdW50IDE+PgplbmRvYmoKMyAwIG9iago8PC9UeXBlL1BhZ2UvTWVkaWFCb3hbMCAwIDU5NSA4NDJdL1BhcmVudCAyIDAgUj4+CmVuZG9iagp4cmVmCjAgNAowMDAwMDAwMDAwIDY1NTM1IGYgCjAwMDAwMDAwMTUgMDAwMDAgbiAKMDAwMDAwMDA1OCAwMDAwMCBuIAowMDAwMDAwMTAwIDAwMDAwIG4gCnRyYWlsZXIKPDwvU2l6ZSA0L1Jvb3QgMSAwIFI+PgpzdGFydHhyZWYKMTU2CiUlRU9G`,
    sizeBytes: 184_320 + Math.floor(Math.random() * 65_536),
    pageCount: 8,
    status: "ready",
    generatedAt: new Date(),
  };
  store.upsert(projectId, entry);
  return entry;
}
