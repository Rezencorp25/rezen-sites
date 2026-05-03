"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Globe,
  HelpCircle,
  Loader2,
  RefreshCw,
  TrendingUp,
  Trophy,
} from "lucide-react";
import { toast } from "sonner";
import { useProjectsStore } from "@/lib/stores/projects-store";
import {
  ensureGeoBootstrap,
  refreshGeoSnapshot,
  useGeoStore,
} from "@/lib/stores/geo-store";
import { AiVisibilityRing } from "@/components/geo/ai-visibility-ring";
import { LlmCards } from "@/components/geo/llm-cards";
import { GeoTrendChart } from "@/components/geo/geo-trend-chart";
import { GeoQueriesTable } from "@/components/geo/geo-queries-table";
import { GeoQueryModal } from "@/components/geo/geo-query-modal";
import { generateGeoDrill } from "@/lib/seo/geo-stub";
import type { GeoQuery, GeoTrendPoint } from "@/lib/seo/geo-types";
import { cn } from "@/lib/utils";

const EMPTY_TREND: GeoTrendPoint[] = [];

export default function GeoPageClient({ projectId }: { projectId: string }) {
  const project = useProjectsStore((s) => s.getById(projectId));
  const snapshot = useGeoStore((s) => s.byProject[projectId]?.[0]);
  const trendRaw = useGeoStore((s) => s.trendByProject[projectId]);
  const trend = trendRaw ?? EMPTY_TREND;
  const [running, setRunning] = useState(false);
  const [selected, setSelected] = useState<GeoQuery | null>(null);

  const domain = project?.domain ?? "";

  useEffect(() => {
    if (!domain) return;
    ensureGeoBootstrap({ projectId, domain });
  }, [projectId, domain]);

  const drill = useMemo(() => {
    if (!selected || !domain) return null;
    return generateGeoDrill({
      projectId,
      query: selected,
      ownerDomain: domain,
    });
  }, [selected, projectId, domain]);

  if (!project) {
    return (
      <div className="p-10 text-body-md text-text-muted">
        Progetto non trovato.
      </div>
    );
  }

  if (!snapshot) {
    return (
      <div className="flex h-full items-center justify-center p-10">
        <div className="flex items-center gap-3 text-body-sm text-text-muted">
          <Loader2 className="h-4 w-4 animate-spin" />
          Caricamento snapshot GEO…
        </div>
      </div>
    );
  }

  const handleRefresh = async () => {
    setRunning(true);
    try {
      await refreshGeoSnapshot({ projectId, domain });
      toast.success("GEO snapshot aggiornato");
    } catch {
      toast.error("Errore aggiornamento GEO");
    } finally {
      setRunning(false);
    }
  };

  const totalMentions = Object.values(snapshot.perLlm).reduce(
    (s, c) => s + c.mentioned,
    0,
  );
  const totalSlots = Object.values(snapshot.perLlm).reduce(
    (s, c) => s + c.total,
    0,
  );

  return (
    <div className="flex h-full flex-col gap-6 px-10 py-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-molten-primary" />
            <h1 className="text-headline-md font-bold text-on-surface">GEO</h1>
            <span className="text-label-md text-text-muted">{domain}</span>
            {snapshot.source === "stub" && (
              <span className="rounded-full bg-surface-container-low px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-text-muted">
                STUB
              </span>
            )}
          </div>
          <p className="text-body-sm text-secondary-text">
            Generative Engine Optimization — visibilità su ChatGPT, Perplexity,
            Gemini, Claude. Snapshot{" "}
            <span className="font-mono text-on-surface">
              {snapshot.createdAt.toLocaleString("it-IT")}
            </span>
          </p>
        </div>
        <button
          type="button"
          onClick={handleRefresh}
          disabled={running}
          className={cn(
            "flex items-center gap-2 rounded-md px-3.5 py-2 text-label-md font-medium transition-colors",
            running
              ? "cursor-not-allowed bg-surface-container-low text-text-muted"
              : "bg-molten-primary/15 text-molten-primary hover:bg-molten-primary/25",
          )}
        >
          {running ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <RefreshCw className="h-3.5 w-3.5" />
          )}
          Aggiorna snapshot
        </button>
      </header>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-xl bg-surface-container-high p-5 lg:col-span-1">
          <div className="mb-3 flex items-center gap-2">
            <Globe className="h-4 w-4 text-molten-primary" />
            <h2 className="text-title-sm font-semibold text-on-surface">
              AI Visibility Score
            </h2>
            <button
              type="button"
              className="text-text-muted hover:text-on-surface"
              title="Media degli score per-LLM. Score per-LLM = (query con menzione) / (query totali) × 100"
            >
              <HelpCircle className="h-3 w-3" />
            </button>
          </div>
          <AiVisibilityRing
            score={snapshot.visibilityScore}
            prevScore={snapshot.prevVisibilityScore}
            size="lg"
          />
        </div>

        <div className="lg:col-span-2">
          <LlmCards perLlm={snapshot.perLlm} />
        </div>
      </section>

      <section className="rounded-xl bg-surface-container-high p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-title-md font-semibold text-on-surface">
            <TrendingUp className="h-4 w-4 text-molten-primary" />
            Trend visibilità 30 giorni
          </h2>
          <span className="text-label-sm text-text-muted">
            Visibility globale + score per LLM
          </span>
        </div>
        <GeoTrendChart data={trend} />
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-xl bg-surface-container-high p-5 lg:col-span-2">
          <h2 className="mb-4 flex items-center gap-2 text-title-md font-semibold text-on-surface">
            <Globe className="h-4 w-4 text-molten-primary" />
            Query monitorate
            <span className="text-label-sm font-normal text-text-muted">
              ({snapshot.queries.length} totali · {totalMentions}/{totalSlots}{" "}
              mention cross-LLM)
            </span>
          </h2>
          <GeoQueriesTable
            queries={snapshot.queries}
            onRowClick={setSelected}
          />
        </div>

        <div className="rounded-xl bg-surface-container-high p-5">
          <h2 className="mb-4 flex items-center gap-2 text-title-md font-semibold text-on-surface">
            <Trophy className="h-4 w-4 text-amber-400" />
            Top competitor
            <span className="text-label-sm font-normal text-text-muted">
              ({snapshot.competitors.length})
            </span>
          </h2>
          {snapshot.competitors.length === 0 ? (
            <p className="text-body-sm text-text-muted">
              Nessun competitor citato nelle risposte LLM.
            </p>
          ) : (
            <ol className="flex flex-col gap-2">
              {snapshot.competitors.map((c, i) => (
                <li
                  key={c.domain}
                  className="flex items-center justify-between rounded-md bg-surface-container-low px-3 py-2"
                >
                  <div className="flex items-center gap-2 truncate">
                    <span className="w-5 font-mono text-label-sm text-text-muted">
                      #{i + 1}
                    </span>
                    <span className="truncate text-body-sm text-on-surface">
                      {c.domain}
                    </span>
                  </div>
                  <div className="flex shrink-0 items-center gap-3 text-label-sm">
                    <span className="text-text-muted">
                      mention{" "}
                      <span className="font-mono font-semibold text-on-surface">
                        {c.mentionCount}
                      </span>
                    </span>
                    <span className="text-text-muted">
                      rank{" "}
                      <span className="font-mono font-semibold text-on-surface">
                        {c.avgRank.toFixed(1)}
                      </span>
                    </span>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </div>
      </section>

      <p className="text-label-sm text-text-muted">
        ★ Le query sono prompt-style longer-tail. Cadenza fetch settimanale (LLM
        Mentions API è più lenta e costosa di SERP). Click su una riga della
        tabella per il drill: risposte LLM affiancate, sentiment, gap analysis e
        suggerimenti azione.
      </p>

      <GeoQueryModal
        query={selected}
        drill={drill}
        open={!!selected}
        onClose={() => setSelected(null)}
      />
    </div>
  );
}
