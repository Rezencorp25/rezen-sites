"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import type { ShareOfVoiceEntry } from "@/lib/seo/rank-types";
import { cn } from "@/lib/utils";

const COMPETITOR_COLORS = [
  "#60a5fa",
  "#a78bfa",
  "#f472b6",
  "#34d399",
  "#facc15",
  "#fb7185",
];

const OWNER_COLOR = "#fb923c";

type Props = {
  data: ShareOfVoiceEntry[];
  className?: string;
};

export function ShareOfVoiceDonut({ data, className }: Props) {
  if (data.length === 0) {
    return (
      <div
        className={cn(
          "flex h-full items-center justify-center text-body-sm text-text-muted",
          className,
        )}
      >
        Nessun dato Share of Voice
      </div>
    );
  }

  const owner = data.find((d) => d.isOwner);

  return (
    <div className={cn("flex h-full flex-col gap-3", className)}>
      <div className="relative h-44 w-full">
        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
          <PieChart>
            <Pie
              data={data}
              dataKey="etv"
              nameKey="label"
              cx="50%"
              cy="50%"
              innerRadius={48}
              outerRadius={78}
              paddingAngle={2}
              stroke="rgba(0,0,0,0.2)"
              strokeWidth={1}
            >
              {data.map((entry, idx) => (
                <Cell
                  key={entry.domain}
                  fill={
                    entry.isOwner
                      ? OWNER_COLOR
                      : COMPETITOR_COLORS[idx % COMPETITOR_COLORS.length]
                  }
                />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                background: "#1a1a1a",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 8,
                fontSize: 12,
              }}
              formatter={(value, _name, item) => {
                const entry = item.payload as ShareOfVoiceEntry;
                const v = typeof value === "number" ? value : Number(value ?? 0);
                return [
                  `${entry.sharePct}% · ${v.toLocaleString("it-IT")}`,
                  entry.label,
                ];
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        {owner && (
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-display-sm font-bold leading-none text-on-surface">
              {owner.sharePct}%
            </span>
            <span className="text-label-sm text-text-muted">share owner</span>
          </div>
        )}
      </div>
      <ul className="flex flex-col gap-1.5">
        {data.map((entry, idx) => (
          <li
            key={entry.domain}
            className="flex items-center gap-2 text-label-md"
          >
            <span
              aria-hidden
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{
                backgroundColor: entry.isOwner
                  ? OWNER_COLOR
                  : COMPETITOR_COLORS[idx % COMPETITOR_COLORS.length],
              }}
            />
            <span
              className={cn(
                "flex-1 truncate",
                entry.isOwner
                  ? "font-semibold text-molten-primary"
                  : "text-text-muted",
              )}
              title={entry.domain}
            >
              {entry.label}
            </span>
            <span className="font-mono text-on-surface">{entry.sharePct}%</span>
            <span className="w-16 text-right font-mono text-text-muted">
              {entry.etv.toLocaleString("it-IT")}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
