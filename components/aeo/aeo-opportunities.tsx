"use client";

import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, Filter, Star, TrendingUp } from "lucide-react";
import type { AeoOpportunity } from "@/lib/seo/aeo-types";
import { cn } from "@/lib/utils";

type FeatureFilter = "all" | "aiOverview" | "featuredSnippet";
type SortKey = "score" | "volume" | "probability" | "position";

const FEATURE_LABEL: Record<AeoOpportunity["feature"], string> = {
  aiOverview: "AI Overview",
  featuredSnippet: "Featured Snippet",
};

const FEATURE_TONE: Record<AeoOpportunity["feature"], string> = {
  aiOverview: "bg-emerald-400/15 text-emerald-300",
  featuredSnippet: "bg-blue-400/15 text-blue-300",
};

const FILTER_OPTIONS: { value: FeatureFilter; label: string }[] = [
  { value: "all", label: "Tutte" },
  { value: "aiOverview", label: "Solo AIO" },
  { value: "featuredSnippet", label: "Solo Snippet" },
];

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "score", label: "Score" },
  { value: "volume", label: "Volume" },
  { value: "probability", label: "Probabilità" },
  { value: "position", label: "Posizione" },
];

type Props = {
  opportunities: AeoOpportunity[];
  onSelect?: (op: AeoOpportunity) => void;
};

export function AeoOpportunities({ opportunities, onSelect }: Props) {
  const [feature, setFeature] = useState<FeatureFilter>("all");
  const [sortKey, setSortKey] = useState<SortKey>("score");
  const [sortDesc, setSortDesc] = useState(true);

  const filtered = useMemo(() => {
    const list =
      feature === "all"
        ? opportunities
        : opportunities.filter((o) => o.feature === feature);

    const sorted = [...list].sort((a, b) => {
      let av: number;
      let bv: number;
      switch (sortKey) {
        case "score":
          av = a.score;
          bv = b.score;
          break;
        case "volume":
          av = a.searchVolume;
          bv = b.searchVolume;
          break;
        case "probability":
          av = a.winProbability;
          bv = b.winProbability;
          break;
        case "position":
          // posizione 0 = fuori top 100, mettila in fondo per asc
          av = a.position === 0 ? 999 : a.position;
          bv = b.position === 0 ? 999 : b.position;
          break;
      }
      return sortDesc ? bv - av : av - bv;
    });
    return sorted;
  }, [opportunities, feature, sortKey, sortDesc]);

  if (opportunities.length === 0) {
    return (
      <p className="rounded-md bg-surface-container-low/40 p-4 text-center text-body-sm text-text-muted">
        Nessuna opportunità aperta — il cliente possiede già tutte le SERP feature presenti 🌟
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1">
          <Filter className="h-3.5 w-3.5 text-text-muted" />
          {FILTER_OPTIONS.map((o) => (
            <button
              key={o.value}
              type="button"
              onClick={() => setFeature(o.value)}
              className={cn(
                "rounded px-2 py-1 text-label-sm transition-colors",
                feature === o.value
                  ? "bg-molten-primary/20 text-molten-primary"
                  : "text-text-muted hover:bg-surface-container-low hover:text-on-surface",
              )}
            >
              {o.label}
            </button>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-2">
          <span className="text-label-sm text-text-muted">Ordina per</span>
          <select
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value as SortKey)}
            className="rounded border border-surface-container-low bg-surface-container-low/40 px-2 py-1 text-label-sm text-on-surface focus:border-molten-primary/50 focus:outline-none"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => setSortDesc((v) => !v)}
            className="rounded p-1 text-text-muted hover:bg-surface-container-low hover:text-on-surface"
            title={sortDesc ? "Discendente" : "Ascendente"}
          >
            {sortDesc ? (
              <ArrowDown className="h-3.5 w-3.5" />
            ) : (
              <ArrowUp className="h-3.5 w-3.5" />
            )}
          </button>
        </div>
      </div>

      <span className="text-label-sm text-text-muted">
        {filtered.length} opportunit{filtered.length === 1 ? "à" : "à"} visualizzate
      </span>

      <ul className="flex flex-col gap-2">
        {filtered.map((op) => (
          <li key={`${op.keywordId}-${op.feature}`}>
            <button
              type="button"
              onClick={() => onSelect?.(op)}
              className={cn(
                "flex w-full flex-col gap-1.5 rounded-md bg-surface-container-low/40 px-3 py-2.5 text-left transition-colors",
                onSelect && "hover:bg-surface-container-low/70",
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="truncate text-body-sm text-on-surface" title={op.keyword}>
                  {op.keyword}
                </span>
                <span
                  className={cn(
                    "shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                    FEATURE_TONE[op.feature],
                  )}
                >
                  {FEATURE_LABEL[op.feature]}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3 text-label-sm">
                <div className="flex items-center gap-3 text-text-muted">
                  <span>
                    Vol{" "}
                    <span className="font-mono text-on-surface">
                      {op.searchVolume.toLocaleString("it-IT")}
                    </span>
                  </span>
                  <span>
                    Pos{" "}
                    <span className="font-mono text-on-surface">
                      {op.position === 0 ? "—" : op.position}
                    </span>
                  </span>
                  <span className="flex items-center gap-1">
                    <Star className="h-3 w-3 text-amber-400" />
                    Win{" "}
                    <span className="font-mono text-on-surface">
                      {(op.winProbability * 100).toFixed(0)}%
                    </span>
                  </span>
                </div>
                <span className="flex items-center gap-1 font-mono text-text-muted">
                  <TrendingUp className="h-3 w-3 text-molten-primary" />
                  score{" "}
                  <span className="font-semibold text-molten-primary">
                    {op.score.toFixed(0)}
                  </span>
                </span>
              </div>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
