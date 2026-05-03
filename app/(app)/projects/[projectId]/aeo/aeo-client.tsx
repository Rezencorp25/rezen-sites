"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowDownRight,
  ArrowUpRight,
  HelpCircle,
  Loader2,
  RefreshCw,
  Sparkles,
  Target,
  TrendingUp,
} from "lucide-react";
import { toast } from "sonner";
import { useProjectsStore } from "@/lib/stores/projects-store";
import {
  ensureAeoBootstrap,
  refreshAeoSnapshot,
  useAeoStore,
} from "@/lib/stores/aeo-store";
import { SerpFeaturesTable } from "@/components/aeo/serp-features-table";
import { AeoTrendChart } from "@/components/aeo/aeo-trend-chart";
import { AeoOpportunities } from "@/components/aeo/aeo-opportunities";
import { SerpFeatureModal } from "@/components/aeo/serp-feature-modal";
import { generateAeoDrill } from "@/lib/seo/aeo-stub";
import type { AeoKeywordRow } from "@/lib/seo/aeo-types";
import { cn } from "@/lib/utils";

function scoreTone(score: number): "good" | "warn" | "poor" {
  if (score >= 50) return "good";
  if (score >= 20) return "warn";
  return "poor";
}

const TONE_TEXT: Record<"good" | "warn" | "poor", string> = {
  good: "text-emerald-400",
  warn: "text-amber-400",
  poor: "text-rose-400",
};

export default function AeoPageClient({ projectId }: { projectId: string }) {
  const project = useProjectsStore((s) => s.getById(projectId));
  const snapshot = useAeoStore((s) => s.byProject[projectId]?.[0]);
  const trend = useAeoStore((s) => s.trendByProject[projectId] ?? []);
  const [running, setRunning] = useState(false);
  const [selected, setSelected] = useState<AeoKeywordRow | null>(null);

  const domain = project?.domain ?? "";

  useEffect(() => {
    if (!domain) return;
    ensureAeoBootstrap({ projectId, domain });
  }, [projectId, domain]);

  const drill = useMemo(() => {
    if (!selected) return null;
    return generateAeoDrill({ projectId, keyword: selected });
  }, [selected, projectId]);

  const handleOpportunityClick = useMemo(
    () => (opKeywordId: string) => {
      const kw = snapshot?.keywords.find((k) => k.id === opKeywordId);
      if (kw) setSelected(kw);
    },
    [snapshot],
  );

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
          Caricamento snapshot AEO…
        </div>
      </div>
    );
  }

  const tone = scoreTone(snapshot.aeoScore);
  const delta =
    snapshot.prevAeoScore !== null
      ? snapshot.aeoScore - snapshot.prevAeoScore
      : null;

  const handleRefresh = async () => {
    setRunning(true);
    try {
      await refreshAeoSnapshot({ projectId, domain });
      toast.success("AEO snapshot aggiornato");
    } catch {
      toast.error("Errore aggiornamento AEO");
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="flex h-full flex-col gap-6 px-10 py-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-molten-primary" />
            <h1 className="text-headline-md font-bold text-on-surface">AEO</h1>
            <span className="text-label-md text-text-muted">{domain}</span>
            {snapshot.source === "stub" && (
              <span className="rounded-full bg-surface-container-low px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-text-muted">
                STUB
              </span>
            )}
          </div>
          <p className="text-body-sm text-secondary-text">
            Answer Engine Optimization — AI Overviews, Featured Snippet, PAA su
            Google. Snapshot{" "}
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

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-4">
        <div className="flex flex-col gap-2 rounded-xl bg-surface-container-high p-5">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-molten-primary" />
            <h2 className="text-title-sm font-semibold text-on-surface">
              AEO Score
            </h2>
            <button
              type="button"
              className="text-text-muted hover:text-on-surface"
              title="(kw owned almeno 1 SERP feature) / (kw con SERP feature presente) × 100"
            >
              <HelpCircle className="h-3 w-3" />
            </button>
          </div>
          <div className="flex items-baseline gap-2">
            <span className={cn("text-display-md font-bold leading-none", TONE_TEXT[tone])}>
              {snapshot.aeoScore}
              <span className="text-title-md text-text-muted">/100</span>
            </span>
            {delta !== null && delta !== 0 && (
              <span
                className={cn(
                  "flex items-center gap-0.5 text-label-md font-semibold",
                  delta > 0 ? "text-emerald-400" : "text-rose-400",
                )}
              >
                {delta > 0 ? (
                  <ArrowUpRight className="h-3.5 w-3.5" />
                ) : (
                  <ArrowDownRight className="h-3.5 w-3.5" />
                )}
                {Math.abs(delta).toFixed(1)}
              </span>
            )}
          </div>
        </div>

        <CounterCard
          label="AI Overview"
          owned={snapshot.ownership.aiOverviewOwned}
          present={snapshot.ownership.aiOverviewPresent}
          accent="emerald"
        />
        <CounterCard
          label="Featured Snippet"
          owned={snapshot.ownership.featuredSnippetOwned}
          present={snapshot.ownership.featuredSnippetPresent}
          accent="blue"
        />
        <CounterCard
          label="People Also Ask"
          owned={null}
          present={snapshot.ownership.paaPresent}
          accent="violet"
        />
      </section>

      <section className="rounded-xl bg-surface-container-high p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-title-md font-semibold text-on-surface">
            Trend ownership 30 giorni
          </h2>
          <span className="text-label-sm text-text-muted">
            AEO Score · AIO owned · Snippet owned
          </span>
        </div>
        <AeoTrendChart data={trend} />
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-xl bg-surface-container-high p-5 lg:col-span-2">
          <h2 className="mb-4 flex items-center gap-2 text-title-md font-semibold text-on-surface">
            <Target className="h-4 w-4 text-molten-primary" />
            Tabella SERP Features
          </h2>
          <SerpFeaturesTable
            keywords={snapshot.keywords}
            onRowClick={setSelected}
          />
        </div>

        <div className="rounded-xl bg-surface-container-high p-5">
          <h2 className="mb-4 flex items-center gap-2 text-title-md font-semibold text-on-surface">
            <TrendingUp className="h-4 w-4 text-emerald-400" />
            Opportunità
            <span className="text-label-sm font-normal text-text-muted">
              ({snapshot.opportunities.length} totali)
            </span>
          </h2>
          <AeoOpportunities
            opportunities={snapshot.opportunities}
            onSelect={(op) => handleOpportunityClick(op.keywordId)}
          />
        </div>
      </section>

      <p className="text-label-sm text-text-muted">
        ★ owned = il sito è citato in AI Overview o possiede il Featured Snippet.
        Score opportunità = volume × probabilità di vincita (euristica posizione-based).
        Click su una riga della tabella o un'opportunità per il drill con suggerimenti azione.
      </p>

      <SerpFeatureModal
        keyword={selected}
        drill={drill}
        open={!!selected}
        onClose={() => setSelected(null)}
      />
    </div>
  );
}

function CounterCard({
  label,
  owned,
  present,
  accent,
}: {
  label: string;
  owned: number | null;
  present: number;
  accent: "emerald" | "blue" | "violet";
}) {
  const tone =
    accent === "emerald"
      ? "text-emerald-400"
      : accent === "blue"
        ? "text-blue-400"
        : "text-violet-400";
  return (
    <div className="flex flex-col gap-2 rounded-xl bg-surface-container-high p-5">
      <h3 className="text-title-sm font-semibold text-on-surface">{label}</h3>
      {owned !== null ? (
        <div className="flex items-baseline gap-2">
          <span className={cn("text-display-md font-bold leading-none", tone)}>
            {owned}
            <span className="text-title-md text-text-muted">/{present}</span>
          </span>
        </div>
      ) : (
        <div className="flex items-baseline gap-2">
          <span className={cn("text-display-md font-bold leading-none", tone)}>
            {present}
          </span>
          <span className="text-label-md text-text-muted">presenti</span>
        </div>
      )}
      <p className="text-label-sm text-text-muted">
        {owned !== null ? "owned / presenti" : "presenza in SERP"}
      </p>
    </div>
  );
}
