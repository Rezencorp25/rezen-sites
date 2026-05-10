"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { MOCK_COLLECTIONS, MOCK_CMS_ITEMS } from "@/lib/mocks/cms";
import type {
  CMSCollection,
  CMSField,
  CMSItem,
  CMSItemFieldData,
  CMSItemStatus,
  CMSItemVersion,
} from "@/types";
import { DEFAULT_COLLECTION_LIMITS } from "@/types/cms";
import {
  generateCollectionHashId,
  inferSingularPlural,
  slugify,
} from "@/lib/cms/collection-id";

type State = {
  collections: CMSCollection[];
  items: CMSItem[];
};

export type AddCollectionInput = {
  projectId: string;
  name: string;
  fields: CMSField[];
  slug?: string;
  singularName?: string;
  pluralName?: string;
};

type Actions = {
  collectionsFor: (projectId: string) => CMSCollection[];
  itemsFor: (collectionId: string) => CMSItem[];
  addCollection: (input: AddCollectionInput) => CMSCollection;
  updateSchema: (collectionId: string, fields: CMSField[]) => void;
  addItem: (
    projectId: string,
    collectionId: string,
    draftData: CMSItemFieldData,
  ) => CMSItem;
  updateItem: (itemId: string, patch: Partial<CMSItem>) => void;
  setItemStatus: (itemId: string, status: CMSItemStatus) => void;
  restoreVersion: (itemId: string, versionId: string) => void;
  removeItem: (itemId: string) => void;
};

export const useCMSStore = create<State & Actions>()(
  persist(
    (set, get) => ({
  collections: MOCK_COLLECTIONS,
  items: MOCK_CMS_ITEMS,
  collectionsFor: (projectId) =>
    get().collections.filter((c) => c.projectId === projectId),
  itemsFor: (collectionId) =>
    get().items.filter((i) => i.collectionId === collectionId),
  addCollection: ({ projectId, name, fields, slug, singularName, pluralName }) => {
    const trimmed = name.trim();
    const inferred = inferSingularPlural(trimmed);
    const newColl: CMSCollection = {
      id: `coll-${Date.now()}`,
      hashId: generateCollectionHashId(),
      projectId,
      name: trimmed,
      displayName: trimmed,
      singularName: singularName ?? inferred.singular,
      pluralName: pluralName ?? inferred.plural,
      slug: slug ?? slugify(trimmed),
      fields,
      limits: DEFAULT_COLLECTION_LIMITS,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    set((s) => ({ collections: [newColl, ...s.collections] }));
    return newColl;
  },
  updateSchema: (collectionId, fields) => {
    // TODO S7.6: audit log via CF onWrite — diff schema (campi reference create/rimosse)
    set((s) => ({
      collections: s.collections.map((c) =>
        c.id === collectionId ? { ...c, fields, updatedAt: new Date() } : c,
      ),
    }));
  },
  addItem: (projectId, collectionId, draftData) => {
    const newItem: CMSItem = {
      id: `item-${Date.now()}`,
      collectionId,
      projectId,
      status: "draft",
      draftData,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    set((s) => ({ items: [newItem, ...s.items] }));
    return newItem;
  },
  updateItem: (itemId, patch) =>
    set((s) => ({
      items: s.items.map((i) =>
        i.id === itemId ? { ...i, ...patch, updatedAt: new Date() } : i,
      ),
    })),
  setItemStatus: (itemId, status) => {
    set((s) => ({
      items: s.items.map((i) => {
        if (i.id !== itemId) return i;
        const next: CMSItem = { ...i, status, updatedAt: new Date() };
        if (status === "archived") {
          next.archivedAt = new Date();
        }
        return next;
      }),
    }));

    // Mock CF `cmsItemOnWrite`: quando passa a "queued", dopo 1500ms
    // simula il publish work (= copy draftData → liveData + version snapshot).
    if (status === "queued") {
      setTimeout(() => {
        const fresh = get().items.find((i) => i.id === itemId);
        if (!fresh || fresh.status !== "queued") return;
        const liveData = fresh.draftData;
        const version: CMSItemVersion = {
          id: `v-${Date.now()}`,
          snapshotAt: new Date(),
          data: liveData,
          publishedFromStatus: "queued",
        };
        set((s) => ({
          items: s.items.map((i) =>
            i.id === itemId
              ? {
                  ...i,
                  status: "published",
                  liveData,
                  lastPublishedAt: new Date(),
                  versions: [...(i.versions ?? []), version].slice(-20),
                  updatedAt: new Date(),
                }
              : i,
          ),
        }));
      }, 1500);
    }
  },
  restoreVersion: (itemId, versionId) =>
    set((s) => ({
      items: s.items.map((i) => {
        if (i.id !== itemId) return i;
        const v = (i.versions ?? []).find((x) => x.id === versionId);
        if (!v) return i;
        return { ...i, draftData: v.data, updatedAt: new Date() };
      }),
    })),
  removeItem: (itemId) =>
    set((s) => ({
      items: s.items.filter((i) => i.id !== itemId),
    })),
    }),
    {
      name: "rezen.cms",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
