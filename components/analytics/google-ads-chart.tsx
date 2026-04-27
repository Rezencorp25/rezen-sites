"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";

export type CampaignRow = {
  campaign: string;
  spend: number;
  conversions: number;
};

const LABELS: Record<string, string> = {
  brand_search: "Brand",
  competitor_attack: "Competitor",
  generic_keywords: "Generic",
  display_remarketing: "Remarketing",
  pmax_performance: "PMax",
  video_awareness: "Video",
};

export function GoogleAdsChart({ data }: { data: CampaignRow[] }) {
  const chartData = data.map((d) => ({
    campaign: LABELS[d.campaign] ?? d.campaign,
    Spesa: Math.round(d.spend * 100) / 100,
    Conversioni: d.conversions,
  }));

  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          margin={{ top: 24, right: 16, left: 0, bottom: 8 }}
          barGap={4}
        >
          <defs>
            <linearGradient id="spendFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ffb599" />
              <stop offset="100%" stopColor="#f56117" />
            </linearGradient>
            <linearGradient id="convFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#60a5fa" />
              <stop offset="100%" stopColor="#3b82f6" />
            </linearGradient>
          </defs>
          <CartesianGrid
            stroke="rgba(106,106,122,0.08)"
            strokeDasharray="3 6"
            vertical={false}
          />
          <XAxis
            dataKey="campaign"
            tick={{ fill: "#94a3b8", fontSize: 11, fontWeight: 500 }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tick={{ fill: "#64748b", fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            width={50}
          />
          <Tooltip
            cursor={{ fill: "rgba(245,97,23,0.08)" }}
            contentStyle={{
              background: "#1f1e2a",
              border: "1px solid rgba(106,106,122,0.15)",
              borderRadius: 12,
              padding: "8px 14px",
              color: "#e8e8f0",
            }}
            labelStyle={{ color: "#e8e8f0", fontWeight: 600 }}
          />
          <Legend
            iconType="circle"
            iconSize={8}
            wrapperStyle={{
              paddingTop: 8,
              fontSize: 12,
              color: "#94a3b8",
            }}
          />
          <Bar dataKey="Spesa" fill="url(#spendFill)" radius={[6, 6, 0, 0]} />
          <Bar
            dataKey="Conversioni"
            fill="url(#convFill)"
            radius={[6, 6, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
