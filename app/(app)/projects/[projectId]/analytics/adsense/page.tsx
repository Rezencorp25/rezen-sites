"use client";

import { use, useMemo, useState } from "react";
import {
  Coins,
  Gauge,
  Eye,
  MousePointerClick,
  TrendingUp,
} from "lucide-react";
import { useAdSenseData } from "@/lib/hooks/use-adsense-data";
import { useAdsData } from "@/lib/hooks/use-ads-data";
import { KpiCard } from "@/components/luminous/kpi-card";
import {
  PeriodToggle,
  type Period,
} from "@/components/analytics/period-toggle";
import {
  AdsenseRevenueChart,
  type RevenuePoint,
} from "@/components/analytics/adsense-revenue-chart";

type RollupRow = {
  page: string;
  views: number;
  rpm: number;
  revenue: number;
};

export default function AdSensePage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = use(params);
  const { revenue: adsense } = useAdSenseData(projectId);
  const { performance: ads } = useAdsData(projectId);
  const [period, setPeriod] = useState<Period>("daily");

  const daily = useMemo<RevenuePoint[]>(() => {
    const byDay = new Map<string, number>();
    for (const row of adsense.filter((a) => !a.pageUrl)) {
      const key = row.date.toISOString().slice(0, 10);
      byDay.set(key, (byDay.get(key) ?? 0) + row.revenue);
    }
    return Array.from(byDay.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, revenue]) => ({
        date: new Date(key),
        revenue: Math.round(revenue * 100) / 100,
      }));
  }, [adsense]);

  const chartData = useMemo<RevenuePoint[]>(() => {
    if (period === "daily") return daily;
    if (period === "weekly") {
      const grouped: RevenuePoint[] = [];
      for (let i = 0; i < daily.length; i += 7) {
        const window = daily.slice(i, i + 7);
        const total = window.reduce((acc, p) => acc + p.revenue, 0);
        grouped.push({
          date: window[0]?.date ?? new Date(),
          revenue: Math.round(total * 100) / 100,
        });
      }
      return grouped;
    }
    const total = daily.reduce((acc, p) => acc + p.revenue, 0);
    return [
      {
        date: daily[0]?.date ?? new Date(),
        revenue: Math.round(total * 100) / 100,
      },
    ];
  }, [daily, period]);

  const totals = useMemo(() => {
    const project = adsense.filter((a) => !a.pageUrl);
    const revenue = project.reduce((acc, r) => acc + r.revenue, 0);
    const impressions = project.reduce((acc, r) => acc + r.impressions, 0);
    const ctr =
      project.length > 0
        ? project.reduce((acc, r) => acc + r.ctr, 0) / project.length
        : 0;
    const rpm = impressions > 0 ? (revenue / impressions) * 1000 : 0;
    return { revenue, impressions, ctr, rpm };
  }, [adsense]);

  const byPage = useMemo<RollupRow[]>(() => {
    const map = new Map<string, RollupRow>();
    for (const row of adsense.filter((a) => a.pageUrl)) {
      const cur = map.get(row.pageUrl!) ?? {
        page: row.pageUrl!,
        views: 0,
        rpm: 0,
        revenue: 0,
      };
      cur.views += row.impressions;
      cur.revenue += row.revenue;
      map.set(row.pageUrl!, cur);
    }
    return Array.from(map.values())
      .map((r) => ({
        ...r,
        revenue: Math.round(r.revenue * 100) / 100,
        rpm: Math.round(((r.revenue / (r.views || 1)) * 1000) * 100) / 100,
      }))
      .sort((a, b) => b.revenue - a.revenue);
  }, [adsense]);

  const googleAdsCost = useMemo(() => {
    return Math.round(ads.reduce((acc, r) => acc + r.spend, 0) * 100) / 100;
  }, [ads]);

  const netProfit = Math.round((totals.revenue - googleAdsCost) * 100) / 100;
  const efficiency =
    totals.revenue > 0
      ? Math.min(100, Math.round((netProfit / totals.revenue) * 100))
      : 0;

  if (adsense.length === 0) {
    return (
      <div className="mx-auto max-w-7xl px-10 py-20 text-center">
        <h1 className="text-headline-md font-bold text-on-surface">
          AdSense Revenue Engine
        </h1>
        <p className="mt-3 text-body-md text-text-muted">
          Questo progetto non ha AdSense configurato o dati disponibili.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-10 py-10">
      <div className="mb-6 flex flex-col gap-1">
        <div className="text-label-md uppercase tracking-widest text-text-muted">
          Analytics › AdSense Performance
        </div>
        <h1 className="text-headline-md font-bold text-on-surface">
          AdSense Revenue Engine
        </h1>
      </div>

      <div className="mb-5 grid gap-4 grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Revenue"
          value={`CHF ${totals.revenue.toFixed(2)}`}
          icon={Coins}
          delta={22}
          deltaLabel="vs period prec."
          progress={Math.min((totals.revenue / 800) * 100, 100)}
        />
        <KpiCard
          label="RPM"
          value={`CHF ${totals.rpm.toFixed(2)}`}
          icon={Gauge}
          deltaLabel="Page Revenue per 1k views"
        />
        <KpiCard
          label="Impressioni"
          value={totals.impressions.toLocaleString("it-IT")}
          icon={Eye}
          deltaLabel="Across 12 active domains"
        />
        <KpiCard
          label="CTR"
          value={`${(totals.ctr * 100).toFixed(1)}%`}
          icon={MousePointerClick}
          delta={-0.4}
          deltaLabel="da avg mercato"
        />
      </div>

      <div className="mb-5 rounded-xl bg-surface-container-high">
        <div className="flex items-start justify-between px-6 pt-6">
          <div className="flex flex-col gap-1">
            <h2 className="text-title-lg font-semibold text-on-surface">
              Revenue giornaliera
            </h2>
            <p className="text-body-sm text-secondary-text">
              Earnings trajectory per il ciclo di billing corrente
            </p>
          </div>
          <PeriodToggle value={period} onChange={setPeriod} />
        </div>
        <div className="p-2">
          <AdsenseRevenueChart data={chartData} />
        </div>
      </div>

      <div className="grid gap-4 grid-cols-1 lg:grid-cols-3">
        <div className="lg:col-span-2 overflow-hidden rounded-xl bg-surface-container-high">
          <div className="flex items-center justify-between px-6 py-4">
            <h3 className="text-title-md font-semibold text-on-surface">
              Revenue per Pagina
            </h3>
          </div>
          <div className="grid grid-cols-[1.8fr_90px_90px_110px] gap-4 px-6 py-3 text-label-md uppercase tracking-widest text-text-muted">
            <span>Page URL</span>
            <span className="text-right">Views</span>
            <span className="text-right">RPM</span>
            <span className="text-right">Revenue</span>
          </div>
          {byPage.slice(0, 6).map((r, i) => (
            <div
              key={r.page}
              className={`grid grid-cols-[1.8fr_90px_90px_110px] items-center gap-4 px-6 py-3 ${
                i % 2 === 0
                  ? "bg-surface-container-lowest"
                  : "bg-surface-container-low"
              }`}
            >
              <span className="truncate font-mono text-body-sm text-on-surface">
                {r.page}
              </span>
              <span className="text-right text-body-sm text-secondary-text tabular-nums">
                {r.views.toLocaleString("it-IT")}
              </span>
              <span className="text-right text-body-sm text-secondary-text tabular-nums">
                CHF {r.rpm.toFixed(2)}
              </span>
              <span className="text-right text-body-md font-semibold text-on-surface tabular-nums">
                CHF {r.revenue.toFixed(2)}
              </span>
            </div>
          ))}
        </div>

        <div className="flex flex-col rounded-xl bg-surface-container-high p-6">
          <h3 className="mb-1 text-title-md font-semibold text-on-surface">
            Bilancio Netto
          </h3>
          <p className="mb-5 text-body-sm text-secondary-text">
            AdSense Revenue - Google Ads Cost
          </p>

          <div className="flex flex-col gap-4">
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <span className="text-label-md uppercase tracking-widest text-text-muted">
                  AdSense Revenue
                </span>
                <span className="text-body-sm font-semibold text-success tabular-nums">
                  + CHF {totals.revenue.toFixed(2)}
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-surface-container-lowest">
                <div
                  className="h-full rounded-full bg-success"
                  style={{ width: "100%" }}
                />
              </div>
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <span className="text-label-md uppercase tracking-widest text-text-muted">
                  Google Ads Cost (Traffic)
                </span>
                <span className="text-body-sm font-semibold text-error tabular-nums">
                  − CHF {googleAdsCost.toFixed(2)}
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-surface-container-lowest">
                <div
                  className="h-full rounded-full bg-error"
                  style={{
                    width: `${Math.min((googleAdsCost / (totals.revenue || 1)) * 100, 100)}%`,
                  }}
                />
              </div>
            </div>
          </div>

          <div className="my-5 h-px bg-surface-container-lowest" />

          <div className="flex flex-col gap-1">
            <span className="text-label-md uppercase tracking-widest text-text-muted">
              Net Profit Margin
            </span>
            <span
              className="text-display-sm font-extrabold"
              style={{
                color: netProfit >= 0 ? "#ffb599" : "#f87171",
              }}
            >
              CHF {netProfit.toFixed(2)}
            </span>
            <div className="mt-1 flex items-center gap-1.5 text-body-sm text-success">
              <TrendingUp className="h-3.5 w-3.5" />
              {efficiency}% Efficiency Score
            </div>
          </div>

          <button
            type="button"
            className="mt-5 flex items-center justify-center gap-2 rounded-lg bg-surface-container-lowest px-4 py-2.5 text-body-sm font-medium text-on-surface hover:bg-surface-container-low transition-colors"
          >
            View Detailed Ledger
          </button>
        </div>
      </div>
    </div>
  );
}
