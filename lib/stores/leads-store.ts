"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type {
  Lead,
  LeadStatus,
  LeadHistoryEvent,
  LeadNote,
} from "@/lib/leads/types";
import { LEAD_STATUS_META } from "@/lib/leads/status-machine";
import { MOCK_LEADS_BY_PROJECT } from "@/lib/mocks/leads";

type LeadsByProject = Record<string, Lead[]>;

type LeadsStore = {
  byProject: LeadsByProject;

  list: (projectId: string) => Lead[];
  get: (projectId: string, leadId: string) => Lead | undefined;

  add: (lead: Lead) => void;
  setStatus: (
    projectId: string,
    leadId: string,
    next: LeadStatus,
    actor: { uid: string; name: string },
  ) => void;
  setValue: (
    projectId: string,
    leadId: string,
    value: number | null,
    actor: { uid: string; name: string },
  ) => void;
  assign: (
    projectId: string,
    leadId: string,
    assignee: { uid: string; name: string } | null,
    actor: { uid: string; name: string },
  ) => void;
  addNote: (projectId: string, leadId: string, note: LeadNote) => void;
  addTag: (
    projectId: string,
    leadId: string,
    tag: string,
    actor: { uid: string; name: string },
  ) => void;
  removeTag: (
    projectId: string,
    leadId: string,
    tag: string,
    actor: { uid: string; name: string },
  ) => void;
  softDelete: (
    projectId: string,
    leadId: string,
    actor: { uid: string; name: string },
  ) => void;
};

function makeEvent(
  partial: Omit<LeadHistoryEvent, "id" | "createdAt">,
): LeadHistoryEvent {
  return {
    id: `evt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date(),
    ...partial,
  };
}

function patch(
  state: LeadsByProject,
  projectId: string,
  leadId: string,
  fn: (l: Lead) => Lead,
): LeadsByProject {
  const list = state[projectId];
  if (!list) return state;
  return {
    ...state,
    [projectId]: list.map((l) => (l.id === leadId ? fn(l) : l)),
  };
}

export const useLeadsStore = create<LeadsStore>()(
  persist(
    (set, get) => ({
      byProject: MOCK_LEADS_BY_PROJECT,

      list: (projectId) =>
        (get().byProject[projectId] ?? []).filter((l) => !l.deleted),

      get: (projectId, leadId) =>
        get().byProject[projectId]?.find((l) => l.id === leadId),

      add: (lead) =>
        set((s) => ({
          byProject: {
            ...s.byProject,
            [lead.projectId]: [lead, ...(s.byProject[lead.projectId] ?? [])],
          },
        })),

      setStatus: (projectId, leadId, next, actor) =>
        set((s) => ({
          byProject: patch(s.byProject, projectId, leadId, (l) => {
            if (l.status === next) return l;
            const evt = makeEvent({
              actorUid: actor.uid,
              actorName: actor.name,
              action: "status_changed",
              from: l.status,
              to: next,
              description: `${LEAD_STATUS_META[l.status].label} → ${LEAD_STATUS_META[next].label}`,
            });
            return {
              ...l,
              status: next,
              statusUpdatedAt: new Date(),
              statusUpdatedBy: actor.uid,
              updatedAt: new Date(),
              history: [evt, ...l.history],
            };
          }),
        })),

      setValue: (projectId, leadId, value, actor) =>
        set((s) => ({
          byProject: patch(s.byProject, projectId, leadId, (l) => {
            const evt = makeEvent({
              actorUid: actor.uid,
              actorName: actor.name,
              action: "value_set",
              from: String(l.value ?? "—"),
              to: String(value ?? "—"),
              description: `Valore lead aggiornato a ${value ?? "non impostato"}`,
            });
            return {
              ...l,
              value,
              updatedAt: new Date(),
              history: [evt, ...l.history],
            };
          }),
        })),

      assign: (projectId, leadId, assignee, actor) =>
        set((s) => ({
          byProject: patch(s.byProject, projectId, leadId, (l) => {
            const evt = makeEvent({
              actorUid: actor.uid,
              actorName: actor.name,
              action: "assigned",
              from: l.assignedToName ?? "non assegnato",
              to: assignee?.name ?? "non assegnato",
              description: `Assegnato a ${assignee?.name ?? "nessuno"}`,
            });
            return {
              ...l,
              assignedTo: assignee?.uid ?? null,
              assignedToName: assignee?.name ?? null,
              updatedAt: new Date(),
              history: [evt, ...l.history],
            };
          }),
        })),

      addNote: (projectId, leadId, note) =>
        set((s) => ({
          byProject: patch(s.byProject, projectId, leadId, (l) => {
            const evt = makeEvent({
              actorUid: note.authorUid,
              actorName: note.authorName,
              action: "note_added",
              description: note.text.slice(0, 80),
            });
            return {
              ...l,
              notes: [note, ...l.notes],
              updatedAt: new Date(),
              history: [evt, ...l.history],
            };
          }),
        })),

      addTag: (projectId, leadId, tag, actor) =>
        set((s) => ({
          byProject: patch(s.byProject, projectId, leadId, (l) => {
            if (l.tags.includes(tag)) return l;
            const evt = makeEvent({
              actorUid: actor.uid,
              actorName: actor.name,
              action: "tag_added",
              to: tag,
              description: `Tag aggiunto: ${tag}`,
            });
            return {
              ...l,
              tags: [...l.tags, tag],
              updatedAt: new Date(),
              history: [evt, ...l.history],
            };
          }),
        })),

      removeTag: (projectId, leadId, tag, actor) =>
        set((s) => ({
          byProject: patch(s.byProject, projectId, leadId, (l) => {
            if (!l.tags.includes(tag)) return l;
            const evt = makeEvent({
              actorUid: actor.uid,
              actorName: actor.name,
              action: "tag_removed",
              from: tag,
              description: `Tag rimosso: ${tag}`,
            });
            return {
              ...l,
              tags: l.tags.filter((t) => t !== tag),
              updatedAt: new Date(),
              history: [evt, ...l.history],
            };
          }),
        })),

      softDelete: (projectId, leadId, actor) =>
        set((s) => ({
          byProject: patch(s.byProject, projectId, leadId, (l) => {
            const evt = makeEvent({
              actorUid: actor.uid,
              actorName: actor.name,
              action: "soft_deleted",
              description: "Lead soft-deleted (GDPR art.17)",
            });
            return {
              ...l,
              deleted: true,
              fields: {
                name: "[DELETED]",
                email: "[DELETED]",
                phone: "[DELETED]",
                message: "[DELETED]",
              },
              updatedAt: new Date(),
              history: [evt, ...l.history],
            };
          }),
        })),
    }),
    {
      name: "rezen.leads",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ byProject: s.byProject }),
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        for (const pid of Object.keys(state.byProject)) {
          state.byProject[pid] = state.byProject[pid].map((l) => ({
            ...l,
            createdAt: new Date(l.createdAt),
            updatedAt: new Date(l.updatedAt),
            statusUpdatedAt: new Date(l.statusUpdatedAt),
            notes: l.notes.map((n) => ({
              ...n,
              createdAt: new Date(n.createdAt),
            })),
            history: l.history.map((h) => ({
              ...h,
              createdAt: new Date(h.createdAt),
            })),
          }));
        }
      },
    },
  ),
);
