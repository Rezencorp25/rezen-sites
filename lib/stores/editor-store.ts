"use client";

import { create } from "zustand";

export type Device = "desktop" | "tablet" | "mobile";

type State = {
  pageId: string | null;
  device: Device;
  isDirty: boolean;
  isSaving: boolean;
  aiBusy: boolean;
  selectedItemId: string | null;
};

type Actions = {
  setPage: (pageId: string) => void;
  setDevice: (d: Device) => void;
  setDirty: (v: boolean) => void;
  setSaving: (v: boolean) => void;
  setAIBusy: (v: boolean) => void;
  setSelected: (id: string | null) => void;
};

export const useEditorStore = create<State & Actions>((set) => ({
  pageId: null,
  device: "desktop",
  isDirty: false,
  isSaving: false,
  aiBusy: false,
  selectedItemId: null,
  setPage: (pageId) => set({ pageId, isDirty: false, selectedItemId: null }),
  setDevice: (device) => set({ device }),
  setDirty: (isDirty) => set({ isDirty }),
  setSaving: (isSaving) => set({ isSaving }),
  setAIBusy: (aiBusy) => set({ aiBusy }),
  setSelected: (selectedItemId) => set({ selectedItemId }),
}));
