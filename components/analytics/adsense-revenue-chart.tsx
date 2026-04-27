"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { format } from "date-fns";
import { it } from "date-fns/locale";

export type RevenuePoint = {
  date: Date;
  revenue: number;
};

export function AdsenseRevenueChart({ data }: { data: RevenuePoint[] }) {
  const chartData = data.map((d) => ({
    ts: d.date.getTime(),
    dayLabel: format(d.date, "d MMM", { locale: it }).toUpperCase(),
    revenue: d.revenue,
  }));

  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={chartData}
          margin={{ top: 24, right: 16, left: 0, bottom: 8 }}
        >
          <defs>
            <linearGradient id="adsStroke" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#ffb599" />
              <stop offset="100%" stopColor="#f56117" />
            </linearGradient>
          </defs>
          <CartesianGrid
            stroke="rgba(106,106,122,0.08)"
            strokeDasharray="3 6"
            vertical={false}
          />
          <XAxis
            dataKey="dayLabel"
            tick={{ fill: "#64748b", fontSize: 11, fontWeight: 500 }}
            tickLine={false}
            axisLine={false}
            interval="preserveStartEnd"
            minTickGap={48}
          />
          <YAxis
            tickFormatter={(v) => `CHF ${v}`}
            tick={{ fill: "#64748b", fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            width={60}
          />
          <Tooltip
            cursor={{
              stroke: "#f56117",
              strokeWidth: 1,
              strokeDasharray: "3 3",
            }}
            contentStyle={{
              background: "#1f1e2a",
              border: "1px solid rgba(245,97,23,0.3)",
              borderRadius: 12,
              padding: "8px 14px",
              color: "#e8e8f0",
            }}
            labelStyle={{
              color: "#94a3b8",
              fontSize: 11,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              fontWeight: 600,
              marginBottom: 4,
            }}
            itemStyle={{ color: "#ffb599", fontWeight: 700 }}
            formatter={(v) => [`CHF ${Number(v).toFixed(2)}`, "Revenue"]}
          />
          <Line
            type="monotone"
            dataKey="revenue"
            stroke="url(#adsStroke)"
            strokeWidth={2.5}
            dot={{
              r: 3,
              fill: "#f56117",
              strokeWidth: 2,
              stroke: "#12121d",
            }}
            activeDot={{ r: 6, fill: "#ffb599" }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
