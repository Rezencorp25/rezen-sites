"use client";

import { use } from "react";
import {
  FileText,
  TrendingUp,
  Coins,
  Search,
  Download,
  ArrowUpRight,
} from "lucide-react";
import { useProjectData } from "@/lib/hooks/use-project-data";
import { KpiCard } from "@/components/luminous/kpi-card";
import { TrafficChart } from "@/components/dashboard/traffic-chart";
import { ActiveAlerts } from "@/components/dashboard/active-alerts";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { SiteAuditCard } from "@/components/dashboard/site-audit-card";
import { LeadsSummaryCard } from "@/components/dashboard/leads-summary-card";
import { GradientButton } from "@/components/luminous/gradient-button";
import { KPI_DEFINITIONS } from "@/lib/constants/kpi-definitions";
import { toast } from "sonner";

export default function DashboardPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = use(params);
  const { project, alerts, pageviews } = useProjectData(projectId);

  if (!project) {
    return (
      <div className="p-10 text-body-md text-text-muted">
        Progetto non trovato.
      </div>
    );
  }

  const totalPv30 = pageviews.reduce((acc, p) => acc + p.pageviews, 0);
  const pvDelta = 22; // mock delta vs previous period

  return (
    <div className="mx-auto max-w-7xl px-10 py-10">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-headline-md font-bold text-on-surface">
            {project.name}
          </h1>
          <p className="text-body-md text-secondary-text">
            Overview SEO, performance e monetizzazione — ultimi 30 giorni
          </p>
        </div>
      </div>

      <div className="mb-6 grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Pagine Pubblicate"
          value={project.kpis.pagesPublished}
          icon={FileText}
          deltaLabel="Totale live"
          tooltip={KPI_DEFINITIONS.pagesPublished}
        />
        <KpiCard
          label="Traffico Organico"
          value={project.kpis.organicTraffic30d.toLocaleString("it-IT")}
          delta={pvDelta}
          deltaLabel="vs 30gg precedenti"
          icon={TrendingUp}
          tooltip={KPI_DEFINITIONS.organicTraffic}
        />
        <KpiCard
          label="Revenue AdSense"
          value={`CHF ${project.kpis.adsenseRevenue30d.toFixed(2)}`}
          icon={Coins}
          deltaLabel="ultimi 30 giorni"
          progress={Math.min((project.kpis.adsenseRevenue30d / 500) * 100, 100)}
          tooltip={KPI_DEFINITIONS.adsenseRevenue}
        />
        <KpiCard
          label="SEO Score"
          value={`${project.kpis.seoScore}/100`}
          icon={Search}
          deltaLabel="indice aggregato"
          progress={project.kpis.seoScore}
          tooltip={KPI_DEFINITIONS.seoScore}
        />
      </div>

      <div className="grid gap-4 grid-cols-1 lg:grid-cols-3">
        <div className="lg:col-span-2 flex flex-col rounded-xl bg-surface-container-high">
          <div className="flex items-start justify-between px-6 pt-6">
            <div className="flex flex-col gap-1">
              <h2 className="text-title-lg font-semibold text-on-surface">
                Pageviews ultimi 30 giorni
              </h2>
              <p className="text-body-sm text-secondary-text">
                Totale {totalPv30.toLocaleString("it-IT")} · Real-time engagement e session tracking
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => toast.success("Export CSV — mock")}
                className="flex items-center gap-2 rounded-lg bg-surface-container-lowest px-3.5 py-2 text-body-sm font-medium text-on-surface hover:bg-surface-container-low transition-colors"
              >
                <Download className="h-3.5 w-3.5 text-secondary-text" />
                Export CSV
              </button>
              <GradientButton
                size="sm"
                onClick={() =>
                  toast.success("Details — apertura pannello analytics")
                }
              >
                Details
                <ArrowUpRight className="h-3.5 w-3.5" />
              </GradientButton>
            </div>
          </div>
          <div className="px-2 pb-2 pt-4">
            <TrafficChart data={pageviews} />
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <SiteAuditCard
            projectId={projectId}
            url={
              project.domain.startsWith("http")
                ? project.domain
                : `https://${project.domain}`
            }
          />
          <LeadsSummaryCard projectId={projectId} />
          <ActiveAlerts alerts={alerts} projectId={projectId} />
          <QuickActions />
        </div>
      </div>
    </div>
  );
}
