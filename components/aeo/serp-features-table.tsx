"use client";

import { useMemo, useState } from "react";
import { Filter, Search, Star } from "lucide-react";
import type { AeoKeywordRow } from "@/lib/seo/aeo-types";
import { cn } from "@/lib/utils";

type FeatureFilter = "all" | "owned" | "opportunity" | "none";

const FILTER_LABEL: Record<FeatureFilter, string> = {
  all: "Tutte",
  owned: "Owned",
  opportunity: "Opportunità",
  none: "Senza feature",
};

const INTENT_TONE: Record<AeoKeywordRow["intent"], string> = {
  informational: "bg-blue-400/15 text-blue-300",
  navigational: "bg-violet-400/15 text-violet-300",
  transactional: "bg-emerald-400/15 text-emerald-300",
  commercial: "bg-amber-400/15 text-amber-300",
};

const INTENT_SHORT: Record<AeoKeywordRow["intent"], string> = {
  informational: "Info",
  navigational: "Nav",
  transactional: "Trans",
  commercial: "Comm",
};

type Props = {
  keywords: AeoKeywordRow[];
  onRowClick?: (kw: AeoKeywordRow) => void;
};

function FeatureCell({
  present,
  owned,
}: {
  present: boolean | undefined;
  owned: boolean | undefined;
}) {
  if (!present) {
    return <span className="text-text-muted">—</span>;
  }
  if (owned) {
    return (
      <span className="inline-flex items-center gap-1 rounded bg-emerald-400/15 px-1.5 py-0.5 text-label-sm font-semibold text-emerald-300">
        <Star className="h-3 w-3" />
        owned
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded bg-amber-400/10 px-1.5 py-0.5 text-label-sm text-amber-200">
      presente
    </span>
  );
}

function PositionPill({ pos }: { pos: number }) {
  if (pos === 0) return <span className="text-text-muted">—</span>;
  return (
    <span
      className={cn(
        "rounded px-1.5 py-0.5 font-mono text-label-sm font-semibold",
        pos <= 3
          ? "bg-emerald-400/15 text-emerald-300"
          : pos <= 10
            ? "bg-emerald-300/10 text-emerald-200/80"
            : pos <= 20
              ? "bg-amber-300/10 text-amber-200"
              : "bg-rose-400/10 text-rose-300",
      )}
    >
      {pos}
    </span>
  );
}

function matchesFilter(kw: AeoKeywordRow, filter: FeatureFilter): boolean {
  const f = kw.features;
  const hasAnyFeature = !!(f.aiOverview || f.featuredSnippet || f.paa || f.knowledgePanel);
  const hasOwned = !!(f.aiOverviewOwner || f.featuredSnippetOwner);
  const hasOpportunity = (!!f.aiOverview && !f.aiOverviewOwner) || (!!f.featuredSnippet && !f.featuredSnippetOwner);
  switch (filter) {
    case "all":
      return true;
    case "owned":
      return hasOwned;
    case "opportunity":
      return hasOpportunity;
    case "none":
      return !hasAnyFeature;
  }
}

export function SerpFeaturesTable({ keywords, onRowClick }: Props) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FeatureFilter>("all");

  const rows = useMemo(() => {
    const q = search.toLowerCase().trim();
    return keywords.filter((kw) => {
      if (!matchesFilter(kw, filter)) return false;
      if (!q) return true;
      return kw.keyword.toLowerCase().includes(q);
    });
  }, [keywords, search, filter]);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cerca keyword…"
            className="w-full rounded-md border border-surface-container-low bg-surface-container-low/40 py-1.5 pl-8 pr-3 text-label-md text-on-surface placeholder:text-text-muted focus:border-molten-primary/50 focus:outline-none focus:ring-1 focus:ring-molten-primary/30"
          />
        </div>
        <div className="flex items-center gap-1.5">
          <Filter className="h-3.5 w-3.5 text-text-muted" />
          {(Object.keys(FILTER_LABEL) as FeatureFilter[]).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={cn(
                "rounded px-2 py-1 text-label-sm transition-colors",
                filter === f
                  ? "bg-molten-primary/20 text-molten-primary"
                  : "text-text-muted hover:bg-surface-container-low hover:text-on-surface",
              )}
            >
              {FILTER_LABEL[f]}
            </button>
          ))}
        </div>
        <span className="ml-auto text-label-sm text-text-muted">
          {rows.length} di {keywords.length} keyword
        </span>
      </div>

      <div className="overflow-hidden rounded-xl border border-surface-container-low">
        <table className="w-full text-left text-body-sm">
          <thead className="bg-surface-container-low/50 text-label-sm uppercase tracking-wider text-text-muted">
            <tr>
              <th className="px-3 py-2 font-medium">Keyword</th>
              <th className="px-3 py-2 text-right font-medium">Vol/mese</th>
              <th className="px-3 py-2 text-center font-medium">Pos</th>
              <th className="px-3 py-2 text-center font-medium">AI Overview</th>
              <th className="px-3 py-2 text-center font-medium">Featured Snippet</th>
              <th className="px-3 py-2 text-center font-medium">PAA</th>
              <th className="px-3 py-2 text-center font-medium">Ads</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="py-8 text-center text-body-sm text-text-muted"
                >
                  Nessuna keyword corrisponde ai filtri
                </td>
              </tr>
            ) : (
              rows.map((kw) => (
                <tr
                  key={kw.id}
                  onClick={onRowClick ? () => onRowClick(kw) : undefined}
                  className={cn(
                    "border-t border-surface-container-low/50",
                    onRowClick && "cursor-pointer hover:bg-surface-container-low/40",
                  )}
                >
                  <td className="max-w-[280px] px-3 py-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          "rounded px-1 py-0.5 text-[10px] font-bold uppercase",
                          INTENT_TONE[kw.intent],
                        )}
                      >
                        {INTENT_SHORT[kw.intent]}
                      </span>
                      <span className="truncate text-on-surface">
                        {kw.keyword}
                      </span>
                    </div>
                  </td>
                  <td className="px-3 py-2 text-right font-mono text-on-surface">
                    {kw.searchVolume.toLocaleString("it-IT")}
                  </td>
                  <td className="px-3 py-2 text-center">
                    <PositionPill pos={kw.position} />
                  </td>
                  <td className="px-3 py-2 text-center">
                    <FeatureCell
                      present={kw.features.aiOverview}
                      owned={kw.features.aiOverviewOwner}
                    />
                  </td>
                  <td className="px-3 py-2 text-center">
                    <FeatureCell
                      present={kw.features.featuredSnippet}
                      owned={kw.features.featuredSnippetOwner}
                    />
                  </td>
                  <td className="px-3 py-2 text-center">
                    {kw.features.paa ? (
                      <span className="inline-flex rounded bg-blue-400/10 px-1.5 py-0.5 text-label-sm text-blue-300">
                        presente
                      </span>
                    ) : (
                      <span className="text-text-muted">—</span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-center">
                    {kw.features.adsPack ? (
                      <span className="inline-flex rounded bg-rose-400/10 px-1.5 py-0.5 text-label-sm text-rose-300">
                        sì
                      </span>
                    ) : (
                      <span className="text-text-muted">—</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
