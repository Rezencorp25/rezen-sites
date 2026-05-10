"use client";

import { useMemo } from "react";
import {
  ALL_FIELD_TYPES,
  FIELD_TYPE_REGISTRY,
  FIELD_GROUP_LABELS_IT,
} from "@/lib/cms/field-types";
import type { CMSFieldType } from "@/types";
import { cn } from "@/lib/utils";

const GROUP_ORDER: Array<
  "Basic" | "Media" | "Contact" | "Numeric" | "Choice" | "Relation"
> = ["Basic", "Media", "Contact", "Numeric", "Choice", "Relation"];

export function FieldTypePicker({
  onPick,
  onCancel,
}: {
  onPick: (type: CMSFieldType) => void;
  onCancel?: () => void;
}) {
  const grouped = useMemo(() => {
    const buckets = new Map<string, CMSFieldType[]>();
    for (const t of ALL_FIELD_TYPES) {
      const g = FIELD_TYPE_REGISTRY[t].groupLabel;
      const arr = buckets.get(g) ?? [];
      arr.push(t);
      buckets.set(g, arr);
    }
    return buckets;
  }, []);

  return (
    <div className="rounded-xl bg-surface-container-high p-5">
      <div className="mb-3 flex items-center justify-between">
        <h4 className="text-title-sm font-semibold text-on-surface">
          Scegli il tipo di campo
        </h4>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="text-label-md uppercase tracking-widest text-text-muted hover:text-on-surface"
          >
            × Annulla
          </button>
        )}
      </div>

      <div className="flex flex-col gap-4">
        {GROUP_ORDER.map((group) => {
          const items = grouped.get(group);
          if (!items || items.length === 0) return null;
          return (
            <div key={group} className="flex flex-col gap-2">
              <span className="text-label-sm uppercase tracking-widest text-text-muted">
                {FIELD_GROUP_LABELS_IT[group]}
              </span>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
                {items.map((t) => {
                  const meta = FIELD_TYPE_REGISTRY[t];
                  const Icon = meta.icon;
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => onPick(t)}
                      className={cn(
                        "group flex flex-col items-center justify-center gap-2 rounded-lg bg-surface-container-lowest px-3 py-4 transition-colors",
                        "hover:bg-surface-container hover:ring-1 hover:ring-molten-primary",
                      )}
                      title={meta.description}
                    >
                      <Icon className="h-5 w-5 text-molten-primary" />
                      <span className="text-body-sm font-medium text-on-surface">
                        {meta.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
