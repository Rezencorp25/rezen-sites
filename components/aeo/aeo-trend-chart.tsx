"use client";

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip as RTooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { AeoTrendPoint } from "@/lib/seo/aeo-types";

type Props = {
  data: AeoTrendPoint[];
};

export function AeoTrendChart({ data }: Props) {
  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
        <LineChart data={data} margin={{ top: 8, right: 8, bottom: 8, left: 0 }}>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="rgba(255,255,255,0.05)"
          />
          <XAxis
            dataKey="date"
            stroke="rgba(255,255,255,0.4)"
            fontSize={11}
            tickFormatter={(d) => {
              const dt = new Date(d);
              return `${dt.getDate()}/${dt.getMonth() + 1}`;
            }}
          />
          <YAxis
            stroke="rgba(255,255,255,0.4)"
            fontSize={11}
            width={40}
          />
          <RTooltip
            contentStyle={{
              background: "#1a1a1a",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 8,
              fontSize: 12,
            }}
          />
          <Legend
            wrapperStyle={{ fontSize: 11, color: "rgba(255,255,255,0.7)" }}
            iconType="line"
          />
          <Line
            type="monotone"
            dataKey="aeoScore"
            stroke="#fb923c"
            strokeWidth={2}
            dot={false}
            name="AEO Score"
          />
          <Line
            type="monotone"
            dataKey="aiOverviewOwned"
            stroke="#34d399"
            strokeWidth={2}
            dot={false}
            name="AIO owned"
          />
          <Line
            type="monotone"
            dataKey="featuredSnippetOwned"
            stroke="#60a5fa"
            strokeWidth={2}
            dot={false}
            name="Snippet owned"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
