"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import type { PageviewPoint } from "@/lib/mocks/pageviews";

export function TrafficChart({ data }: { data: PageviewPoint[] }) {
  const chartData = data.map((d) => ({
    ts: d.date.getTime(),
    dayLabel: format(d.date, "d MMM", { locale: it }),
    pageviews: d.pageviews,
    sessions: d.sessions,
  }));

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={chartData}
          margin={{ top: 20, right: 12, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id="pvGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f56117" stopOpacity={0.35} />
              <stop offset="100%" stopColor="#f56117" stopOpacity={0.02} />
            </linearGradient>
            <linearGradient id="pvStroke" x1="0" y1="0" x2="1" y2="0">
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
            tick={{ fill: "#64748b", fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            interval="preserveStartEnd"
            minTickGap={32}
          />
          <YAxis
            tick={{ fill: "#64748b", fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            width={40}
          />
          <Tooltip
            cursor={{ stroke: "#f56117", strokeWidth: 1, strokeDasharray: "3 3" }}
            contentStyle={{
              background: "#292935",
              border: "none",
              borderRadius: 12,
              padding: "10px 14px",
              color: "#e8e8f0",
              boxShadow: "0 20px 40px rgba(0,0,0,0.4)",
            }}
            labelStyle={{
              color: "#94a3b8",
              fontSize: 11,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              fontWeight: 600,
              marginBottom: 4,
            }}
            itemStyle={{ color: "#ffb599", fontWeight: 600 }}
            formatter={(v) => [
              Number(v).toLocaleString("it-IT"),
              "Pageviews",
            ]}
          />
          <Area
            type="monotone"
            dataKey="pageviews"
            stroke="url(#pvStroke)"
            strokeWidth={2.5}
            fill="url(#pvGradient)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
