"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { NOW_ANCHOR } from "@/lib/mocks/now-anchor";

export type AuditAction =
  | "page.create"
  | "page.update"
  | "page.delete"
  | "page.publish"
  | "version.deploy"
  | "version.rollback"
  | "settings.update"
  | "team.invite"
  | "team.role.change"
  | "team.disable"
  | "form.submission"
  | "redirect.create"
  | "redirect.delete"
  | "campaign.create"
  | "campaign.pause"
  | "schedule.create";

export type AuditEntry = {
  id: string;
  /** ISO timestamp */
  at: string;
  actor: { id: string; name: string; email?: string };
  action: AuditAction;
  /** Free-form description shown in feed */
  description: string;
  /** Target — projectId, pageId, etc. */
  target?: { kind: string; id: string; name?: string };
  /** Optional metadata payload (diff, before/after) */
  meta?: Record<string, unknown>;
  /** Per-user notification read state */
  read?: boolean;
};

const SEED: AuditEntry[] = [
  {
    id: "log-1",
    at: new Date(NOW_ANCHOR - 2 * 3600000).toISOString(),
    actor: { id: "u-anna", name: "Anna Bianchi", email: "anna@rezencorp.com" },
    action: "page.publish",
    description: "Pubblicata pagina Home",
    target: { kind: "page", id: "verumflow-home", name: "Home" },
  },
  {
    id: "log-2",
    at: new Date(NOW_ANCHOR - 6 * 3600000).toISOString(),
    actor: {
      id: "u-owner",
      name: "Francesco Lossi",
      email: "info@rezencorp.com",
    },
    action: "settings.update",
    description: "Aggiornato robots.txt: Disallow /admin",
    target: { kind: "settings", id: "verumflow-ch.robots" },
  },
  {
    id: "log-3",
    at: new Date(NOW_ANCHOR - 24 * 3600000).toISOString(),
    actor: {
      id: "u-owner",
      name: "Francesco Lossi",
      email: "info@rezencorp.com",
    },
    action: "team.invite",
    description: "Invitata Anna Bianchi come Editor",
    target: { kind: "user", id: "u-anna", name: "Anna Bianchi" },
  },
];

const MAX_ENTRIES = 500;

type State = {
  entries: AuditEntry[];
};

type Actions = {
  list: (filter?: { projectId?: string; limit?: number }) => AuditEntry[];
  log: (entry: Omit<AuditEntry, "id" | "at">) => void;
  unreadCount: () => number;
  markAllRead: () => void;
  clear: () => void;
  resetSeed: () => void;
};

export const useAuditStore = create<State & Actions>()(
  persist(
    (set, get) => ({
      entries: SEED,
      list: (filter) => {
        let entries = get().entries;
        if (filter?.projectId) {
          entries = entries.filter(
            (e) =>
              !e.target ||
              e.target.id === filter.projectId ||
              e.target.id.startsWith(`${filter.projectId}.`),
          );
        }
        if (filter?.limit) entries = entries.slice(0, filter.limit);
        return entries;
      },
      log: (entry) =>
        set((s) => ({
          entries: [
            {
              ...entry,
              id: `log-${Date.now()}`,
              at: new Date().toISOString(),
              read: false,
            },
            ...s.entries,
          ].slice(0, MAX_ENTRIES),
        })),
      unreadCount: () => get().entries.filter((e) => !e.read).length,
      markAllRead: () =>
        set((s) => ({
          entries: s.entries.map((e) => ({ ...e, read: true })),
        })),
      clear: () => set({ entries: [] }),
      resetSeed: () => set({ entries: SEED }),
    }),
    {
      name: "rezen-audit-store",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
