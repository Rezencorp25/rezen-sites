"use client";

import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

type Tone = "good" | "warn" | "poor";

function scoreTone(score: number): Tone {
  if (score >= 50) return "good";
  if (score >= 20) return "warn";
  return "poor";
}

const TONE_TEXT: Record<Tone, string> = {
  good: "text-emerald-400",
  warn: "text-amber-400",
  poor: "text-rose-400",
};

const TONE_RING: Record<Tone, string> = {
  good: "stroke-emerald-400",
  warn: "stroke-amber-400",
  poor: "stroke-rose-400",
};

type Props = {
  score: number;
  prevScore: number | null;
  size?: "md" | "lg";
};

export function AiVisibilityRing({ score, prevScore, size = "md" }: Props) {
  const tone = scoreTone(score);
  const px = size === "lg" ? 128 : 88;
  const radius = size === "lg" ? 48 : 32;
  const stroke = size === "lg" ? 8 : 6;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (circumference * Math.min(100, score)) / 100;
  const center = px / 2;
  const delta = prevScore !== null ? score - prevScore : null;

  return (
    <div className="flex items-center gap-4">
      <div
        className="relative flex shrink-0 items-center justify-center"
        style={{ width: px, height: px }}
        title="AI Visibility Score 0-100"
      >
        <svg className="-rotate-90" viewBox={`0 0 ${px} ${px}`} width={px} height={px}>
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            strokeWidth={stroke}
            className="stroke-surface-container-low"
          />
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            className={cn("transition-all duration-500", TONE_RING[tone])}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center leading-none">
          <span
            className={cn(
              size === "lg" ? "text-display-md font-bold" : "text-headline-md font-bold",
              TONE_TEXT[tone],
            )}
          >
            {score}
          </span>
          <span className="mt-1 text-[10px] uppercase tracking-widest text-text-muted">
            / 100
          </span>
        </div>
      </div>
      {delta !== null && (
        <div className="flex flex-col gap-1">
          {delta !== 0 ? (
            <span
              className={cn(
                "flex items-center gap-0.5 text-label-md font-semibold",
                delta > 0 ? "text-emerald-400" : "text-rose-400",
              )}
            >
              {delta > 0 ? (
                <ArrowUpRight className="h-3.5 w-3.5" />
              ) : (
                <ArrowDownRight className="h-3.5 w-3.5" />
              )}
              {Math.abs(delta).toFixed(1)} vs precedente
            </span>
          ) : (
            <span className="text-label-md text-text-muted">stabile</span>
          )}
          <p className="text-label-sm text-text-muted">media dei 4 LLM</p>
        </div>
      )}
    </div>
  );
}
