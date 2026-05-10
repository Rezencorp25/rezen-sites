"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { CMSCollection, CMSItem, CMSField, CMSFieldType } from "@/types";
import { FIELD_TYPE_REGISTRY } from "@/lib/cms/field-types";

/**
 * Context CMS per le Collection Page templates.
 * Provider in `app/preview/[projectId]/[collectionSlug]/[itemSlug]/page.tsx`.
 * Componenti Puck bindable leggono qui per risolvere `bindingKey`.
 */
export type CmsBindingContextValue = {
  collection: CMSCollection;
  item: CMSItem;
  /** True quando l'utente ha toggle "Edit mode" nel preview. */
  editable: boolean;
  /** Patch granulare di un field — debounce 600ms applicato dal provider. */
  patch: (fieldId: string, value: unknown) => void;
};

const CmsBindingContext = createContext<CmsBindingContextValue | null>(null);

export function CmsBindingProvider({
  collection,
  item,
  editable,
  onCommit,
  children,
}: {
  collection: CMSCollection;
  item: CMSItem;
  editable: boolean;
  onCommit: (next: Record<string, unknown>) => void;
  children: ReactNode;
}) {
  const [pending, setPending] = useState<Record<string, unknown>>({});
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const patch = useCallback((fieldId: string, value: unknown) => {
    setPending((prev) => ({ ...prev, [fieldId]: value }));
  }, []);

  // Debounce 600ms: quando pending cambia, schedula commit.
  useEffect(() => {
    if (Object.keys(pending).length === 0) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      onCommit(pending);
      setPending({});
    }, 600);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [pending, onCommit]);

  // In editable mode mostra sempre `draftData` (così l'utente vede subito le modifiche
  // appena committate). In preview mode mostra `liveData` se presente.
  const merged = useMemo(() => {
    const source = editable
      ? item.draftData
      : (item.liveData ?? item.draftData);
    return { ...source, ...pending };
  }, [item, pending, editable]);

  const itemForBinding = useMemo<CMSItem>(
    () => ({ ...item, draftData: merged }),
    [item, merged],
  );

  const value: CmsBindingContextValue = {
    collection,
    item: itemForBinding,
    editable,
    patch,
  };
  return (
    <CmsBindingContext.Provider value={value}>
      {children}
    </CmsBindingContext.Provider>
  );
}

export function useCmsBinding(): CmsBindingContextValue | null {
  return useContext(CmsBindingContext);
}

/**
 * Hook che risolve un bindingKey contro l'item context.
 * Se non c'è context (Page normale, non template), ritorna il fallback.
 */
export function useResolveBinding<T = unknown>(
  bindingKey: string | undefined,
  fallback: T,
): T {
  const ctx = useContext(CmsBindingContext);
  if (!bindingKey) return fallback;
  if (!ctx) return fallback;
  const source = ctx.item.draftData;
  const v = source[bindingKey];
  return (v as T) ?? fallback;
}

/**
 * Tipi di field compatibili per ciascuna semantica.
 * Es. un Heading testuale può bindarsi a plain-text/rich-text/email/phone/link.
 */
export const COMPATIBLE_FIELDS_FOR: Record<
  "text" | "image" | "url",
  CMSFieldType[]
> = {
  text: ["plain-text", "rich-text", "email", "phone", "link", "video-link"],
  image: ["image"],
  url: ["link", "video-link"],
};

export function compatibleFieldOptions(
  fields: CMSField[] | undefined,
  semantic: keyof typeof COMPATIBLE_FIELDS_FOR,
) {
  if (!fields) return [];
  const allowed = new Set(COMPATIBLE_FIELDS_FOR[semantic]);
  return fields
    .filter((f) => allowed.has(f.type))
    .map((f) => ({
      label: `Get from ${f.name}`,
      value: f.id,
      typeMeta: FIELD_TYPE_REGISTRY[f.type],
    }));
}
