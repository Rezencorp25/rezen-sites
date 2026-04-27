"use client";

import { use, useMemo, useState } from "react";
import {
  Wallet,
  MousePointerClick,
  Percent,
  Target,
} from "lucide-react";
import { useProjectData } from "@/lib/hooks/use-project-data";
import { KpiCard } from "@/components/luminous/kpi-card";
import {
  PeriodToggle,
  type Period,
} from "@/components/analytics/period-toggle";
import {
  GoogleAdsChart,
  type CampaignRow,
} from "@/components/analytics/google-ads-chart";

type LandingRow = {
  landingPage: string;
  spend: number;
  clicks: number;
  conversions: number;
  roas: number;
};

export default function GoogleAdsPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = use(params);
  const { ads } = useProjectData(projectId);
  const [period, setPeriod] = useState<Period>("daily");

  const byCampaign = useMemo<CampaignRow[]>(() => {
    const m = new Map<string, { spend: number; conversions: number }>();
    for (const r of ads) {
      const cur = m.get(r.campaign) ?? { spend: 0, conversions: 0 };
      cur.spend += r.spend;
      cur.conversions += r.conversions;
      m.set(r.campaign, cur);
    }
    return Array.from(m.entries()).map(([campaign, v]) => ({
      campaign,
      spend: v.spend,
      conversions: v.conversions,
    }));
  }, [ads]);

  const totals = useMemo(() => {
    const spend = ads.reduce((acc, r) => acc + r.spend, 0);
    const clicks = ads.reduce((acc, r) => acc + r.clicks, 0);
    const impressions = ads.reduce((acc, r) => acc + r.impressions, 0);
    const conversions = ads.reduce((acc, r) => acc + r.conversions, 0);
    const cpc = clicks > 0 ? spend / clicks : 0;
    const avgRoas =
      ads.length > 0
        ? ads.reduce((acc, r) => acc + r.roas, 0) / ads.length
        : 0;
    return { spend, clicks, impressions, conversions, cpc, avgRoas };
  }, [ads]);

  const byLanding = useMemo<LandingRow[]>(() => {
    const m = new Map<string, LandingRow>();
    for (const r of ads) {
      if (!r.landingPage) continue;
      const cur =
        m.get(r.landingPage) ??
        {
          landingPage: r.landingPage,
          spend: 0,
          clicks: 0,
          conversions: 0,
          roas: 0,
        };
      cur.spend += r.spend;
      cur.clicks += r.clicks;
      cur.conversions += r.conversions;
      cur.roas += r.roas;
      m.set(r.landingPage, cur);
    }
    return Array.from(m.values())
      .map((r) => ({ ...r, roas: Math.round((r.roas / ads.length) * 100) / 100 }))
      .sort((a, b) => b.conversions - a.conversions);
  }, [ads]);

  if (ads.length === 0) {
    return (
      <div className="mx-auto max-w-7xl px-10 py-20 text-center">
        <h1 className="text-headline-md font-bold text-on-surface">
          Google Ads Performance
        </h1>
        <p className="mt-3 text-body-md text-text-muted">
          Questo progetto non ha Google Ads configurato.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-10 py-10">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <div className="text-label-md uppercase tracking-widest text-text-muted">
            Analytics › Google Ads
          </div>
          <h1 className="text-headline-md font-bold text-on-surface">
            Google Ads Performance
          </h1>
        </div>
        <PeriodToggle value={period} onChange={setPeriod} />
      </div>

      <div className="mb-5 grid gap-4 grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Spesa"
          value={`CHF ${totals.spend.toFixed(2)}`}
          icon={Wallet}
          delta={-8}
          deltaLabel="vs 30gg prec."
        />
        <KpiCard
          label="Click"
          value={totals.clicks.toLocaleString("it-IT")}
          icon={MousePointerClick}
          delta={14}
          deltaLabel={`${totals.impressions.toLocaleString("it-IT")} impressions`}
        />
        <KpiCard
          label="CPC"
          value={`CHF ${totals.cpc.toFixed(2)}`}
          icon={Percent}
          deltaLabel="costo per click"
        />
        <KpiCard
          label="Conv. & ROAS"
          value={totals.conversions}
          icon={Target}
          deltaLabel={`ROAS medio ${totals.avgRoas.toFixed(2)}`}
        />
      </div>

      <div className="mb-5 rounded-xl bg-surface-container-high">
        <div className="flex items-start justify-between px-6 pt-6">
          <div className="flex flex-col gap-1">
            <h2 className="text-title-lg font-semibold text-on-surface">
              Spesa vs Conversioni per Campagna
            </h2>
            <p className="text-body-sm text-secondary-text">
              Breakdown delle 6 campagne attive sull&apos;account
            </p>
          </div>
        </div>
        <div className="p-2">
          <GoogleAdsChart data={byCampaign} />
        </div>
      </div>

      <div className="overflow-hidden rounded-xl bg-surface-container-high">
        <div className="flex items-center justify-between px-6 py-4">
          <h3 className="text-title-md font-semibold text-on-surface">
            Performance per Landing Page
          </h3>
        </div>
        <div className="grid grid-cols-[1.8fr_100px_100px_120px_100px] gap-4 px-6 py-3 text-label-md uppercase tracking-widest text-text-muted">
          <span>Landing Page</span>
          <span className="text-right">Clicks</span>
          <span className="text-right">Spesa</span>
          <span className="text-right">Conversioni</span>
          <span className="text-right">ROAS</span>
        </div>
        {byLanding.map((r, i) => (
          <div
            key={r.landingPage}
            className={`grid grid-cols-[1.8fr_100px_100px_120px_100px] items-center gap-4 px-6 py-3 ${
              i % 2 === 0
                ? "bg-surface-container-lowest"
                : "bg-surface-container-low"
            }`}
          >
            <span className="truncate font-mono text-body-sm text-on-surface">
              {r.landingPage}
            </span>
            <span className="text-right text-body-sm text-secondary-text tabular-nums">
              {r.clicks.toLocaleString("it-IT")}
            </span>
            <span className="text-right text-body-sm text-secondary-text tabular-nums">
              CHF {r.spend.toFixed(2)}
            </span>
            <span className="text-right text-body-md font-semibold text-on-surface tabular-nums">
              {r.conversions}
            </span>
            <span
              className="text-right text-body-md font-semibold tabular-nums"
              style={{
                color: r.roas >= 1 ? "#4ade80" : "#f87171",
              }}
            >
              {r.roas.toFixed(2)}x
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
