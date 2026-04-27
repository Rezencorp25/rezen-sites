"use client";

import { create } from "zustand";
import { MOCK_COLLECTIONS, MOCK_CMS_ITEMS } from "@/lib/mocks/cms";
import type { CMSCollection, CMSField, CMSItem } from "@/types";

type State = {
  collections: CMSCollection[];
  items: CMSItem[];
};

type Actions = {
  collectionsFor: (projectId: string) => CMSCollection[];
  itemsFor: (collectionId: string) => CMSItem[];
  addCollection: (
    projectId: string,
    name: string,
    fields: CMSField[],
  ) => CMSCollection;
  updateSchema: (collectionId: string, fields: CMSField[]) => void;
  addItem: (
    projectId: string,
    collectionId: string,
    data: Record<string, unknown>,
  ) => void;
  updateItem: (itemId: string, patch: Partial<CMSItem>) => void;
  removeItem: (itemId: string) => void;
};

export const useCMSStore = create<State & Actions>((set, get) => ({
  collections: MOCK_COLLECTIONS,
  items: MOCK_CMS_ITEMS,
  collectionsFor: (projectId) =>
    get().collections.filter((c) => c.projectId === projectId),
  itemsFor: (collectionId) =>
    get().items.filter((i) => i.collectionId === collectionId),
  addCollection: (projectId, name, fields) => {
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    const newColl: CMSCollection = {
      id: `coll-${Date.now()}`,
      projectId,
      name,
      slug,
      fields,
      createdAt: new Date(),
    };
    set((s) => ({ collections: [newColl, ...s.collections] }));
    return newColl;
  },
  updateSchema: (collectionId, fields) =>
    set((s) => ({
      collections: s.collections.map((c) =>
        c.id === collectionId ? { ...c, fields } : c,
      ),
    })),
  addItem: (projectId, collectionId, data) =>
    set((s) => ({
      items: [
        {
          id: `item-${Date.now()}`,
          collectionId,
          projectId,
          data,
          status: "draft" as const,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        ...s.items,
      ],
    })),
  updateItem: (itemId, patch) =>
    set((s) => ({
      items: s.items.map((i) =>
        i.id === itemId ? { ...i, ...patch, updatedAt: new Date() } : i,
      ),
    })),
  removeItem: (itemId) =>
    set((s) => ({
      items: s.items.filter((i) => i.id !== itemId),
    })),
}));
