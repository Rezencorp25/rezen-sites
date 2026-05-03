"use client";

import { useMemo, useRef, useState } from "react";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";
import { ArrowDown, ArrowUp, ArrowUpDown, Minus, Search } from "lucide-react";
import type { KeywordRank } from "@/lib/seo/rank-types";
import type { SerpFeatureFlags } from "@/lib/seo/seo-types";
import { cn } from "@/lib/utils";

type Props = {
  keywords: KeywordRank[];
  onRowClick?: (kw: KeywordRank) => void;
};

const INTENT_LABEL: Record<KeywordRank["intent"], string> = {
  informational: "Info",
  navigational: "Nav",
  transactional: "Trans",
  commercial: "Comm",
};

const INTENT_TONE: Record<KeywordRank["intent"], string> = {
  informational: "bg-blue-400/15 text-blue-300",
  navigational: "bg-violet-400/15 text-violet-300",
  transactional: "bg-emerald-400/15 text-emerald-300",
  commercial: "bg-amber-400/15 text-amber-300",
};

function formatPosition(pos: number) {
  return pos === 0 ? "—" : pos.toString();
}

function deltaSign(current: number, prev: number | null): number | null {
  if (prev === null) return null;
  if (current === 0 && prev === 0) return null;
  if (current === 0) return -1;
  if (prev === 0) return 1;
  return prev - current;
}

function DeltaCell({
  current,
  prev,
}: {
  current: number;
  prev: number | null;
}) {
  const delta = deltaSign(current, prev);
  if (delta === null) {
    return <span className="text-text-muted">—</span>;
  }
  if (delta === 0) {
    return (
      <span className="inline-flex items-center gap-0.5 text-text-muted">
        <Minus className="h-3 w-3" />
      </span>
    );
  }
  const isUp = delta > 0;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 font-mono text-label-sm",
        isUp ? "text-emerald-400" : "text-rose-400",
      )}
    >
      {isUp ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
      {Math.abs(delta)}
    </span>
  );
}

function PositionPill({ pos }: { pos: number }) {
  if (pos === 0) {
    return <span className="text-text-muted">—</span>;
  }
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

function featurePills(features: SerpFeatureFlags): string[] {
  const pills: string[] = [];
  if (features.aiOverviewOwner) pills.push("AIO ★");
  else if (features.aiOverview) pills.push("AIO");
  if (features.featuredSnippetOwner) pills.push("Snip ★");
  else if (features.featuredSnippet) pills.push("Snip");
  if (features.paa) pills.push("PAA");
  if (features.adsPack) pills.push("Ads");
  return pills;
}

function Sparkline({ history }: { history: KeywordRank["history"] }) {
  const points = useMemo(() => {
    if (history.length === 0) return "";
    // Position 0 (out of ranking) → trattalo come 100 per visualizzazione monotona
    const ys = history.map((h) => (h.position === 0 ? 101 : h.position));
    const min = Math.min(...ys);
    const max = Math.max(...ys);
    const range = max - min || 1;
    const w = 80;
    const h = 24;
    return ys
      .map((y, i) => {
        const x = (i / (ys.length - 1)) * w;
        // y inverted: top of chart = position 1 (best), bottom = worst
        const yPx = ((y - min) / range) * h;
        return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${yPx.toFixed(1)}`;
      })
      .join(" ");
  }, [history]);

  if (!points) return <span className="text-text-muted">—</span>;
  const last = history[history.length - 1];
  const first = history[0];
  const lastPos = last.position === 0 ? 101 : last.position;
  const firstPos = first.position === 0 ? 101 : first.position;
  const stroke = lastPos < firstPos ? "#34d399" : lastPos > firstPos ? "#f87171" : "#94a3b8";

  return (
    <svg
      width="80"
      height="24"
      viewBox="0 0 80 24"
      className="overflow-visible"
      aria-hidden
    >
      <path d={points} fill="none" stroke={stroke} strokeWidth={1.5} />
    </svg>
  );
}

function HostFromUrl(url: string | null) {
  if (!url) return null;
  try {
    const u = new URL(url);
    return u.host.replace(/^www\./, "") + u.pathname;
  } catch {
    return url;
  }
}

const ROW_HEIGHT = 44;

export function RankTable({ keywords, onRowClick }: Props) {
  const [sorting, setSorting] = useState<SortingState>([
    { id: "position", desc: false },
  ]);
  const [search, setSearch] = useState("");

  const columns = useMemo<ColumnDef<KeywordRank>[]>(
    () => [
      {
        accessorKey: "keyword",
        header: "Keyword",
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "rounded px-1 py-0.5 text-[10px] font-bold uppercase",
                INTENT_TONE[row.original.intent],
              )}
            >
              {INTENT_LABEL[row.original.intent]}
            </span>
            <span className="truncate text-on-surface">
              {row.original.keyword}
            </span>
          </div>
        ),
      },
      {
        accessorKey: "searchVolume",
        header: "Vol/mese",
        cell: ({ row }) => (
          <span className="font-mono text-on-surface">
            {row.original.searchVolume.toLocaleString("it-IT")}
          </span>
        ),
      },
      {
        accessorKey: "position",
        header: "Pos",
        cell: ({ row }) => <PositionPill pos={row.original.position} />,
        sortingFn: (a, b) => {
          const av = a.original.position === 0 ? 999 : a.original.position;
          const bv = b.original.position === 0 ? 999 : b.original.position;
          return av - bv;
        },
      },
      {
        id: "delta7d",
        header: "Δ 7gg",
        cell: ({ row }) => (
          <DeltaCell
            current={row.original.position}
            prev={row.original.position7dAgo}
          />
        ),
        accessorFn: (row) => deltaSign(row.position, row.position7dAgo) ?? 0,
        sortingFn: (a, b) => (a.getValue<number>("delta7d") - b.getValue<number>("delta7d")),
      },
      {
        id: "delta30d",
        header: "Δ 30gg",
        cell: ({ row }) => (
          <DeltaCell
            current={row.original.position}
            prev={row.original.position30dAgo}
          />
        ),
        accessorFn: (row) => deltaSign(row.position, row.position30dAgo) ?? 0,
        sortingFn: (a, b) => (a.getValue<number>("delta30d") - b.getValue<number>("delta30d")),
      },
      {
        id: "features",
        header: "SERP",
        enableSorting: false,
        cell: ({ row }) => {
          const pills = featurePills(row.original.features);
          if (pills.length === 0) {
            return <span className="text-text-muted">—</span>;
          }
          return (
            <div className="flex flex-wrap gap-1">
              {pills.map((p) => (
                <span
                  key={p}
                  className={cn(
                    "rounded bg-surface-container-low px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                    p.includes("★") ? "text-emerald-300" : "text-text-muted",
                  )}
                >
                  {p}
                </span>
              ))}
            </div>
          );
        },
      },
      {
        id: "sparkline",
        header: "Trend 30gg",
        enableSorting: false,
        cell: ({ row }) => <Sparkline history={row.original.history} />,
      },
      {
        id: "url",
        header: "URL ranking",
        enableSorting: false,
        cell: ({ row }) => {
          const host = HostFromUrl(row.original.url);
          if (!host) return <span className="text-text-muted">—</span>;
          return (
            <span
              className="block max-w-[200px] truncate font-mono text-label-sm text-text-muted"
              title={row.original.url ?? undefined}
            >
              {host}
            </span>
          );
        },
      },
    ],
    [],
  );

  const table = useReactTable({
    data: keywords,
    columns,
    state: { sorting, globalFilter: search },
    onSortingChange: setSorting,
    onGlobalFilterChange: setSearch,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    globalFilterFn: (row, _id, value) => {
      const q = String(value).toLowerCase().trim();
      if (!q) return true;
      return row.original.keyword.toLowerCase().includes(q);
    },
  });

  const rows = table.getRowModel().rows;

  const scrollRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 8,
  });

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
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
        <span className="text-label-sm text-text-muted">
          {rows.length} di {keywords.length} keyword
        </span>
      </div>

      <div className="rounded-xl border border-surface-container-low bg-surface-container-low/30">
        <div className="flex border-b border-surface-container-low bg-surface-container-low/50 text-label-sm uppercase tracking-wider text-text-muted">
          {table.getHeaderGroups()[0].headers.map((header, idx) => (
            <button
              type="button"
              key={header.id}
              onClick={
                header.column.getCanSort()
                  ? header.column.getToggleSortingHandler()
                  : undefined
              }
              className={cn(
                "flex items-center gap-1 px-3 py-2 text-left font-medium",
                header.column.getCanSort() &&
                  "cursor-pointer hover:text-on-surface",
                colWidth(idx),
              )}
            >
              {flexRender(header.column.columnDef.header, header.getContext())}
              {header.column.getCanSort() && (
                <SortIcon dir={header.column.getIsSorted()} />
              )}
            </button>
          ))}
        </div>

        <div
          ref={scrollRef}
          className="relative h-[520px] overflow-auto"
        >
          {rows.length === 0 ? (
            <div className="flex h-full items-center justify-center text-body-sm text-text-muted">
              Nessuna keyword corrisponde ai filtri
            </div>
          ) : (
            <div
              style={{
                height: `${virtualizer.getTotalSize()}px`,
                position: "relative",
              }}
            >
              {virtualizer.getVirtualItems().map((vRow) => {
                const row = rows[vRow.index];
                return (
                  <div
                    key={row.id}
                    className={cn(
                      "absolute left-0 top-0 flex w-full items-center border-b border-surface-container-low/50 transition-colors",
                      onRowClick && "cursor-pointer hover:bg-surface-container-low/40",
                    )}
                    style={{
                      height: `${vRow.size}px`,
                      transform: `translateY(${vRow.start}px)`,
                    }}
                    onClick={onRowClick ? () => onRowClick(row.original) : undefined}
                  >
                    {row.getVisibleCells().map((cell, idx) => (
                      <div
                        key={cell.id}
                        className={cn(
                          "px-3 py-2 text-body-sm",
                          colWidth(idx),
                        )}
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SortIcon({ dir }: { dir: false | "asc" | "desc" }) {
  if (dir === "asc") return <ArrowUp className="h-3 w-3" />;
  if (dir === "desc") return <ArrowDown className="h-3 w-3" />;
  return <ArrowUpDown className="h-3 w-3 opacity-40" />;
}

const COL_WIDTHS = [
  "flex-[2.4] min-w-0",   // keyword
  "w-24 shrink-0",         // vol
  "w-16 shrink-0",         // pos
  "w-20 shrink-0",         // d7
  "w-20 shrink-0",         // d30
  "w-32 shrink-0",         // serp
  "w-24 shrink-0",         // sparkline
  "flex-[1.6] min-w-0",   // url
];

function colWidth(idx: number) {
  return COL_WIDTHS[idx] ?? "";
}
