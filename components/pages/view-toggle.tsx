"use client";

import { List, LayoutGrid } from "lucide-react";
import { cn } from "@/lib/utils";

export type PagesView = "table" | "cards";

export function ViewToggle({
  value,
  onChange,
}: {
  value: PagesView;
  onChange: (v: PagesView) => void;
}) {
  return (
    <div className="inline-flex items-center gap-1 rounded-lg bg-surface-container-lowest p-1">
      <button
        type="button"
        onClick={() => onChange("table")}
        className={cn(
          "flex h-8 items-center gap-1.5 rounded-md px-2.5 text-body-sm font-medium transition-all",
          value === "table"
            ? "bg-surface-container-highest text-on-surface"
            : "text-text-muted hover:text-on-surface",
        )}
      >
        <List className="h-3.5 w-3.5" />
        Tabella
      </button>
      <button
        type="button"
        onClick={() => onChange("cards")}
        className={cn(
          "flex h-8 items-center gap-1.5 rounded-md px-2.5 text-body-sm font-medium transition-all",
          value === "cards"
            ? "bg-surface-container-highest text-on-surface"
            : "text-text-muted hover:text-on-surface",
        )}
      >
        <LayoutGrid className="h-3.5 w-3.5" />
        Card
      </button>
    </div>
  );
}
