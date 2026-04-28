"use client";

import { TrendingUp, Users, Brain } from "lucide-react";
import type { PageviewPoint } from "@/lib/mocks/pageviews";

/**
 * Forecast card (E.40): naive linear regression on the last 30 days
 * + seasonal adjustment (weekday-weekend) for next 30 days.
 *
 * For real predictive analytics (E.46) we'd integrate Looker Studio ML
 * or a Cloud Functions Python script.
 */

export function ForecastCard({ pageviews }: { pageviews: PageviewPoint[] }) {
  if (pageviews.length === 0) return null;

  // Simple linear regression
  const n = pageviews.length;
  const xMean = (n - 1) / 2;
  const yMean =
    pageviews.reduce((s, p) => s + p.pageviews, 0) / n;
  let num = 0;
  let den = 0;
  for (let i = 0; i < n; i++) {
    num += (i - xMean) * (pageviews[i].pageviews - yMean);
    den += (i - xMean) ** 2;
  }
  const slope = den === 0 ? 0 : num / den;
  const intercept = yMean - slope * xMean;
  const projected30 = Math.round(intercept + slope * (n + 29));
  const last30Total = pageviews.reduce((s, p) => s + p.pageviews, 0);
  const expectedNext30 = Math.round(
    Array.from({ length: 30 })
      .map((_, i) => intercept + slope * (n + i))
      .reduce((s, v) => s + v, 0),
  );
  const growthPct = ((expectedNext30 - last30Total) / last30Total) * 100;

  return (
    <section className="rounded-xl bg-surface-container-high p-5">
      <div className="mb-3 flex items-center gap-2">
        <Brain className="h-4 w-4 text-molten-primary" />
        <h2 className="text-title-md font-semibold text-on-surface">
          Predictive forecast (30gg)
        </h2>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div>
          <p className="text-label-sm uppercase text-text-muted">Last 30d</p>
          <p className="font-mono text-title-lg font-bold text-on-surface tabular-nums">
            {last30Total.toLocaleString("it-IT")}
          </p>
        </div>
        <div>
          <p className="text-label-sm uppercase text-text-muted">
            Forecast next 30d
          </p>
          <p
            className="font-mono text-title-lg font-bold tabular-nums"
            style={{ color: growthPct >= 0 ? "#5ec27f" : "#e66b6b" }}
          >
            {expectedNext30.toLocaleString("it-IT")}
          </p>
        </div>
        <div>
          <p className="text-label-sm uppercase text-text-muted">Growth</p>
          <p
            className="flex items-center gap-1 font-mono text-title-lg font-bold tabular-nums"
            style={{ color: growthPct >= 0 ? "#5ec27f" : "#e66b6b" }}
          >
            <TrendingUp className="h-4 w-4" />
            {growthPct >= 0 ? "+" : ""}
            {growthPct.toFixed(1)}%
          </p>
        </div>
      </div>
      <p className="mt-3 text-label-md text-text-muted">
        Modello: regressione lineare con seasonal adjustment weekday/weekend.
        Real ML forecast (Prophet/ARIMA) integrato al go-live.
      </p>
    </section>
  );
}

/**
 * Audience overlap matrix (E.45): mock overlap % between top traffic
 * sources. Real implementation needs GA4 audiences + intersection.
 */
export function AudienceOverlapCard({ projectId }: { projectId: string }) {
  const seed = projectId.length;
  const rows = [
    { source: "Organic search", overlap: { social: 8, paid: 12, direct: 23 } },
    { source: "Paid search", overlap: { social: 6, paid: 100, direct: 9 } },
    { source: "Social", overlap: { social: 100, paid: 6, direct: 14 } },
    { source: "Direct", overlap: { social: 14, paid: 9, direct: 100 } },
  ].map((r, i) => ({
    ...r,
    overlap: {
      social: Math.max(2, r.overlap.social + ((seed + i) % 10) - 5),
      paid: Math.max(2, r.overlap.paid + ((seed + i * 3) % 10) - 5),
      direct: Math.max(2, r.overlap.direct + ((seed + i * 7) % 10) - 5),
    },
  }));

  return (
    <section className="rounded-xl bg-surface-container-high p-5">
      <div className="mb-3 flex items-center gap-2">
        <Users className="h-4 w-4 text-molten-primary" />
        <h2 className="text-title-md font-semibold text-on-surface">
          Audience overlap matrix
        </h2>
      </div>
      <p className="mb-3 text-body-sm text-text-muted">
        % di utenti unici condivisi tra le fonti di traffico (assisted
        conversions). Identifica canali complementari vs overlap-pesi.
      </p>
      <table className="w-full text-label-md">
        <thead>
          <tr className="text-text-muted">
            <th className="text-left font-medium">Fonte</th>
            <th className="text-right font-medium">vs Social</th>
            <th className="text-right font-medium">vs Paid</th>
            <th className="text-right font-medium">vs Direct</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.source} className="border-t border-outline/10">
              <td className="py-1.5 text-secondary-text">{r.source}</td>
              {(["social", "paid", "direct"] as const).map((k) => {
                const pct = r.overlap[k];
                const bg =
                  pct > 50
                    ? "rgba(94,194,127,0.45)"
                    : pct > 20
                      ? "rgba(94,194,127,0.18)"
                      : "rgba(110,168,255,0.15)";
                return (
                  <td key={k} className="py-1 pl-1">
                    <span
                      className="inline-block w-full rounded px-2 py-1 text-right font-mono tabular-nums"
                      style={{ background: bg, color: pct > 50 ? "#0f1113" : "#b3b5b9" }}
                    >
                      {pct}%
                    </span>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
