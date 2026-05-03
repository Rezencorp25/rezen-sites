"use client";

import { use } from "react";
import Link from "next/link";
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  Clock,
  Info,
  Loader2,
  Sparkles,
  TriangleAlert,
  Smartphone,
  Monitor,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip as ReTooltip,
  CartesianGrid,
} from "recharts";
import { useProjectsStore } from "@/lib/stores/projects-store";
import { useAuditsStore } from "@/lib/stores/audits-store";
import { useSiteAudit } from "@/lib/audit/use-site-audit";
import {
  healthBucket,
  type AuditSeverity,
  type SiteAuditDoc,
} from "@/lib/audit/audit-types";
import { cn } from "@/lib/utils";

const SEV_META: Record<
  AuditSeverity,
  { label: string; tone: string; icon: LucideIcon }
> = {
  critical: {
    label: "Critico",
    tone: "text-rose-400",
    icon: AlertCircle,
  },
  warning: {
    label: "Warning",
    tone: "text-amber-400",
    icon: AlertTriangle,
  },
  info: {
    label: "Info",
    tone: "text-sky-400",
    icon: Info,
  },
};

const BUCKET_COLOR = {
  good: "text-emerald-400",
  warn: "text-amber-400",
  poor: "text-rose-400",
} as const;

export default function SiteAuditPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = use(params);
  const project = useProjectsStore((s) => s.getById(projectId));
  const audits = useAuditsStore((s) => s.list(projectId));
  const { run, running } = useSiteAudit(projectId);

  if (!project) {
    return (
      <div className="p-10 text-body-md text-text-muted">
        Progetto non trovato.
      </div>
    );
  }

  const latest = audits[0];
  const url = project.domain.startsWith("http")
    ? project.domain
    : `https://${project.domain}`;

  return (
    <div className="mx-auto max-w-7xl px-10 py-10">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <Link
            href={`/projects/${projectId}/dashboard`}
            className="flex items-center gap-1 text-label-md text-text-muted hover:text-on-surface"
          >
            <ArrowLeft className="h-3 w-3" />
            Dashboard
          </Link>
          <h1 className="flex items-center gap-2 text-headline-md font-bold text-on-surface">
            <Activity className="h-6 w-6 text-molten-primary" />
            Site Audit
          </h1>
          <p className="text-body-md text-secondary-text">
            Monitor health del sito · Lighthouse via PageSpeed Insights
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => run({ url, strategy: "desktop" })}
            disabled={running}
            className="flex items-center gap-2 rounded-lg bg-surface-container-high px-4 py-2.5 text-body-sm font-semibold text-on-surface transition-colors hover:bg-surface-container-highest disabled:cursor-not-allowed disabled:opacity-50"
          >
            {running ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Monitor className="h-4 w-4" />
            )}
            Desktop
          </button>
          <button
            type="button"
            onClick={() => run({ url, strategy: "mobile" })}
            disabled={running}
            className="flex items-center gap-2 rounded-lg bg-molten-primary px-4 py-2.5 text-body-sm font-bold text-on-molten transition-colors hover:bg-molten-primary-container disabled:cursor-not-allowed disabled:opacity-50"
          >
            {running ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Smartphone className="h-4 w-4" />
            )}
            Mobile
          </button>
        </div>
      </div>

      {!latest ? (
        <EmptyState onLaunch={() => run({ url, strategy: "mobile" })} running={running} />
      ) : (
        <div className="grid gap-4 lg:grid-cols-3">
          <ScoresPanel latest={latest} />
          <CwvPanel latest={latest} />
          <HistoryChart audits={audits} />
          <OpportunitiesPanel latest={latest} />
          <HistoryList audits={audits} />
        </div>
      )}
    </div>
  );
}

function ScoreRing({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  const r = 26;
  const c = 2 * Math.PI * r;
  const off = c - (c * value) / 100;
  const tone =
    value >= 80
      ? "stroke-emerald-400"
      : value >= 60
        ? "stroke-amber-400"
        : "stroke-rose-400";
  const text =
    value >= 80
      ? "text-emerald-400"
      : value >= 60
        ? "text-amber-400"
        : "text-rose-400";
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative h-20 w-20">
        <svg viewBox="0 0 60 60" className="-rotate-90">
          <circle
            cx="30"
            cy="30"
            r={r}
            fill="none"
            strokeWidth="5"
            className="stroke-surface-container-low"
          />
          <circle
            cx="30"
            cy="30"
            r={r}
            fill="none"
            strokeWidth="5"
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={off}
            className={cn("transition-all duration-500", tone)}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={cn("text-title-lg font-bold", text)}>{value}</span>
        </div>
      </div>
      <span className="text-label-sm text-text-muted">{label}</span>
    </div>
  );
}

function ScoresPanel({ latest }: { latest: SiteAuditDoc }) {
  const bucket = healthBucket(latest.healthScore);
  return (
    <div className="flex flex-col gap-5 rounded-xl bg-surface-container-high p-6 lg:col-span-1">
      <div className="flex items-center justify-between">
        <h3 className="text-title-md font-semibold text-on-surface">
          Lighthouse scores
        </h3>
        <span className="text-label-sm text-text-muted uppercase tracking-widest">
          {latest.strategy}
        </span>
      </div>

      <div className="flex flex-col items-center gap-1 rounded-lg bg-surface-container-low p-5">
        <span className="text-label-md uppercase tracking-widest text-text-muted">
          Health score
        </span>
        <span className={cn("text-display-sm font-bold", BUCKET_COLOR[bucket])}>
          {latest.healthScore}
        </span>
        <span className="text-label-sm text-text-muted">/ 100</span>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <ScoreRing label="Performance" value={latest.scores.performance} />
        <ScoreRing label="SEO" value={latest.scores.seo} />
        <ScoreRing label="Accessibility" value={latest.scores.accessibility} />
        <ScoreRing label="Best Practices" value={latest.scores.bestPractices} />
      </div>

      {latest.source === "psi-stub" && (
        <p className="rounded-md bg-surface-container-low px-3 py-2 text-label-sm text-text-muted">
          Dati simulati (stub). Configurare <code>PSI_API_KEY</code> in Secret
          Manager per audit reali.
        </p>
      )}
    </div>
  );
}

function CwvPanel({ latest }: { latest: SiteAuditDoc }) {
  const items = [
    { k: "LCP", v: latest.cwv.lcp, unit: "ms", good: 2500, poor: 4000 },
    { k: "INP", v: latest.cwv.inp, unit: "ms", good: 200, poor: 500 },
    { k: "CLS", v: latest.cwv.cls, unit: "", good: 0.1, poor: 0.25 },
    { k: "TTFB", v: latest.cwv.ttfb, unit: "ms", good: 800, poor: 1800 },
    { k: "FCP", v: latest.cwv.fcp, unit: "ms", good: 1800, poor: 3000 },
  ];
  return (
    <div className="flex flex-col gap-3 rounded-xl bg-surface-container-high p-6 lg:col-span-1">
      <h3 className="text-title-md font-semibold text-on-surface">
        Core Web Vitals
      </h3>
      <div className="flex flex-col gap-2">
        {items.map((it) => {
          const ok = it.v !== null && it.v <= it.good;
          const warn = it.v !== null && it.v > it.good && it.v <= it.poor;
          const tone = ok
            ? "text-emerald-400"
            : warn
              ? "text-amber-400"
              : "text-rose-400";
          return (
            <div
              key={it.k}
              className="flex items-baseline justify-between rounded-md bg-surface-container-low px-3 py-2"
            >
              <span className="text-label-md font-semibold text-on-surface">
                {it.k}
              </span>
              <span className={cn("font-mono text-body-sm", tone)}>
                {it.v !== null ? `${formatVital(it.v)}${it.unit}` : "n/a"}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function formatVital(n: number): string {
  if (n < 1) return n.toFixed(2);
  return Math.round(n).toLocaleString("it-IT");
}

function HistoryChart({ audits }: { audits: SiteAuditDoc[] }) {
  const data = [...audits]
    .reverse()
    .map((a) => ({
      ts: a.createdAt.toLocaleDateString("it-IT", {
        day: "2-digit",
        month: "short",
      }),
      health: a.healthScore,
      perf: a.scores.performance,
      seo: a.scores.seo,
    }));

  return (
    <div className="flex flex-col gap-3 rounded-xl bg-surface-container-high p-6 lg:col-span-1">
      <h3 className="text-title-md font-semibold text-on-surface">
        Trend health score
      </h3>
      {data.length < 2 ? (
        <p className="text-body-sm text-text-muted">
          Servono almeno 2 audit per disegnare il trend.
        </p>
      ) : (
        <div className="h-44">
          <ResponsiveContainer>
            <LineChart data={data} margin={{ top: 4, right: 4, bottom: 4, left: -12 }}>
              <CartesianGrid stroke="#ffffff10" vertical={false} />
              <XAxis
                dataKey="ts"
                stroke="#9aa0a6"
                fontSize={11}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                domain={[0, 100]}
                stroke="#9aa0a6"
                fontSize={11}
                tickLine={false}
                axisLine={false}
              />
              <ReTooltip
                contentStyle={{
                  background: "#1a1a1c",
                  border: "1px solid #ffffff15",
                  borderRadius: 8,
                  fontSize: 12,
                }}
                labelStyle={{ color: "#9aa0a6" }}
              />
              <Line
                type="monotone"
                dataKey="health"
                stroke="#ff8533"
                strokeWidth={2.5}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="perf"
                stroke="#6ea8ff"
                strokeWidth={1.5}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="seo"
                stroke="#5ec27f"
                strokeWidth={1.5}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

function OpportunitiesPanel({ latest }: { latest: SiteAuditDoc }) {
  const counts = latest.opportunities.reduce(
    (acc, o) => {
      acc[o.severity] += 1;
      return acc;
    },
    { critical: 0, warning: 0, info: 0 } as Record<AuditSeverity, number>,
  );

  return (
    <div className="flex flex-col gap-4 rounded-xl bg-surface-container-high p-6 lg:col-span-2">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-title-md font-semibold text-on-surface">
          Raccomandazioni
        </h3>
        <div className="flex items-center gap-3 text-label-sm">
          {(Object.keys(counts) as AuditSeverity[])
            .filter((s) => counts[s] > 0)
            .map((s) => {
              const { icon: Icon, tone, label } = SEV_META[s];
              return (
                <span
                  key={s}
                  className={cn("flex items-center gap-1.5", tone)}
                >
                  <Icon className="h-3 w-3" />
                  <span className="font-semibold">{counts[s]}</span>
                  <span className="text-text-muted">{label}</span>
                </span>
              );
            })}
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        {latest.opportunities.map((opp) => {
          const { icon: Icon, tone } = SEV_META[opp.severity];
          return (
            <div
              key={opp.id}
              className="group flex items-start gap-3 rounded-lg bg-surface-container-low px-4 py-3 hover:bg-surface-container-lowest"
            >
              <Icon className={cn("mt-0.5 h-4 w-4 shrink-0", tone)} />
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="text-body-sm font-semibold text-on-surface">
                  {opp.title}
                </span>
                <span className="text-label-sm leading-relaxed text-secondary-text">
                  {opp.description}
                </span>
              </div>
              {opp.estimatedSavingsMs !== undefined && (
                <span className="flex shrink-0 items-center gap-1 rounded-md bg-surface-container px-2 py-0.5 font-mono text-label-sm text-text-muted">
                  <Clock className="h-3 w-3" />
                  −{opp.estimatedSavingsMs}ms
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function HistoryList({ audits }: { audits: SiteAuditDoc[] }) {
  const currentId = audits[0]?.id;
  return (
    <div className="flex flex-col gap-3 rounded-xl bg-surface-container-high p-6 lg:col-span-1">
      <div className="flex items-baseline justify-between">
        <h3 className="text-title-md font-semibold text-on-surface">Storico</h3>
        <span className="text-label-sm text-text-muted">{audits.length}</span>
      </div>
      <div className="flex flex-col gap-1">
        {audits.map((a) => {
          const bucket = healthBucket(a.healthScore);
          const isCurrent = a.id === currentId;
          return (
            <div
              key={a.id}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2.5 transition-colors",
                isCurrent
                  ? "bg-molten-primary/10 ring-1 ring-molten-primary/25"
                  : "bg-surface-container-low hover:bg-surface-container-lowest",
              )}
            >
              <span
                className={cn(
                  "text-title-md font-bold tabular-nums",
                  BUCKET_COLOR[bucket],
                )}
              >
                {a.healthScore}
              </span>
              <div className="flex min-w-0 flex-1 flex-col leading-tight">
                <span className="flex items-center gap-1.5 text-label-md text-on-surface">
                  <span className="capitalize">{a.strategy}</span>
                  <span className="text-text-muted">·</span>
                  <span className="font-mono">{formatDateTime(a.createdAt)}</span>
                </span>
                <span className="text-label-sm text-text-muted">
                  {a.opportunities.length} raccomandazioni
                  {a.source === "psi-stub" && (
                    <span className="ml-1.5 rounded-sm bg-surface-container px-1 py-0.5 font-mono text-[10px] uppercase text-text-muted">
                      stub
                    </span>
                  )}
                </span>
              </div>
              {isCurrent && (
                <span className="rounded-full bg-molten-primary/20 px-2 py-0.5 text-label-sm font-semibold uppercase tracking-widest text-molten-primary">
                  in vista
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function formatDateTime(d: Date): string {
  const date = d.toLocaleDateString("it-IT", { day: "2-digit", month: "short" });
  const time = d.toLocaleTimeString("it-IT", {
    hour: "2-digit",
    minute: "2-digit",
  });
  return `${date} ${time}`;
}

function EmptyState({
  onLaunch,
  running,
}: {
  onLaunch: () => void;
  running: boolean;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-xl bg-surface-container-high px-10 py-16 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-molten-primary/10 ring-1 ring-molten-primary/30">
        <TriangleAlert className="h-6 w-6 text-molten-primary" />
      </span>
      <div className="flex max-w-md flex-col gap-1">
        <h2 className="text-title-lg font-bold text-on-surface">
          Nessun audit ancora
        </h2>
        <p className="text-body-sm text-text-muted">
          Lancia il primo audit Lighthouse per vedere health score, Core Web
          Vitals e raccomandazioni concrete su SEO, performance, accessibilità.
        </p>
      </div>
      <button
        type="button"
        onClick={onLaunch}
        disabled={running}
        className="flex items-center gap-2 rounded-lg bg-molten-primary px-5 py-2.5 text-body-sm font-bold text-on-molten transition-colors hover:bg-molten-primary-container disabled:cursor-not-allowed disabled:opacity-50"
      >
        {running ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Sparkles className="h-4 w-4" />
        )}
        Lancia primo audit
      </button>
    </div>
  );
}
