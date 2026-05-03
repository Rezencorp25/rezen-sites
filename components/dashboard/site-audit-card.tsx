"use client";

import Link from "next/link";
import { Activity, ChevronRight, Loader2, Sparkles } from "lucide-react";
import { useAuditsStore } from "@/lib/stores/audits-store";
import { useSiteAudit } from "@/lib/audit/use-site-audit";
import { healthBucket } from "@/lib/audit/audit-types";
import { cn } from "@/lib/utils";

const BUCKET_COLOR: Record<"good" | "warn" | "poor", string> = {
  good: "text-emerald-400",
  warn: "text-amber-400",
  poor: "text-rose-400",
};

const BUCKET_RING: Record<"good" | "warn" | "poor", string> = {
  good: "stroke-emerald-400",
  warn: "stroke-amber-400",
  poor: "stroke-rose-400",
};

export function SiteAuditCard({
  projectId,
  url,
}: {
  projectId: string;
  url: string;
}) {
  const latest = useAuditsStore((s) => s.latest(projectId));
  const { run, running } = useSiteAudit(projectId);

  const score = latest?.healthScore ?? null;
  const bucket = score !== null ? healthBucket(score) : null;
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const dashOffset =
    score !== null
      ? circumference - (circumference * score) / 100
      : circumference;

  return (
    <div className="flex flex-col gap-4 rounded-xl bg-surface-container-high p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-molten-primary" />
          <h3 className="text-title-md font-semibold text-on-surface">
            Site Audit
          </h3>
        </div>
        <Link
          href={`/projects/${projectId}/dashboard/site-audit`}
          className="flex items-center gap-1 text-label-md text-text-muted hover:text-on-surface"
        >
          Storico
          <ChevronRight className="h-3 w-3" />
        </Link>
      </div>

      <div className="flex items-center gap-5">
        <div className="relative flex h-20 w-20 shrink-0 items-center justify-center">
          <svg className="h-20 w-20 -rotate-90" viewBox="0 0 64 64">
            <circle
              cx="32"
              cy="32"
              r={radius}
              fill="none"
              strokeWidth="6"
              className="stroke-surface-container-low"
            />
            {score !== null && bucket && (
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
            )}
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span
              className={cn(
                "text-title-lg font-bold",
                bucket ? BUCKET_COLOR[bucket] : "text-text-muted",
              )}
            >
              {score !== null ? score : "—"}
            </span>
          </div>
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          {latest ? (
            <>
              <p className="truncate text-label-md text-text-muted">
                Ultimo audit · {latest.strategy}
              </p>
              <div className="flex flex-wrap gap-x-3 gap-y-1 text-label-sm text-secondary-text">
                <span>Perf {latest.scores.performance}</span>
                <span>SEO {latest.scores.seo}</span>
                <span>A11y {latest.scores.accessibility}</span>
                <span>BP {latest.scores.bestPractices}</span>
              </div>
              <p className="text-label-sm text-text-muted">
                {latest.opportunities.length} raccomandazioni ·{" "}
                {timeAgo(latest.createdAt)}
              </p>
            </>
          ) : (
            <p className="text-body-sm text-text-muted">
              Nessun audit ancora. Lancia il primo per ottenere il punteggio
              salute del sito.
            </p>
          )}
        </div>
      </div>

      <button
        type="button"
        onClick={() => run({ url, strategy: "mobile" })}
        disabled={running}
        className={cn(
          "flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-body-sm font-semibold transition-all",
          running
            ? "cursor-not-allowed bg-surface-container-low text-text-muted"
            : "bg-molten-primary/15 text-molten-primary hover:bg-molten-primary/25",
        )}
      >
        {running ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Audit in corso…
          </>
        ) : (
          <>
            <Sparkles className="h-4 w-4" />
            {latest ? "Lancia nuovo audit" : "Lancia primo audit"}
          </>
        )}
      </button>
    </div>
  );
}

function timeAgo(d: Date): string {
  const diff = Date.now() - d.getTime();
  const m = Math.round(diff / 60000);
  if (m < 1) return "ora";
  if (m < 60) return `${m} min fa`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h fa`;
  return `${Math.round(h / 24)}gg fa`;
}
