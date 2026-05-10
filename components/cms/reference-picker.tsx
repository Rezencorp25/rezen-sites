"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Search, X, Database, RefreshCw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useCMSStore } from "@/lib/stores/cms-store";
import type { CMSItem } from "@/types";

const PAGE_SIZE = 50;

type Option = { id: string; label: string };

function itemToOption(it: CMSItem): Option {
  const data = it.liveData ?? it.draftData;
  const label = String(data.name ?? data.title ?? it.id);
  return { id: it.id, label };
}

export function ReferencePicker({
  targetCollectionId,
  projectId,
  selected,
  excludeId,
  onSelect,
  onClear,
  placeholder,
}: {
  targetCollectionId: string;
  projectId: string;
  selected: string | null;
  excludeId?: string;
  onSelect: (id: string) => void;
  onClear?: () => void;
  placeholder?: string;
}) {
  const allCollections = useCMSStore((s) => s.collections);
  const allItems = useCMSStore((s) => s.items);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [changing, setChanging] = useState(false);
  const [page, setPage] = useState(0);
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  const target = allCollections.find((c) => c.id === targetCollectionId);

  const targetItems = useMemo(
    () =>
      allItems.filter(
        (i) => i.collectionId === targetCollectionId && i.projectId === projectId,
      ),
    [allItems, targetCollectionId, projectId],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return targetItems
      .map(itemToOption)
      .filter((o) => o.id !== excludeId)
      .filter((o) => (q ? o.label.toLowerCase().includes(q) : true));
  }, [targetItems, query, excludeId]);

  const total = filtered.length;
  const visible = filtered.slice(0, (page + 1) * PAGE_SIZE);
  const hasMore = total > visible.length;

  const selectedOption = useMemo(() => {
    if (!selected) return null;
    const it = targetItems.find((i) => i.id === selected);
    return it ? itemToOption(it) : { id: selected, label: selected };
  }, [selected, targetItems]);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (!wrapperRef.current) return;
      if (!wrapperRef.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  return (
    <div ref={wrapperRef} className="relative flex flex-col gap-2">
      {selectedOption && !changing ? (
        <div className="flex items-center justify-between rounded-lg bg-surface-container-low px-3 py-2.5">
          <div className="flex items-center gap-2 truncate">
            <Database className="h-3.5 w-3.5 text-molten-primary" />
            <span className="truncate text-body-sm text-on-surface">
              {selectedOption.label}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => {
                setChanging(true);
                setQuery("");
                setOpen(true);
              }}
              className="flex items-center gap-1 rounded-md px-2 py-1 text-label-sm text-molten-primary hover:bg-surface-container"
              aria-label="Cambia riferimento"
            >
              <RefreshCw className="h-3 w-3" />
              Cambia
            </button>
            {onClear && (
              <button
                type="button"
                onClick={onClear}
                className="text-label-md text-text-muted hover:text-on-surface"
                aria-label="Rimuovi riferimento"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-muted" />
          <Input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(0);
            }}
            onFocus={() => setOpen(true)}
            placeholder={
              placeholder ?? `Cerca ${target?.singularName ?? "item"}…`
            }
            className="h-10 bg-surface-container-low border-none pl-9"
            autoFocus={changing}
          />
          {changing && selectedOption && (
            <button
              type="button"
              onClick={() => {
                setChanging(false);
                setOpen(false);
                setQuery("");
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-label-sm text-text-muted hover:text-on-surface"
            >
              Annulla
            </button>
          )}
        </div>
      )}

      {open && (!selectedOption || changing) && (
        <div className="absolute left-0 right-0 top-full z-30 mt-1 max-h-72 overflow-auto rounded-lg bg-surface-container-highest p-1 shadow-lg ring-1 ring-outline-variant/30">
          {visible.length === 0 ? (
            <p className="px-3 py-3 text-body-sm text-text-muted">
              Nessun {target?.singularName ?? "item"} trovato.
            </p>
          ) : (
            <>
              {visible.map((o) => (
                <button
                  key={o.id}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    onSelect(o.id);
                    setOpen(false);
                    setChanging(false);
                    setQuery("");
                  }}
                  className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-body-sm text-on-surface hover:bg-surface-container"
                >
                  <Database className="h-3 w-3 text-molten-primary" />
                  {o.label}
                </button>
              ))}
              {hasMore && (
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => setPage((p) => p + 1)}
                  className="w-full rounded-md px-3 py-2 text-label-md uppercase tracking-widest text-text-muted hover:bg-surface-container"
                >
                  Carica altri ({total - visible.length})
                </button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
