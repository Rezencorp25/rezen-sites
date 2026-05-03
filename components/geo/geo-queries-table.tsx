"use client";

import { useMemo, useState } from "react";
import { Filter, Search, Star } from "lucide-react";
import {
  ALL_LLMS,
  GEO_CATEGORY_LABEL,
  GEO_LLM_LABEL,
  type GeoLlmId,
  type GeoQuery,
  type GeoQueryCategory,
} from "@/lib/seo/geo-types";
import { cn } from "@/lib/utils";

type Filt = "all" | "mentioned" | "missing";
const FILTER_LABEL: Record<Filt, string> = {
  all: "Tutte",
  mentioned: "Citato (almeno 1 LLM)",
  missing: "Non citato (0 LLM)",
};

const CATEGORY_TONE: Record<GeoQueryCategory, string> = {
  recommendation: "bg-emerald-400/15 text-emerald-300",
  comparison: "bg-amber-400/15 text-amber-300",
  definition: "bg-blue-400/15 text-blue-300",
  howto: "bg-violet-400/15 text-violet-300",
  ranking: "bg-rose-400/15 text-rose-300",
};

const CATEGORY_SHORT: Record<GeoQueryCategory, string> = {
  recommendation: "Sugg",
  comparison: "Conf",
  definition: "Def",
  howto: "How",
  ranking: "Rank",
};

function MentionCell({
  mentioned,
  rank,
}: {
  mentioned: boolean;
  rank: number | null;
}) {
  if (!mentioned) return <span className="text-text-muted">—</span>;
  return (
    <span className="inline-flex items-center gap-1 rounded bg-emerald-400/15 px-1.5 py-0.5 text-label-sm font-semibold text-emerald-300">
      <Star className="h-3 w-3" />#{rank ?? "?"}
    </span>
  );
}

function countMentions(q: GeoQuery): number {
  let c = 0;
  for (const llm of ALL_LLMS) if (q.mentions[llm]?.mentioned) c++;
  return c;
}

type Props = {
  queries: GeoQuery[];
  onRowClick?: (q: GeoQuery) => void;
};

export function GeoQueriesTable({ queries, onRowClick }: Props) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filt>("all");

  const rows = useMemo(() => {
    const q = search.toLowerCase().trim();
    return queries.filter((row) => {
      const mentions = countMentions(row);
      if (filter === "mentioned" && mentions === 0) return false;
      if (filter === "missing" && mentions > 0) return false;
      if (!q) return true;
      return row.query.toLowerCase().includes(q);
    });
  }, [queries, search, filter]);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative max-w-xs flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cerca query…"
            className="w-full rounded-md border border-surface-container-low bg-surface-container-low/40 py-1.5 pl-8 pr-3 text-label-md text-on-surface placeholder:text-text-muted focus:border-molten-primary/50 focus:outline-none focus:ring-1 focus:ring-molten-primary/30"
          />
        </div>
        <div className="flex items-center gap-1.5">
          <Filter className="h-3.5 w-3.5 text-text-muted" />
          {(Object.keys(FILTER_LABEL) as Filt[]).map((f) => (
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
          {rows.length} di {queries.length} query
        </span>
      </div>

      <div className="overflow-hidden rounded-xl border border-surface-container-low">
        <table className="w-full text-left text-body-sm">
          <thead className="bg-surface-container-low/50 text-label-sm uppercase tracking-wider text-text-muted">
            <tr>
              <th className="px-3 py-2 font-medium">Query</th>
              <th className="px-3 py-2 text-right font-medium">Vol/mese</th>
              {ALL_LLMS.map((llm) => (
                <th key={llm} className="px-3 py-2 text-center font-medium">
                  {GEO_LLM_LABEL[llm]}
                </th>
              ))}
              <th className="px-3 py-2 text-center font-medium">Mention</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={3 + ALL_LLMS.length}
                  className="py-8 text-center text-body-sm text-text-muted"
                >
                  Nessuna query corrisponde ai filtri
                </td>
              </tr>
            ) : (
              rows.map((q) => {
                const total = countMentions(q);
                return (
                  <tr
                    key={q.id}
                    onClick={onRowClick ? () => onRowClick(q) : undefined}
                    className={cn(
                      "border-t border-surface-container-low/50",
                      onRowClick &&
                        "cursor-pointer hover:bg-surface-container-low/40",
                    )}
                  >
                    <td className="max-w-[420px] px-3 py-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            "rounded px-1 py-0.5 text-[10px] font-bold uppercase",
                            CATEGORY_TONE[q.category],
                          )}
                          title={GEO_CATEGORY_LABEL[q.category]}
                        >
                          {CATEGORY_SHORT[q.category]}
                        </span>
                        <span className="truncate text-on-surface">
                          {q.query}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-2 text-right font-mono text-on-surface">
                      {q.searchVolume.toLocaleString("it-IT")}
                    </td>
                    {ALL_LLMS.map((llm) => {
                      const m = q.mentions[llm];
                      return (
                        <td key={llm} className="px-3 py-2 text-center">
                          <MentionCell
                            mentioned={!!m?.mentioned}
                            rank={m?.rank ?? null}
                          />
                        </td>
                      );
                    })}
                    <td className="px-3 py-2 text-center">
                      <span
                        className={cn(
                          "rounded px-1.5 py-0.5 font-mono text-label-sm font-semibold",
                          total >= 3
                            ? "bg-emerald-400/15 text-emerald-300"
                            : total >= 1
                              ? "bg-amber-300/10 text-amber-200"
                              : "bg-rose-400/10 text-rose-300",
                        )}
                      >
                        {total}/{ALL_LLMS.length}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function countQueryMentions(q: GeoQuery): number {
  return countMentions(q);
}
