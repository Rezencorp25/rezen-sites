"use client";

import {
  type ClusterCount,
  type ClusterFilter,
  type RankCluster,
} from "@/lib/seo/rank-types";
import { cn } from "@/lib/utils";

const TONE: Record<RankCluster, string> = {
  top3: "bg-emerald-400",
  top10: "bg-emerald-300/70",
  top20: "bg-amber-300/70",
  top100: "bg-amber-400/40",
  beyond: "bg-rose-400/40",
};

const RING: Record<RankCluster, string> = {
  top3: "ring-emerald-400/60",
  top10: "ring-emerald-300/60",
  top20: "ring-amber-300/60",
  top100: "ring-amber-400/60",
  beyond: "ring-rose-400/60",
};

type Props = {
  data: ClusterCount[];
  active: ClusterFilter;
  onSelect: (cluster: ClusterFilter) => void;
};

export function ClusterBarChart({ data, active, onSelect }: Props) {
  const total = data.reduce((s, d) => s + d.count, 0);
  const max = data.reduce((m, d) => Math.max(m, d.count), 1);

  return (
    <div className="flex flex-col gap-2.5">
      <button
        type="button"
        onClick={() => onSelect("all")}
        className={cn(
          "flex items-center justify-between rounded-md px-2 py-1 text-left text-label-sm transition-colors",
          active === "all"
            ? "bg-surface-container-low text-on-surface ring-1 ring-on-surface/20"
            : "text-text-muted hover:bg-surface-container-low/60 hover:text-on-surface",
        )}
      >
        <span className="uppercase tracking-wider">Tutte</span>
        <span className="font-mono">{total}</span>
      </button>
      {data.map((d) => {
        const isActive = active === d.cluster;
        const widthPct = total === 0 ? 0 : (d.count / max) * 100;
        return (
          <button
            key={d.cluster}
            type="button"
            onClick={() => onSelect(isActive ? "all" : d.cluster)}
            className={cn(
              "group flex items-center gap-3 rounded-md px-2 py-1 text-left transition-colors",
              isActive
                ? cn("bg-surface-container-low ring-1", RING[d.cluster])
                : "hover:bg-surface-container-low/60",
            )}
            aria-pressed={isActive}
          >
            <span
              className={cn(
                "w-20 text-label-md transition-colors",
                isActive ? "text-on-surface" : "text-text-muted group-hover:text-on-surface",
              )}
            >
              {d.label}
            </span>
            <div className="relative h-5 flex-1 overflow-hidden rounded bg-surface-container-low">
              <div
                className={cn("h-full rounded transition-all", TONE[d.cluster])}
                style={{ width: `${Math.max(widthPct, 2)}%` }}
              />
            </div>
            <span
              className={cn(
                "w-12 text-right font-mono text-label-md transition-colors",
                isActive ? "text-on-surface" : "text-text-muted group-hover:text-on-surface",
              )}
            >
              {d.count}
            </span>
          </button>
        );
      })}
      <p className="mt-1 text-[11px] text-text-muted">
        Click su un cluster per filtrare la tabella
      </p>
    </div>
  );
}
