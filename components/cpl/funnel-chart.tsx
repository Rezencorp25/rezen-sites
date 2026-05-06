"use client";

import { ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { FunnelStage } from "@/lib/marketing/cpl-calculator";

type Props = {
  stages: FunnelStage[];
};

const STAGE_TONE: Record<FunnelStage["key"], string> = {
  impressions: "from-sky-400/30 to-sky-400/10 border-sky-400/40",
  clicks: "from-blue-400/30 to-blue-400/10 border-blue-400/40",
  leads: "from-violet-400/30 to-violet-400/10 border-violet-400/40",
  qualified: "from-amber-400/30 to-amber-400/10 border-amber-400/40",
  won: "from-emerald-400/30 to-emerald-400/10 border-emerald-400/40",
};

const fmt = (n: number) => n.toLocaleString("it-IT");

export function CplFunnelChart({ stages }: Props) {
  const max = Math.max(...stages.map((s) => s.value), 1);

  return (
    <div className="flex flex-col gap-1">
      {stages.map((stage, idx) => {
        const widthPct = Math.max(8, (stage.value / max) * 100);
        const isLast = idx === stages.length - 1;
        return (
          <div key={stage.key} className="flex flex-col gap-1">
            <div className="flex items-center gap-3">
              <div className="w-28 shrink-0 text-right text-label-md font-semibold uppercase tracking-wider text-text-muted">
                {stage.label}
              </div>
              <div className="relative flex-1">
                <div
                  className={cn(
                    "h-12 rounded-lg border bg-gradient-to-r px-4 transition-all",
                    STAGE_TONE[stage.key],
                  )}
                  style={{ width: `${widthPct}%` }}
                >
                  <div className="flex h-full items-center justify-between gap-3">
                    <span className="font-mono text-headline-xs font-bold tabular-nums text-on-surface">
                      {fmt(stage.value)}
                    </span>
                    {idx > 0 && (
                      <span className="font-mono text-label-sm text-text-muted">
                        {stage.conversionPct}%
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="w-24 shrink-0 text-left">
                {idx > 0 ? (
                  <span
                    className={cn(
                      "font-mono text-label-sm",
                      stage.dropoffPct >= 95
                        ? "text-rose-400"
                        : stage.dropoffPct >= 80
                          ? "text-amber-400"
                          : "text-text-muted",
                    )}
                  >
                    -{stage.dropoffPct}%
                  </span>
                ) : (
                  <span className="font-mono text-label-sm text-text-muted">
                    base
                  </span>
                )}
              </div>
            </div>
            {!isLast && (
              <div className="flex items-center justify-start pl-[7.5rem]">
                <ArrowDown className="h-3 w-3 text-text-muted" />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
