"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { NOW_ANCHOR } from "@/lib/mocks/now-anchor";

export type Role = "super-admin" | "admin" | "editor" | "viewer";

export type TeamMember = {
  id: string;
  email: string;
  name: string;
  role: Role;
  /** Project IDs the member can access; "*" means all */
  projectAccess: string[] | "*";
  invitedAt: string;
  status: "active" | "pending" | "disabled";
  mfaEnabled: boolean;
};

const SEED: TeamMember[] = [
  {
    id: "u-owner",
    email: "info@rezencorp.com",
    name: "Francesco Lossi",
    role: "super-admin",
    projectAccess: "*",
    invitedAt: new Date(NOW_ANCHOR - 90 * 86400000).toISOString(),
    status: "active",
    mfaEnabled: true,
  },
  {
    id: "u-anna",
    email: "anna@rezencorp.com",
    name: "Anna Bianchi",
    role: "editor",
    projectAccess: ["verumflow-ch", "impresa-edile-carfi"],
    invitedAt: new Date(NOW_ANCHOR - 14 * 86400000).toISOString(),
    status: "active",
    mfaEnabled: false,
  },
];

type State = {
  members: TeamMember[];
};

type Actions = {
  list: () => TeamMember[];
  invite: (m: Omit<TeamMember, "id" | "invitedAt" | "status">) => void;
  updateRole: (id: string, role: Role) => void;
  updateAccess: (id: string, projectIds: string[] | "*") => void;
  toggleStatus: (id: string) => void;
  remove: (id: string) => void;
  resetSeed: () => void;
};

export const useTeamStore = create<State & Actions>()(
  persist(
    (set, get) => ({
      members: SEED,
      list: () => get().members,
      invite: (m) =>
        set((s) => ({
          members: [
            ...s.members,
            {
              ...m,
              id: `u-${Date.now()}`,
              invitedAt: new Date().toISOString(),
              status: "pending",
            },
          ],
        })),
      updateRole: (id, role) =>
        set((s) => ({
          members: s.members.map((m) => (m.id === id ? { ...m, role } : m)),
        })),
      updateAccess: (id, projectAccess) =>
        set((s) => ({
          members: s.members.map((m) =>
            m.id === id ? { ...m, projectAccess } : m,
          ),
        })),
      toggleStatus: (id) =>
        set((s) => ({
          members: s.members.map((m) =>
            m.id === id
              ? {
                  ...m,
                  status: m.status === "active" ? "disabled" : "active",
                }
              : m,
          ),
        })),
      remove: (id) =>
        set((s) => ({
          members: s.members.filter((m) => m.id !== id),
        })),
      resetSeed: () => set({ members: SEED }),
    }),
    {
      name: "rezen-team-store",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);

export const ROLE_PERMISSIONS: Record<
  Role,
  { label: string; description: string; can: string[] }
> = {
  "super-admin": {
    label: "Super Admin",
    description: "Tutto, incluso billing + gestione team + cancellazione progetti",
    can: ["*"],
  },
  admin: {
    label: "Admin",
    description: "Tutto tranne billing e gestione team",
    can: [
      "create_project",
      "edit_pages",
      "publish",
      "edit_settings",
      "view_analytics",
    ],
  },
  editor: {
    label: "Editor",
    description: "Crea/modifica pagine ma non può deployare in produzione",
    can: ["edit_pages", "view_analytics"],
  },
  viewer: {
    label: "Viewer",
    description: "Solo lettura, vedi KPI e analytics",
    can: ["view_analytics"],
  },
};
