"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Bot,
  CheckCircle2,
  ChevronDown,
  Circle,
  CircleCheckBig,
  FileSearch,
  Globe,
  Search,
  Sparkles,
  Zap,
} from "lucide-react";
import {
  aggregateActionsAcrossProjects,
  type AggregatedActionItem,
  type ActionItem,
  type ProjectActionInput,
} from "@/lib/reports/action-items";
import { useActionsStore } from "@/lib/stores/actions-store";
import { useProjectsStore } from "@/lib/stores/projects-store";
import { useGeoStore } from "@/lib/stores/geo-store";
import { useRankStore } from "@/lib/stores/rank-store";
import { calcCitationMetrics } from "@/lib/seo/citations";
import { generateAiSearchHealthStub } from "@/lib/seo/ai-search-health-stub";
import { cn } from "@/lib/utils";
import type { GeoSnapshot } from "@/lib/seo/geo-types";
import type { RankSnapshot } from "@/lib/seo/rank-types";

type Source = ActionItem["source"];
type Filter = "all" | Source;

const SOURCE_LABEL: Record<Source, string> = {
  seo: "SEO",
  aeo: "AEO",
  geo: "GEO",
  aish: "AISH",
};

const SOURCE_ICON: Record<Source, typeof Bot> = {
  seo: Search,
  aeo: Sparkles,
  geo: Globe,
  aish: FileSearch,
};

const SOURCE_TONE: Record<Source, string> = {
  seo: "bg-blue-400/15 text-blue-300",
  aeo: "bg-fuchsia-400/15 text-fuchsia-300",
  geo: "bg-violet-400/15 text-violet-300",
  aish: "bg-cyan-400/15 text-cyan-300",
};

const SEVERITY_DOT: Record<ActionItem["severity"], string> = {
  high: "bg-rose-400",
  medium: "bg-amber-400",
  low: "bg-blue-400",
};

const SEVERITY_LABEL: Record<ActionItem["severity"], string> = {
  high: "Alta",
  medium: "Media",
  low: "Bassa",
};

const EFFORT_LABEL: Record<ActionItem["effort"], string> = {
  low: "low effort",
  medium: "medium effort",
  high: "high effort",
};

function deeplinkFor(item: AggregatedActionItem): string {
  switch (item.source) {
    case "seo":
      return `/projects/${item.projectId}/seo`;
    case "aeo":
      return `/projects/${item.projectId}/aeo`;
    case "geo":
      return `/projects/${item.projectId}/geo`;
    case "aish":
      // AISH section vive nella pagina /geo (vedi geo-client.tsx).
      return `/projects/${item.projectId}/geo#ai-search-health`;
  }
}

function buildProjectInput(
  projectId: string,
  projectName: string,
  domain: string,
  geoSnap: GeoSnapshot | undefined,
  rankSnap: RankSnapshot | undefined,
): ProjectActionInput {
  const citationMetrics = geoSnap ? calcCitationMetrics(geoSnap) : null;
  const aiSearchHealth =
    geoSnap && domain
      ? generateAiSearchHealthStub({
          projectId,
          domain,
          seedSalt: geoSnap.id,
        })
      : null;
  const topKeywords =
    rankSnap?.keywords.slice(0, 10).map((k) => ({
      keyword: k.keyword,
      position: k.position,
      prevPosition: k.position7dAgo ?? k.position30dAgo ?? null,
      searchVolume: k.searchVolume,
    })) ?? [];

  return {
    projectId,
    projectName,
    domain,
    geoSnapshot: geoSnap ?? null,
    citationMetrics,
    aiSearchHealth,
    topKeywords,
  };
}

type Props = {
  /** Modalità per-progetto: mostra solo le azioni di un singolo progetto. */
  projectId?: string;
  /** Modalità cross-progetto: mostra azioni aggregate su più progetti. */
  projectIds?: string[];
  /** Numero massimo righe (default 5 per-progetto, 10 cross). */
  maxItems?: number;
  /** Titolo override. */
  title?: string;
  /** Mostra label progetto sulle righe (default: true se cross, false se per-progetto). */
  showProjectLabel?: boolean;
  className?: string;
};

export function TodayActionsWidget({
  projectId,
  projectIds,
  maxItems,
  title,
  showProjectLabel,
  className,
}: Props) {
  const allProjects = useProjectsStore((s) => s.projects);
  const geoByProject = useGeoStore((s) => s.byProject);
  const rankByProject = useRankStore((s) => s.byProject);
  const resolvedByProject = useActionsStore((s) => s.resolvedByProject);
  const markResolved = useActionsStore((s) => s.markResolved);
  const unResolved = useActionsStore((s) => s.unResolved);

  const [filter, setFilter] = useState<Filter>("all");
  const [showResolved, setShowResolved] = useState(false);

  const isCross = !projectId && !!projectIds;
  const effectiveMax = maxItems ?? (isCross ? 10 : 5);
  const showProject = showProjectLabel ?? isCross;
  const headerTitle = title ?? (isCross ? "Today — azioni cross-cliente" : "Today — azioni prioritarie");

  const aggregated = useMemo<AggregatedActionItem[]>(() => {
    const ids = projectId ? [projectId] : projectIds ?? [];
    if (ids.length === 0) return [];
    const inputs: ProjectActionInput[] = ids
      .map((id) => {
        const p = allProjects.find((x) => x.id === id);
        if (!p) return null;
        const geo = geoByProject[id]?.[0];
        const rank = rankByProject[id]?.[0];
        return buildProjectInput(id, p.name, p.domain, geo, rank);
      })
      .filter((x): x is ProjectActionInput => x !== null);
    return aggregateActionsAcrossProjects(inputs, 100);
  }, [projectId, projectIds, allProjects, geoByProject, rankByProject]);

  const counts = useMemo(() => {
    const c: Record<Source, number> = { seo: 0, aeo: 0, geo: 0, aish: 0 };
    for (const a of aggregated) c[a.source]++;
    return c;
  }, [aggregated]);

  const filteredAll = useMemo(() => {
    return aggregated.filter((a) => {
      if (filter !== "all" && a.source !== filter) return false;
      const isRes = resolvedByProject[a.projectId]?.includes(a.key) ?? false;
      if (isRes && !showResolved) return false;
      return true;
    });
  }, [aggregated, filter, resolvedByProject, showResolved]);

  const visible = filteredAll.slice(0, effectiveMax);
  const totalUnresolved = aggregated.filter((a) => !(resolvedByProject[a.projectId]?.includes(a.key))).length;

  return (
    <section
      className={cn(
        "flex flex-col rounded-xl bg-surface-container-high",
        className,
      )}
    >
      <header className="flex flex-wrap items-center gap-3 px-5 pt-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-molten-primary/15">
          <Zap className="h-4 w-4 text-molten-primary" />
        </div>
        <div className="flex flex-col">
          <h3 className="text-title-md font-semibold text-on-surface">
            {headerTitle}
          </h3>
          <span className="text-label-sm text-text-muted">
            {totalUnresolved} azione{totalUnresolved === 1 ? "" : "i"} aperte ·{" "}
            top {Math.min(visible.length, effectiveMax)} per impact
          </span>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <FilterDropdown
            value={filter}
            counts={counts}
            onChange={setFilter}
          />
          <button
            type="button"
            onClick={() => setShowResolved((v) => !v)}
            className={cn(
              "flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-label-sm font-medium transition-colors",
              showResolved
                ? "bg-emerald-400/15 text-emerald-300"
                : "bg-surface-container-low text-text-muted hover:text-on-surface",
            )}
            title={showResolved ? "Nascondi risolte" : "Mostra anche risolte"}
          >
            <CircleCheckBig className="h-3 w-3" />
            Risolte
          </button>
        </div>
      </header>

      <div className="px-3 pb-3 pt-3">
        {visible.length === 0 ? (
          <EmptyState
            hasAny={aggregated.length > 0}
            allResolved={aggregated.length > 0 && totalUnresolved === 0}
          />
        ) : (
          <ul className="flex flex-col gap-1.5">
            {visible.map((item) => {
              const isResolved =
                resolvedByProject[item.projectId]?.includes(item.key) ?? false;
              return (
                <ActionRow
                  key={`${item.projectId}__${item.key}`}
                  item={item}
                  showProject={showProject}
                  isResolved={isResolved}
                  onToggleResolved={() => {
                    if (isResolved) unResolved(item.projectId, item.key);
                    else markResolved(item.projectId, item.key);
                  }}
                />
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}

function ActionRow({
  item,
  showProject,
  isResolved,
  onToggleResolved,
}: {
  item: AggregatedActionItem;
  showProject: boolean;
  isResolved: boolean;
  onToggleResolved: () => void;
}) {
  const Icon = SOURCE_ICON[item.source];
  const href = deeplinkFor(item);
  return (
    <li
      className={cn(
        "group flex items-center gap-3 rounded-md px-3 py-2.5 transition-colors",
        isResolved
          ? "bg-surface-container-low/30 opacity-60"
          : "bg-surface-container-low/50 hover:bg-surface-container-low",
      )}
    >
      <button
        type="button"
        onClick={onToggleResolved}
        title={isResolved ? "Marca come aperta" : "Marca come risolta"}
        className="shrink-0 text-text-muted transition-colors hover:text-emerald-400"
      >
        {isResolved ? (
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
        ) : (
          <Circle className="h-4 w-4" />
        )}
      </button>
      <span
        className={cn(
          "h-2 w-2 shrink-0 rounded-full",
          SEVERITY_DOT[item.severity],
        )}
        title={`Severity: ${SEVERITY_LABEL[item.severity]}`}
      />
      <span
        className={cn(
          "flex shrink-0 items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider",
          SOURCE_TONE[item.source],
        )}
      >
        <Icon className="h-3 w-3" />
        {SOURCE_LABEL[item.source]}
      </span>
      <Link
        href={href}
        className={cn(
          "flex min-w-0 flex-1 flex-col gap-0.5",
          isResolved && "line-through",
        )}
      >
        <span className="truncate text-body-sm font-medium text-on-surface group-hover:text-molten-primary">
          {item.title}
        </span>
        <span className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-label-sm text-text-muted">
          {showProject && (
            <span className="font-mono">
              {item.projectName} · {item.domain}
            </span>
          )}
          <span>{EFFORT_LABEL[item.effort]}</span>
        </span>
      </Link>
      <Link
        href={href}
        className="shrink-0 text-text-muted transition-colors group-hover:text-molten-primary"
        aria-label="Apri modulo"
      >
        <ArrowRight className="h-4 w-4" />
      </Link>
    </li>
  );
}

function FilterDropdown({
  value,
  counts,
  onChange,
}: {
  value: Filter;
  counts: Record<Source, number>;
  onChange: (v: Filter) => void;
}) {
  const [open, setOpen] = useState(false);
  const total = counts.seo + counts.aeo + counts.geo + counts.aish;
  const label =
    value === "all" ? `Tutti (${total})` : `${SOURCE_LABEL[value]} (${counts[value]})`;
  const options: Filter[] = ["all", "seo", "aeo", "geo", "aish"];

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 rounded-md bg-surface-container-low px-2.5 py-1.5 text-label-sm text-on-surface hover:bg-surface-container-lowest"
      >
        {label}
        <ChevronDown className="h-3 w-3" />
      </button>
      {open && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <ul className="absolute right-0 z-20 mt-1 flex min-w-[160px] flex-col rounded-md bg-surface-container-highest p-1 shadow-lg">
            {options.map((opt) => {
              const isSel = opt === value;
              const optCount = opt === "all" ? total : counts[opt];
              return (
                <li key={opt}>
                  <button
                    type="button"
                    onClick={() => {
                      onChange(opt);
                      setOpen(false);
                    }}
                    className={cn(
                      "flex w-full items-center justify-between gap-3 rounded px-2.5 py-1.5 text-left text-label-sm transition-colors",
                      isSel
                        ? "bg-molten-primary/15 text-molten-primary"
                        : "text-on-surface hover:bg-surface-container-low",
                    )}
                  >
                    <span>{opt === "all" ? "Tutti" : SOURCE_LABEL[opt]}</span>
                    <span className="font-mono text-text-muted">{optCount}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}

function EmptyState({
  hasAny,
  allResolved,
}: {
  hasAny: boolean;
  allResolved: boolean;
}) {
  if (allResolved) {
    return (
      <div className="flex items-center justify-center gap-2 rounded-md bg-emerald-400/10 px-4 py-6 text-body-sm text-emerald-300">
        <CheckCircle2 className="h-4 w-4" />
        Tutte le azioni sono risolte. Ottimo lavoro.
      </div>
    );
  }
  if (!hasAny) {
    return (
      <div className="flex flex-col items-center gap-1.5 rounded-md bg-surface-container-low/40 px-4 py-6 text-center">
        <CheckCircle2 className="h-6 w-6 text-emerald-400" />
        <p className="text-body-sm font-semibold text-on-surface">
          Nessuna azione critica oggi
        </p>
        <p className="text-label-sm text-text-muted">
          Tutti i moduli SEO/AEO/GEO/AISH sono entro le soglie target.
        </p>
      </div>
    );
  }
  return (
    <div className="flex items-center justify-center gap-2 rounded-md bg-surface-container-low/40 px-4 py-6 text-body-sm text-text-muted">
      Nessuna azione corrispondente al filtro selezionato.
    </div>
  );
}
