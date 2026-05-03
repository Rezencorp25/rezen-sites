"use client";

import { useEffect } from "react";
import Link from "next/link";
import {
  ArrowDownRight,
  ArrowUpRight,
  ChevronRight,
  HelpCircle,
  Sparkles,
  Star,
} from "lucide-react";
import { ensureAeoBootstrap, useAeoStore } from "@/lib/stores/aeo-store";
import { cn } from "@/lib/utils";

function scoreTone(score: number): "good" | "warn" | "poor" {
  if (score >= 50) return "good";
  if (score >= 20) return "warn";
  return "poor";
}

const TONE_TEXT: Record<"good" | "warn" | "poor", string> = {
  good: "text-emerald-400",
  warn: "text-amber-400",
  poor: "text-rose-400",
};

const TONE_RING: Record<"good" | "warn" | "poor", string> = {
  good: "stroke-emerald-400",
  warn: "stroke-amber-400",
  poor: "stroke-rose-400",
};

export function AeoScoreCard({
  projectId,
  domain,
}: {
  projectId: string;
  domain: string;
}) {
  useEffect(() => {
    ensureAeoBootstrap({ projectId, domain });
  }, [projectId, domain]);

  const snapshot = useAeoStore((s) => s.byProject[projectId]?.[0]);

  if (!snapshot) {
    return (
      <div className="flex flex-col gap-3 rounded-xl bg-surface-container-high p-5">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-molten-primary" />
          <h3 className="text-title-md font-semibold text-on-surface">
            AEO Score
          </h3>
        </div>
        <p className="text-body-sm text-text-muted">Caricamento snapshot AEO…</p>
      </div>
    );
  }

  const tone = scoreTone(snapshot.aeoScore);
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const dashOffset =
    circumference - (circumference * snapshot.aeoScore) / 100;

  const delta =
    snapshot.prevAeoScore !== null
      ? snapshot.aeoScore - snapshot.prevAeoScore
      : null;

  const ownership = snapshot.ownership;

  return (
    <div className="flex flex-col gap-4 rounded-xl bg-surface-container-high p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-molten-primary" />
          <h3 className="text-title-md font-semibold text-on-surface">
            AEO Score
          </h3>
          <button
            type="button"
            className="text-text-muted hover:text-on-surface"
            title="% keyword owned almeno 1 SERP feature / kw con SERP feature presente"
          >
            <HelpCircle className="h-3.5 w-3.5" />
          </button>
          {snapshot.source === "stub" && (
            <span className="rounded-full bg-surface-container-low px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-text-muted">
              STUB
            </span>
          )}
        </div>
        <Link
          href={`/projects/${projectId}/aeo`}
          className="flex items-center gap-1 text-label-md text-text-muted hover:text-on-surface"
        >
          Apri modulo
          <ChevronRight className="h-3 w-3" />
        </Link>
      </div>

      <div className="flex items-center gap-5">
        <div
          className="relative flex h-20 w-20 shrink-0 items-center justify-center"
          title="AEO Score 0-100"
        >
          <svg className="h-20 w-20 -rotate-90" viewBox="0 0 64 64">
            <circle
              cx="32"
              cy="32"
              r={radius}
              fill="none"
              strokeWidth="6"
              className="stroke-surface-container-low"
            />
            <circle
              cx="32"
              cy="32"
              r={radius}
              fill="none"
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              className={cn("transition-all duration-500", TONE_RING[tone])}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center leading-none">
            <span className={cn("text-title-lg font-bold", TONE_TEXT[tone])}>
              {snapshot.aeoScore}
            </span>
            <span className="mt-0.5 text-[8px] uppercase tracking-widest text-text-muted">
              / 100
            </span>
          </div>
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          {delta !== null && delta !== 0 ? (
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
            <span className="text-label-md text-text-muted">
              prima rilevazione
            </span>
          )}
          <p className="text-label-sm text-text-muted">
            {snapshot.opportunities.length} opportunit{snapshot.opportunities.length === 1 ? "à" : "à"} aperte
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <CounterPill
          label="AI Overview"
          owned={ownership.aiOverviewOwned}
          present={ownership.aiOverviewPresent}
        />
        <CounterPill
          label="Featured Snip"
          owned={ownership.featuredSnippetOwned}
          present={ownership.featuredSnippetPresent}
        />
        <CounterPill
          label="PAA"
          owned={null}
          present={ownership.paaPresent}
        />
      </div>
    </div>
  );
}

function CounterPill({
  label,
  owned,
  present,
}: {
  label: string;
  owned: number | null;
  present: number;
}) {
  return (
    <div className="flex flex-col items-center gap-0.5 rounded-md bg-surface-container-low px-2 py-2">
      <span className="text-[10px] uppercase tracking-wider text-text-muted">
        {label}
      </span>
      {owned !== null ? (
        <span className="flex items-center gap-1 font-mono text-label-md text-on-surface">
          <Star className="h-3 w-3 text-emerald-400" />
          <span className="font-semibold">{owned}</span>
          <span className="text-text-muted">/ {present}</span>
        </span>
      ) : (
        <span className="font-mono text-label-md font-semibold text-on-surface">
          {present}
        </span>
      )}
    </div>
  );
}
