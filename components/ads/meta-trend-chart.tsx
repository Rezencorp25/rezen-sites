"use client";

import { useMemo } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { MetaTrendPoint } from "@/lib/marketing/meta-types";

type Props = {
  trend: MetaTrendPoint[];
  currency: string;
};

export function MetaTrendChart({ trend, currency }: Props) {
  const data = useMemo(
    () =>
      trend.map((p) => ({
        date: p.date.slice(5),
        spend: p.spend,
        impressions: p.impressions,
        clicks: p.clicks,
        leads: p.leads,
      })),
    [trend],
  );

  if (trend.length === 0) {
    return (
      <p className="px-4 py-12 text-center text-body-sm text-text-muted">
        Trend dati non disponibili.
      </p>
    );
  }

  return (
    <div className="h-[260px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
          <defs>
            <linearGradient id="spendGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#ff6200" stopOpacity={0.5} />
              <stop offset="95%" stopColor="#ff6200" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="leadsGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#444" opacity={0.2} />
          <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#888" }} />
          <YAxis
            yAxisId="left"
            tick={{ fontSize: 10, fill: "#888" }}
            label={{
              value: `Spend ${currency}`,
              angle: -90,
              position: "insideLeft",
              fontSize: 10,
              fill: "#888",
            }}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            tick={{ fontSize: 10, fill: "#888" }}
            label={{
              value: "Leads",
              angle: 90,
              position: "insideRight",
              fontSize: 10,
              fill: "#888",
            }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#1a1a1a",
              border: "1px solid #444",
              borderRadius: 8,
              fontSize: 12,
            }}
          />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <Area
            yAxisId="left"
            type="monotone"
            dataKey="spend"
            stroke="#ff6200"
            fill="url(#spendGrad)"
            strokeWidth={2}
            name={`Spend (${currency})`}
          />
          <Area
            yAxisId="right"
            type="monotone"
            dataKey="leads"
            stroke="#10b981"
            fill="url(#leadsGrad)"
            strokeWidth={2}
            name="Leads"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
