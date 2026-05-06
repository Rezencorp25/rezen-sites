"use client";

import { ExternalLink, Link2, Quote } from "lucide-react";
import {
  ALL_LLMS,
  GEO_LLM_ACCENT,
  GEO_LLM_LABEL,
  type GeoLlmId,
} from "@/lib/seo/geo-types";
import {
  citationRateBand,
  type CitationMetrics,
  type CitationRateBand,
} from "@/lib/seo/citations";
import { cn } from "@/lib/utils";

const BAND_TONE: Record<CitationRateBand, string> = {
  excellent: "text-emerald-400",
  good: "text-blue-400",
  low: "text-amber-400",
  poor: "text-rose-400",
};

const BAND_LABEL: Record<CitationRateBand, string> = {
  excellent: "Excellent",
  good: "Good",
  low: "Low",
  poor: "Poor",
};

const ACCENT_BAR: Record<"emerald" | "violet" | "blue" | "amber", string> = {
  emerald: "bg-emerald-400",
  violet: "bg-violet-400",
  blue: "bg-blue-400",
  amber: "bg-amber-400",
};

const ACCENT_TEXT: Record<"emerald" | "violet" | "blue" | "amber", string> = {
  emerald: "text-emerald-400",
  violet: "text-violet-400",
  blue: "text-blue-400",
  amber: "text-amber-400",
};

type Props = {
  metrics: CitationMetrics;
};

export function CitationsVsMentions({ metrics }: Props) {
  const band = citationRateBand(metrics.citationRate);
  const target = 40;

  return (
    <div className="flex flex-col gap-4 rounded-xl bg-surface-container-high p-5">
      <div className="flex items-center gap-2">
        <Link2 className="h-4 w-4 text-molten-primary" />
        <h2 className="text-title-md font-semibold text-on-surface">
          Citations vs Mentions
        </h2>
        <span
          className="text-text-muted"
          title="Citation = mention con link cliccabile (porta traffico). Mention testuale = solo brand awareness."
        >
          <ExternalLink className="h-3 w-3" />
        </span>
      </div>

      <div className="flex flex-wrap items-end gap-x-6 gap-y-2">
        <div className="flex flex-col gap-1">
          <span className="text-label-sm text-text-muted">Citation rate</span>
          <div className="flex items-baseline gap-2">
            <span className={cn("text-display-md font-bold leading-none", BAND_TONE[band])}>
              {metrics.citationRate.toFixed(1)}
              <span className="text-title-md text-text-muted">%</span>
            </span>
            <span
              className={cn(
                "rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                BAND_TONE[band],
                "bg-surface-container-low",
              )}
            >
              {BAND_LABEL[band]}
            </span>
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-label-sm text-text-muted">
            <Link2 className="mr-1 inline h-3 w-3" />
            Citations
          </span>
          <span className="font-mono text-title-lg font-semibold text-on-surface">
            {metrics.totalCitations}
            <span className="text-label-md text-text-muted">/{metrics.totalMentions}</span>
          </span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-label-sm text-text-muted">
            <Quote className="mr-1 inline h-3 w-3" />
            Solo testo
          </span>
          <span className="font-mono text-title-lg font-semibold text-on-surface">
            {metrics.totalMentions - metrics.totalCitations}
          </span>
        </div>
      </div>

      <div className="relative h-2 w-full overflow-hidden rounded-full bg-surface-container-low">
        <div
          className={cn(
            "h-full transition-all duration-500",
            band === "excellent" && "bg-emerald-400",
            band === "good" && "bg-blue-400",
            band === "low" && "bg-amber-400",
            band === "poor" && "bg-rose-400",
          )}
          style={{ width: `${Math.min(100, metrics.citationRate)}%` }}
        />
        <div
          className="absolute top-0 h-full w-px bg-on-surface/40"
          style={{ left: `${target}%` }}
          title={`Target ≥${target}%`}
        />
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-label-sm text-text-muted">Breakdown per LLM</span>
        <div className="flex flex-col gap-1.5">
          {ALL_LLMS.map((llm) => {
            const c = metrics.perLlm[llm];
            const accent = GEO_LLM_ACCENT[llm];
            return (
              <div key={llm} className="flex items-center gap-3">
                <span className={cn("w-20 text-label-sm font-semibold", ACCENT_TEXT[accent])}>
                  {GEO_LLM_LABEL[llm]}
                </span>
                <div className="relative flex-1 overflow-hidden rounded-full bg-surface-container-low" style={{ height: 6 }}>
                  <div
                    className={cn("h-full transition-all duration-500", ACCENT_BAR[accent])}
                    style={{ width: `${Math.min(100, c.rate)}%` }}
                  />
                </div>
                <span className="w-32 text-right font-mono text-label-sm text-text-muted">
                  <span className="font-semibold text-on-surface">
                    {c.citations}
                  </span>
                  /{c.mentions}{" "}
                  <span className="opacity-70">({c.rate.toFixed(0)}%)</span>
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <p className="text-label-sm text-text-muted">
        Target citation rate ≥40% (linea bianca). Sotto: brand citato ma non
        scopribile, lavorare su content che invita link diretti (FAQ, guide
        tecniche, ricerche originali).
      </p>
    </div>
  );
}
