"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Filter,
  Loader2,
  PieChart as PieIcon,
  RefreshCw,
  Target,
  TrendingUp,
} from "lucide-react";
import { toast } from "sonner";
import { useProjectsStore } from "@/lib/stores/projects-store";
import {
  ensureRankBootstrap,
  refreshRankSnapshot,
  useRankStore,
} from "@/lib/stores/rank-store";
import {
  type ClusterFilter,
  type IntentFilter,
  type KeywordRank,
  type SerpFeatureFilter,
  isTrackedKeywordInCluster,
} from "@/lib/seo/rank-types";
import { generateKeywordDrill } from "@/lib/seo/rank-stub";
import { ClusterBarChart } from "@/components/seo/cluster-bar-chart";
import { ShareOfVoiceDonut } from "@/components/seo/share-of-voice-donut";
import { RankTable } from "@/components/seo/rank-table";
import { KeywordDetailModal } from "@/components/seo/keyword-detail-modal";
import { cn } from "@/lib/utils";

const INTENT_OPTIONS: { value: IntentFilter; label: string }[] = [
  { value: "all", label: "Tutti gli intent" },
  { value: "informational", label: "Informational" },
  { value: "commercial", label: "Commercial" },
  { value: "transactional", label: "Transactional" },
  { value: "navigational", label: "Navigational" },
];

const SERP_OPTIONS: { value: SerpFeatureFilter; label: string }[] = [
  { value: "all", label: "Tutte SERP feature" },
  { value: "aiOverview", label: "AI Overview" },
  { value: "featuredSnippet", label: "Featured Snippet" },
  { value: "paa", label: "People Also Ask" },
  { value: "adsPack", label: "Ads pack" },
];

export default function RankTrackingClient({
  projectId,
}: {
  projectId: string;
}) {
  const project = useProjectsStore((s) => s.getById(projectId));
  const snapshot = useRankStore((s) => s.byProject[projectId]?.[0]);
  const [running, setRunning] = useState(false);
  const [cluster, setCluster] = useState<ClusterFilter>("all");
  const [intent, setIntent] = useState<IntentFilter>("all");
  const [serpFilter, setSerpFilter] = useState<SerpFeatureFilter>("all");
  const [selected, setSelected] = useState<KeywordRank | null>(null);

  const domain = project?.domain ?? "";

  const drill = useMemo(() => {
    if (!selected || !domain) return null;
    return generateKeywordDrill({ projectId, domain, keyword: selected });
  }, [selected, projectId, domain]);

  useEffect(() => {
    if (!domain) return;
    ensureRankBootstrap({ projectId, domain });
  }, [projectId, domain]);

  const filteredKeywords = useMemo(() => {
    if (!snapshot) return [];
    return snapshot.keywords.filter((kw) => {
      if (!isTrackedKeywordInCluster(kw, cluster)) return false;
      if (intent !== "all" && kw.intent !== intent) return false;
      if (serpFilter !== "all") {
        const f = kw.features;
        if (serpFilter === "aiOverview" && !f.aiOverview) return false;
        if (serpFilter === "featuredSnippet" && !f.featuredSnippet) return false;
        if (serpFilter === "paa" && !f.paa) return false;
        if (serpFilter === "adsPack" && !f.adsPack) return false;
      }
      return true;
    });
  }, [snapshot, cluster, intent, serpFilter]);

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
          Caricamento snapshot Rank Tracking…
        </div>
      </div>
    );
  }

  const handleRefresh = async () => {
    setRunning(true);
    try {
      await refreshRankSnapshot({ projectId, domain });
      toast.success("Rank snapshot aggiornato");
    } catch {
      toast.error("Errore aggiornamento rank");
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="flex h-full flex-col gap-6 px-10 py-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <Link
            href={`/projects/${projectId}/seo`}
            className="flex w-fit items-center gap-1 text-label-sm text-text-muted transition-colors hover:text-on-surface"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            SEO Overview
          </Link>
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5 text-molten-primary" />
            <h1 className="text-headline-md font-bold text-on-surface">
              Rank Tracking
            </h1>
            <span className="text-label-md text-text-muted">{domain}</span>
            {snapshot.source === "stub" && (
              <span className="rounded-full bg-surface-container-low px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-text-muted">
                STUB
              </span>
            )}
          </div>
          <p className="text-body-sm text-secondary-text">
            Share of Voice, distribuzione cluster e tabella keyword con trend
            30gg — snapshot{" "}
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
        <div className="rounded-xl bg-surface-container-high p-5 lg:col-span-2">
          <div className="mb-4 flex items-center gap-2">
            <PieIcon className="h-4 w-4 text-molten-primary" />
            <h2 className="text-title-md font-semibold text-on-surface">
              Share of Voice
            </h2>
            <button
              type="button"
              className="text-text-muted hover:text-on-surface"
              title="ETV[domain] / Σ ETV[all] × 100 — formula §6.2 brief, base bulk_traffic_estimation DataForSEO"
            >
              <TrendingUp className="h-3.5 w-3.5" />
            </button>
          </div>
          <ShareOfVoiceDonut data={snapshot.shareOfVoice} />
        </div>

        <div className="rounded-xl bg-surface-container-high p-5">
          <div className="mb-4 flex items-center gap-2">
            <Filter className="h-4 w-4 text-molten-primary" />
            <h2 className="text-title-md font-semibold text-on-surface">
              Cluster posizione
            </h2>
          </div>
          <ClusterBarChart
            data={snapshot.clusters}
            active={cluster}
            onSelect={setCluster}
          />
        </div>
      </section>

      <section className="rounded-xl bg-surface-container-high p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-title-md font-semibold text-on-surface">
            Keyword tracking
          </h2>
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={intent}
              onChange={(e) => setIntent(e.target.value as IntentFilter)}
              className="rounded-md border border-surface-container-low bg-surface-container-low/40 px-3 py-1.5 text-label-md text-on-surface focus:border-molten-primary/50 focus:outline-none"
            >
              {INTENT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            <select
              value={serpFilter}
              onChange={(e) =>
                setSerpFilter(e.target.value as SerpFeatureFilter)
              }
              className="rounded-md border border-surface-container-low bg-surface-container-low/40 px-3 py-1.5 text-label-md text-on-surface focus:border-molten-primary/50 focus:outline-none"
            >
              {SERP_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            {(cluster !== "all" || intent !== "all" || serpFilter !== "all") && (
              <button
                type="button"
                onClick={() => {
                  setCluster("all");
                  setIntent("all");
                  setSerpFilter("all");
                }}
                className="text-label-sm text-text-muted underline-offset-2 hover:text-on-surface hover:underline"
              >
                Reset filtri
              </button>
            )}
          </div>
        </div>

        <RankTable keywords={filteredKeywords} onRowClick={setSelected} />

        <p className="mt-3 text-label-sm text-text-muted">
          Posizione 0 = fuori top 100. Δ verde = guadagno posizione (era 15, ora
          8 → +7). Sparkline mostra trend 30gg (verde = miglioramento). Click su
          una riga per il drill completo.
        </p>
      </section>

      <KeywordDetailModal
        keyword={selected}
        drill={drill}
        open={!!selected}
        onClose={() => setSelected(null)}
      />
    </div>
  );
}
