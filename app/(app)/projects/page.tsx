"use client";

import { useMemo, useState } from "react";
import { useProjectsStore } from "@/lib/stores/projects-store";
import { NewProjectDialog } from "@/components/projects/new-project-dialog";
import { ProjectCard } from "@/components/projects/project-card";
import { Plus, TrendingUp } from "lucide-react";

export default function ProjectsListPage() {
  const projects = useProjectsStore((s) => s.projects);
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <div className="mx-auto max-w-7xl px-10 py-10">
      <div className="mb-8 flex items-end justify-between gap-6">
        <div className="flex flex-col gap-1">
          <p className="text-label-md uppercase tracking-widest text-text-muted">
            Workspace
          </p>
          <h1 className="text-headline-lg font-bold text-on-surface">
            Progetti
          </h1>
          <p className="text-body-md text-secondary-text">
            {projects.length} siti gestiti dal team REZEN
          </p>
        </div>
      </div>

      <BenchmarkPanel />

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
        <button
          type="button"
          onClick={() => setDialogOpen(true)}
          className="group relative flex min-h-[280px] flex-col items-center justify-center gap-3 overflow-hidden rounded-2xl border border-dashed border-outline/50 bg-surface-container-lowest transition-all hover:border-molten-primary hover:bg-surface-container-low"
        >
          {/* Animated pulse ring */}
          <span
            className="absolute inset-6 rounded-xl opacity-0 transition-opacity duration-500 group-hover:opacity-100"
            style={{
              background:
                "radial-gradient(80% 60% at 50% 50%, rgba(255,98,0,0.18), transparent 70%)",
            }}
          />
          <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-container-high transition-all group-hover:bg-surface-container-highest group-hover:scale-105">
            <Plus className="h-7 w-7 text-molten-primary transition-transform duration-300 group-hover:rotate-90" />
          </div>
          <div className="relative flex flex-col items-center gap-1">
            <span className="text-body-md font-semibold text-on-surface">
              Nuovo Progetto
            </span>
            <span className="text-body-sm text-text-muted">
              Parti vuoto, genera con AI o importa
            </span>
          </div>
        </button>

        {projects.map((p) => (
          <ProjectCard key={p.id} project={p} />
        ))}
      </div>

      <NewProjectDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
}

function BenchmarkPanel() {
  const projects = useProjectsStore((s) => s.projects);
  const benchmark = useMemo(() => {
    if (projects.length === 0) return null;
    const seoScores = projects.map((p) => p.kpis.seoScore);
    const traffic = projects.map((p) => p.kpis.organicTraffic30d);
    const revenue = projects.map((p) => p.kpis.adsenseRevenue30d);
    const avg = (arr: number[]) =>
      arr.reduce((s, n) => s + n, 0) / arr.length;
    const avgSeo = Math.round(avg(seoScores));
    const avgTraffic = Math.round(avg(traffic));
    const avgRevenue = Math.round(avg(revenue) * 100) / 100;
    const top = [...projects].sort(
      (a, b) => b.kpis.seoScore - a.kpis.seoScore,
    )[0];
    const bottom = [...projects].sort(
      (a, b) => a.kpis.seoScore - b.kpis.seoScore,
    )[0];
    return { avgSeo, avgTraffic, avgRevenue, top, bottom };
  }, [projects]);

  if (!benchmark) return null;

  return (
    <section className="mb-6 rounded-xl bg-surface-container-high p-5">
      <div className="mb-3 flex items-center gap-2.5">
        <TrendingUp className="h-4 w-4 text-molten-primary" />
        <h2 className="text-title-md font-semibold text-on-surface">
          Performance benchmarking
        </h2>
        <span className="ml-auto text-label-md text-text-muted">
          Confronto cross-client su KPI principali
        </span>
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <div className="rounded-md bg-surface-container-low p-3">
          <p className="text-label-sm uppercase text-text-muted">SEO score (avg)</p>
          <p className="font-mono text-headline-sm font-bold text-on-surface tabular-nums">
            {benchmark.avgSeo}
          </p>
        </div>
        <div className="rounded-md bg-surface-container-low p-3">
          <p className="text-label-sm uppercase text-text-muted">Traffic (avg)</p>
          <p className="font-mono text-headline-sm font-bold text-on-surface tabular-nums">
            {benchmark.avgTraffic.toLocaleString("it-IT")}
          </p>
        </div>
        <div className="rounded-md bg-surface-container-low p-3">
          <p className="text-label-sm uppercase text-text-muted">Revenue (avg)</p>
          <p className="font-mono text-headline-sm font-bold text-on-surface tabular-nums">
            CHF {benchmark.avgRevenue}
          </p>
        </div>
        <div className="rounded-md bg-success-container/30 p-3">
          <p className="text-label-sm uppercase text-success">🏆 Top SEO</p>
          <p className="text-body-sm font-semibold text-on-surface">
            {benchmark.top.name}
          </p>
          <p className="font-mono text-label-sm text-text-muted">
            score {benchmark.top.kpis.seoScore}
          </p>
        </div>
        <div className="rounded-md bg-warning-container/30 p-3">
          <p className="text-label-sm uppercase text-warning">⚠️ Da migliorare</p>
          <p className="text-body-sm font-semibold text-on-surface">
            {benchmark.bottom.name}
          </p>
          <p className="font-mono text-label-sm text-text-muted">
            score {benchmark.bottom.kpis.seoScore}
          </p>
        </div>
      </div>
    </section>
  );
}
