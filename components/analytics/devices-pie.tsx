"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import type { DeviceShare } from "@/lib/mocks/pageviews";

const COLORS = ["#ffb599", "#60a5fa", "#4ade80"];

export function DevicesPie({ data }: { data: DeviceShare[] }) {
  const chartData = data.map((d) => ({
    name: d.device,
    value: Math.round(d.share * 100),
  }));

  return (
    <div className="flex items-center gap-6">
      <div className="h-48 w-48 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Tooltip
              contentStyle={{
                background: "#1f1e2a",
                border: "none",
                borderRadius: 8,
                padding: "6px 10px",
                fontSize: 12,
              }}
              itemStyle={{ color: "#e8e8f0" }}
              formatter={(v) => [`${Number(v)}%`, ""]}
            />
            <Pie
              data={chartData}
              dataKey="value"
              innerRadius={50}
              outerRadius={80}
              paddingAngle={3}
              stroke="none"
            >
              {chartData.map((_, idx) => (
                <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>
      <ul className="flex flex-col gap-3">
        {chartData.map((d, i) => (
          <li key={d.name} className="flex items-center gap-2.5">
            <span
              className="h-3 w-3 rounded-full"
              style={{ background: COLORS[i % COLORS.length] }}
            />
            <span className="text-body-sm text-on-surface">{d.name}</span>
            <span className="text-body-sm font-semibold text-secondary-text tabular-nums">
              {d.value}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
