"use client";

import { use } from "react";
import Link from "next/link";
import {
  LineChart,
  Users,
  Eye,
  DollarSign,
  Target,
  ArrowRight,
} from "lucide-react";
import { useAnalyticsData } from "@/lib/hooks/use-analytics-data";
import { KpiCard } from "@/components/luminous/kpi-card";
import { TrafficChart } from "@/components/dashboard/traffic-chart";
import { DevicesPie } from "@/components/analytics/devices-pie";
import { Skeleton } from "@/components/ui/skeleton";

export default function AnalyticsOverviewPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = use(params);
  const { pageviews, devices, countries, topPages, summary, loading } =
    useAnalyticsData(projectId);

  const totalPv = summary?.pageviewsTotal ?? 0;
  const totalSessions = summary?.sessionsTotal ?? 0;

  return (
    <div className="mx-auto max-w-7xl px-10 py-10">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 text-label-md uppercase tracking-widest text-text-muted">
            <LineChart className="h-3.5 w-3.5" />
            Analytics
          </div>
          <h1 className="text-headline-md font-bold text-on-surface">
            Analytics Overview
          </h1>
          <p className="text-body-md text-secondary-text">
            Audience, engagement e conversion trends sugli ultimi 30 giorni.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/projects/${projectId}/analytics/adsense`}
            className="flex items-center gap-2 rounded-lg bg-surface-container-high px-3.5 py-2.5 text-body-sm font-semibold text-on-surface hover:bg-surface-container-highest transition-colors"
          >
            <DollarSign className="h-4 w-4 text-molten-primary" />
            AdSense
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
          <Link
            href={`/projects/${projectId}/analytics/google-ads`}
            className="flex items-center gap-2 rounded-lg bg-surface-container-high px-3.5 py-2.5 text-body-sm font-semibold text-on-surface hover:bg-surface-container-highest transition-colors"
          >
            <Target className="h-4 w-4 text-molten-primary" />
            Google Ads
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      <div className="mb-5 grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        <KpiCard
          label="Pageviews"
          value={loading ? "—" : totalPv.toLocaleString("it-IT")}
          icon={Eye}
          delta={22}
          deltaLabel="vs periodo prec."
        />
        <KpiCard
          label="Sessions"
          value={loading ? "—" : totalSessions.toLocaleString("it-IT")}
          icon={Users}
          delta={15}
          deltaLabel="unique sessions"
        />
        <KpiCard
          label="Top Page"
          value={loading ? "—" : (topPages[0]?.path ?? "—")}
          deltaLabel={`${topPages[0]?.views.toLocaleString("it-IT") ?? 0} views`}
        />
      </div>

      <div className="mb-5 rounded-xl bg-surface-container-high">
        <div className="px-6 pt-6">
          <h2 className="text-title-lg font-semibold text-on-surface">
            Pageviews
          </h2>
          <p className="text-body-sm text-secondary-text">
            Time series ultimi 30 giorni
          </p>
        </div>
        <div className="p-2">
          {loading ? (
            <Skeleton className="h-64 w-full" />
          ) : (
            <TrafficChart data={pageviews} />
          )}
        </div>
      </div>

      <div className="grid gap-4 grid-cols-1 lg:grid-cols-3">
        <div className="lg:col-span-2 overflow-hidden rounded-xl bg-surface-container-high">
          <div className="flex items-center justify-between px-6 py-4">
            <h3 className="text-title-md font-semibold text-on-surface">
              Top Pages
            </h3>
          </div>
          <div className="grid grid-cols-[1.8fr_100px_100px_100px] gap-4 px-6 py-3 text-label-md uppercase tracking-widest text-text-muted">
            <span>Page</span>
            <span className="text-right">Views</span>
            <span className="text-right">Bounce</span>
            <span className="text-right">Avg Time</span>
          </div>
          {topPages.map((r, i) => (
            <div
              key={r.path}
              className={`grid grid-cols-[1.8fr_100px_100px_100px] items-center gap-4 px-6 py-3 ${
                i % 2 === 0
                  ? "bg-surface-container-lowest"
                  : "bg-surface-container-low"
              }`}
            >
              <span className="truncate font-mono text-body-sm text-on-surface">
                {r.path}
              </span>
              <span className="text-right text-body-sm font-semibold text-on-surface tabular-nums">
                {r.views.toLocaleString("it-IT")}
              </span>
              <span
                className="text-right text-body-sm tabular-nums"
                style={{
                  color: r.bounce > 0.6 ? "#f87171" : "#94a3b8",
                }}
              >
                {(r.bounce * 100).toFixed(0)}%
              </span>
              <span className="text-right text-body-sm text-secondary-text tabular-nums">
                {r.avgTime}
              </span>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-4">
          <div className="rounded-xl bg-surface-container-high p-6">
            <h3 className="mb-5 text-title-md font-semibold text-on-surface">
              Devices
            </h3>
            <DevicesPie data={devices} />
          </div>
          <div className="rounded-xl bg-surface-container-high p-6">
            <h3 className="mb-4 text-title-md font-semibold text-on-surface">
              Paesi
            </h3>
            <ul className="flex flex-col gap-3">
              {countries.map((c) => (
                <li key={c.code} className="flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-body-sm text-on-surface">
                      <span className="rounded bg-surface-container-lowest px-1.5 py-0.5 font-mono text-label-sm text-text-muted">
                        {c.code}
                      </span>
                      {c.country}
                    </span>
                    <span className="text-body-sm font-semibold text-on-surface tabular-nums">
                      {(c.share * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="h-1 rounded-full bg-surface-container-lowest">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${c.share * 100}%`,
                        background: "linear-gradient(90deg,#ffb599,#f56117)",
                      }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
