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
import type { GeoTrendPoint } from "@/lib/seo/geo-types";

type Row = {
  date: string;
  visibility: number;
  chatgpt: number;
  perplexity: number;
  gemini: number;
  claude: number;
};

function flatten(data: GeoTrendPoint[]): Row[] {
  return data.map((p) => ({
    date: p.date,
    visibility: p.visibility,
    chatgpt: p.perLlm.chatgpt,
    perplexity: p.perLlm.perplexity,
    gemini: p.perLlm.gemini,
    claude: p.perLlm.claude,
  }));
}

type Props = {
  data: GeoTrendPoint[];
};

export function GeoTrendChart({ data }: Props) {
  const rows = flatten(data);
  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
        <LineChart data={rows} margin={{ top: 8, right: 8, bottom: 8, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis
            dataKey="date"
            stroke="rgba(255,255,255,0.4)"
            fontSize={11}
            tickFormatter={(d) => {
              const dt = new Date(d);
              return `${dt.getDate()}/${dt.getMonth() + 1}`;
            }}
          />
          <YAxis stroke="rgba(255,255,255,0.4)" fontSize={11} width={40} />
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
            dataKey="visibility"
            stroke="#fb923c"
            strokeWidth={2.5}
            dot={false}
            name="Visibility"
          />
          <Line
            type="monotone"
            dataKey="chatgpt"
            stroke="#34d399"
            strokeWidth={1.5}
            dot={false}
            name="ChatGPT"
          />
          <Line
            type="monotone"
            dataKey="perplexity"
            stroke="#a78bfa"
            strokeWidth={1.5}
            dot={false}
            name="Perplexity"
          />
          <Line
            type="monotone"
            dataKey="gemini"
            stroke="#60a5fa"
            strokeWidth={1.5}
            dot={false}
            name="Gemini"
          />
          <Line
            type="monotone"
            dataKey="claude"
            stroke="#fbbf24"
            strokeWidth={1.5}
            dot={false}
            name="Claude"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
