"use client";

import { useEffect, useMemo } from "react";
import Link from "next/link";
import { ArrowDownRight, ArrowUpRight, ChevronRight, Search } from "lucide-react";
import { useSeoStore, ensureSeoBootstrap } from "@/lib/stores/seo-store";
import { authorityBucket } from "@/lib/seo/vf-authority";
import { cn } from "@/lib/utils";

const BUCKET_TONE: Record<"good" | "warn" | "poor", string> = {
  good: "text-emerald-400",
  warn: "text-amber-400",
  poor: "text-rose-400",
};
const BUCKET_RING: Record<"good" | "warn" | "poor", string> = {
  good: "stroke-emerald-400",
  warn: "stroke-amber-400",
  poor: "stroke-rose-400",
};

const DIST_LABEL: Record<string, string> = {
  top3: "Top 3",
  top10: "Top 10",
  top20: "Top 20",
  top100: "Top 100",
  beyond: "Oltre",
};
const DIST_TONE: Record<string, string> = {
  top3: "bg-emerald-400",
  top10: "bg-emerald-300/70",
  top20: "bg-amber-300/70",
  top100: "bg-amber-400/40",
  beyond: "bg-rose-400/40",
};

export function SeoOverviewCard({
  projectId,
  domain,
}: {
  projectId: string;
  domain: string;
}) {
  useEffect(() => {
    ensureSeoBootstrap({ projectId, domain });
  }, [projectId, domain]);

  const snapshot = useSeoStore((s) => s.byProject[projectId]?.[0]);

  const distEntries = useMemo(() => {
    if (!snapshot) return [];
    const total = Object.values(snapshot.distribution).reduce((a, b) => a + b, 0);
    return (Object.keys(snapshot.distribution) as Array<keyof typeof snapshot.distribution>).map(
      (k) => ({
        key: k as string,
        count: snapshot.distribution[k],
        pct: total === 0 ? 0 : (snapshot.distribution[k] / total) * 100,
      }),
    );
  }, [snapshot]);

  if (!snapshot) {
    return (
      <div className="flex flex-col gap-3 rounded-xl bg-surface-container-high p-5">
        <div className="flex items-center gap-2">
          <Search className="h-4 w-4 text-molten-primary" />
          <h3 className="text-title-md font-semibold text-on-surface">SEO Overview</h3>
        </div>
        <p className="text-body-sm text-text-muted">Caricamento snapshot SEO…</p>
      </div>
    );
  }

  const bucket = authorityBucket(snapshot.authority.score);
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const dashOffset =
    circumference - (circumference * snapshot.authority.score) / 100;

  const visibilityDelta =
    snapshot.prevVisibilityScore !== null
      ? snapshot.visibilityScore - snapshot.prevVisibilityScore
      : null;

  return (
    <div className="flex flex-col gap-4 rounded-xl bg-surface-container-high p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <Search className="h-4 w-4 text-molten-primary" />
          <h3 className="text-title-md font-semibold text-on-surface">SEO Overview</h3>
          {snapshot.source === "stub" && (
            <span className="rounded-full bg-surface-container-low px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-text-muted">
              STUB
            </span>
          )}
        </div>
        <Link
          href={`/projects/${projectId}/seo`}
          className="flex items-center gap-1 text-label-md text-text-muted hover:text-on-surface"
        >
          Apri modulo
          <ChevronRight className="h-3 w-3" />
        </Link>
      </div>

      <div className="flex items-center gap-5">
        <div
          className="relative flex h-20 w-20 shrink-0 items-center justify-center"
          title={`LinkPower ${snapshot.authority.components.linkPower} · Traffic ${snapshot.authority.components.traffic} · NaturalProfile ${snapshot.authority.components.naturalProfile}`}
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
              className={cn("transition-all duration-500", BUCKET_RING[bucket])}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center leading-none">
            <span className={cn("text-title-lg font-bold", BUCKET_TONE[bucket])}>
              {snapshot.authority.score}
            </span>
            <span className="mt-0.5 text-[8px] uppercase tracking-widest text-text-muted">
              VF Auth
            </span>
          </div>
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <p className="truncate text-label-md text-text-muted">
            ETV{" "}
            <span className="font-mono font-semibold text-on-surface">
              {snapshot.estimatedTraffic.toLocaleString("it-IT")}
            </span>{" "}
            click/mese stimati
          </p>
          <div className="flex items-center gap-2">
            <span className="text-title-md font-bold text-on-surface">
              {snapshot.visibilityScore.toFixed(1)}%
            </span>
            <span className="text-label-sm text-text-muted">Visibility</span>
            {visibilityDelta !== null && visibilityDelta !== 0 && (
              <span
                className={cn(
                  "flex items-center gap-0.5 text-label-sm font-semibold",
                  visibilityDelta > 0 ? "text-emerald-400" : "text-rose-400",
                )}
              >
                {visibilityDelta > 0 ? (
                  <ArrowUpRight className="h-3 w-3" />
                ) : (
                  <ArrowDownRight className="h-3 w-3" />
                )}
                {Math.abs(visibilityDelta).toFixed(1)}
              </span>
            )}
          </div>
          <p className="text-label-sm text-text-muted">
            {snapshot.keywords.length} keyword tracciate ·{" "}
            {snapshot.competitors.length} competitor
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-1.5 rounded-md bg-surface-container-low px-3 py-2.5">
        <div className="flex items-center justify-between text-label-sm">
          <span className="text-text-muted">Distribuzione posizioni</span>
          <span className="font-mono text-on-surface">
            {snapshot.keywords.length} kw
          </span>
        </div>
        <div className="flex h-2 overflow-hidden rounded-full bg-surface-container-lowest">
          {distEntries.map((d) =>
            d.pct > 0 ? (
              <div
                key={d.key}
                className={cn("h-full", DIST_TONE[d.key])}
                style={{ width: `${d.pct}%` }}
                title={`${DIST_LABEL[d.key]}: ${d.count}`}
              />
            ) : null,
          )}
        </div>
        <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[10px] uppercase tracking-wider text-text-muted">
          {distEntries.map((d) => (
            <span key={d.key} className="flex items-center gap-1">
              <span className={cn("h-1.5 w-1.5 rounded-full", DIST_TONE[d.key])} />
              {DIST_LABEL[d.key]} <span className="text-on-surface">{d.count}</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
