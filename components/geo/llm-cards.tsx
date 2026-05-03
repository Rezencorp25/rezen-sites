"use client";

import { Bot, Compass, Gem, Sparkles } from "lucide-react";
import {
  ALL_LLMS,
  GEO_LLM_ACCENT,
  GEO_LLM_LABEL,
  type GeoLlmCounters,
  type GeoLlmId,
} from "@/lib/seo/geo-types";
import { cn } from "@/lib/utils";

const LLM_ICON: Record<GeoLlmId, typeof Bot> = {
  chatgpt: Sparkles,
  perplexity: Compass,
  gemini: Gem,
  claude: Bot,
};

const ACCENT_TEXT: Record<"emerald" | "violet" | "blue" | "amber", string> = {
  emerald: "text-emerald-400",
  violet: "text-violet-400",
  blue: "text-blue-400",
  amber: "text-amber-400",
};

const ACCENT_BAR: Record<"emerald" | "violet" | "blue" | "amber", string> = {
  emerald: "bg-emerald-400",
  violet: "bg-violet-400",
  blue: "bg-blue-400",
  amber: "bg-amber-400",
};

type Props = {
  perLlm: Record<GeoLlmId, GeoLlmCounters>;
};

export function LlmCards({ perLlm }: Props) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {ALL_LLMS.map((llm) => {
        const c = perLlm[llm];
        const Icon = LLM_ICON[llm];
        const accent = GEO_LLM_ACCENT[llm];
        return (
          <div
            key={llm}
            className="flex flex-col gap-3 rounded-xl bg-surface-container-high p-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Icon className={cn("h-4 w-4", ACCENT_TEXT[accent])} />
                <h3 className="text-title-sm font-semibold text-on-surface">
                  {GEO_LLM_LABEL[llm]}
                </h3>
              </div>
              <span className={cn("font-mono text-title-md font-bold", ACCENT_TEXT[accent])}>
                {c.score.toFixed(0)}
                <span className="text-label-sm text-text-muted">/100</span>
              </span>
            </div>

            <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-container-low">
              <div
                className={cn("h-full transition-all duration-500", ACCENT_BAR[accent])}
                style={{ width: `${Math.min(100, c.score)}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-label-sm">
              <span className="text-text-muted">
                citato in{" "}
                <span className="font-mono font-semibold text-on-surface">
                  {c.mentioned}
                </span>{" "}
                / {c.total}
              </span>
              <span className="text-text-muted">
                rank medio{" "}
                <span className="font-mono font-semibold text-on-surface">
                  {c.avgRank !== null ? c.avgRank.toFixed(1) : "—"}
                </span>
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
