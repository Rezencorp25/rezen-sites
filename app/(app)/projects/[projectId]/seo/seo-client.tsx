"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowDownRight,
  ArrowUpRight,
  Info,
  Loader2,
  RefreshCw,
  Search,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip as RTooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useProjectsStore } from "@/lib/stores/projects-store";
import {
  ensureSeoBootstrap,
  refreshSeoSnapshot,
  useSeoStore,
} from "@/lib/stores/seo-store";
import { authorityBucket } from "@/lib/seo/vf-authority";
import { decomposeContribution } from "@/lib/seo/visibility";
import type { SerpFeatureFlags } from "@/lib/seo/seo-types";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const BUCKET_TONE: Record<"good" | "warn" | "poor", string> = {
  good: "text-emerald-400",
  warn: "text-amber-400",
  poor: "text-rose-400",
};

const DIST_LABEL: Record<string, string> = {
  top3: "Top 3",
  top10: "Top 10",
  top20: "Top 20",
  top100: "Top 100",
  beyond: "Oltre 100",
};
const DIST_TONE: Record<string, string> = {
  top3: "bg-emerald-400",
  top10: "bg-emerald-300/70",
  top20: "bg-amber-300/70",
  top100: "bg-amber-400/40",
  beyond: "bg-rose-400/40",
};

function featurePills(features: SerpFeatureFlags): string[] {
  const pills: string[] = [];
  if (features.aiOverviewOwner) pills.push("AIO ★");
  else if (features.aiOverview) pills.push("AIO");
  if (features.featuredSnippetOwner) pills.push("Snip ★");
  else if (features.featuredSnippet) pills.push("Snip");
  if (features.paa) pills.push("PAA");
  if (features.adsPack) pills.push("Ads");
  return pills;
}

export default function SeoPageClient({ projectId }: { projectId: string }) {
  const project = useProjectsStore((s) => s.getById(projectId));
  const snapshot = useSeoStore((s) => s.byProject[projectId]?.[0]);
  const trend = useSeoStore((s) => s.trendByProject[projectId] ?? []);
  const [running, setRunning] = useState(false);

  const domain = project?.domain ?? "";

  useEffect(() => {
    if (!domain) return;
    ensureSeoBootstrap({ projectId, domain });
  }, [projectId, domain]);

  const decomposition = useMemo(
    () => (snapshot ? decomposeContribution(snapshot.keywords) : []),
    [snapshot],
  );

  const keywordsById = useMemo(() => {
    const map = new Map<string, (typeof snapshot.keywords)[number]>();
    if (!snapshot) return map;
    for (const kw of snapshot.keywords) map.set(kw.id, kw);
    return map;
  }, [snapshot]);

  if (!project) {
    return (
      <div className="p-10 text-body-md text-text-muted">Progetto non trovato.</div>
    );
  }

  if (!snapshot) {
    return (
      <div className="flex h-full items-center justify-center p-10">
        <div className="flex items-center gap-3 text-body-sm text-text-muted">
          <Loader2 className="h-4 w-4 animate-spin" />
          Caricamento snapshot SEO…
        </div>
      </div>
    );
  }

  const bucket = authorityBucket(snapshot.authority.score);
  const totalKw = snapshot.keywords.length;

  const handleRefresh = async () => {
    setRunning(true);
    try {
      await refreshSeoSnapshot({ projectId, domain });
      toast.success("Snapshot SEO aggiornato");
    } catch (e) {
      toast.error("Errore aggiornamento snapshot");
    } finally {
      setRunning(false);
    }
  };

  const visibilityDelta =
    snapshot.prevVisibilityScore !== null
      ? snapshot.visibilityScore - snapshot.prevVisibilityScore
      : null;

  const distEntries = (
    Object.keys(snapshot.distribution) as Array<keyof typeof snapshot.distribution>
  ).map((k) => ({
    key: k as string,
    count: snapshot.distribution[k],
    pct: totalKw === 0 ? 0 : (snapshot.distribution[k] / totalKw) * 100,
  }));

  const competitorBars = [
    {
      label: project.name,
      etv: snapshot.estimatedTraffic,
      authority: snapshot.authority.score,
      isOwner: true,
    },
    ...snapshot.competitors.map((c) => ({
      label: c.label,
      etv: c.estimatedTraffic,
      authority: c.authorityScore,
      isOwner: false,
    })),
  ].sort((a, b) => b.etv - a.etv);
  const maxEtv = competitorBars.reduce((m, c) => Math.max(m, c.etv), 1);

  return (
    <div className="flex h-full flex-col gap-6 px-10 py-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <Search className="h-5 w-5 text-molten-primary" />
            <h1 className="text-headline-md font-bold text-on-surface">SEO</h1>
            <span className="text-label-md text-text-muted">{domain}</span>
            {snapshot.source === "stub" && (
              <span className="rounded-full bg-surface-container-low px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-text-muted">
                STUB
              </span>
            )}
          </div>
          <p className="text-body-sm text-secondary-text">
            Authority, Visibility e benchmark competitor — snapshot{" "}
            <span className="font-mono text-on-surface">
              {snapshot.createdAt.toLocaleString("it-IT")}
            </span>
          </p>
        </div>
        <button
          type="button"
          onClick={handleRefresh}
          disabled={running}
          className={cn(
            "flex items-center gap-2 rounded-md px-3.5 py-2 text-label-md font-medium transition-colors",
            running
              ? "cursor-not-allowed bg-surface-container-low text-text-muted"
              : "bg-molten-primary/15 text-molten-primary hover:bg-molten-primary/25",
          )}
        >
          {running ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <RefreshCw className="h-3.5 w-3.5" />
          )}
          Aggiorna snapshot
        </button>
      </header>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="flex flex-col gap-3 rounded-xl bg-surface-container-high p-5 lg:col-span-2">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-molten-primary" />
            <h2 className="text-title-md font-semibold text-on-surface">
              VerumFlow Authority Score
            </h2>
            <button
              type="button"
              className="flex items-center text-text-muted hover:text-on-surface"
              title="Score 0-100 = 0.55 × LinkPower + 0.30 × Traffic + 0.15 × NaturalProfile (formula brief §3.7)"
            >
              <Info className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="flex items-center gap-6">
            <div className={cn("text-display-md font-bold leading-none", BUCKET_TONE[bucket])}>
              {snapshot.authority.score}
              <span className="ml-1 text-title-md font-medium text-text-muted">/100</span>
            </div>
            <div className="grid flex-1 grid-cols-3 gap-3">
              <ComponentBar
                label="LinkPower"
                value={snapshot.authority.components.linkPower}
                hint={`Domain Rank ${snapshot.authority.components.domainRank}`}
                weight="55%"
              />
              <ComponentBar
                label="Traffic"
                value={snapshot.authority.components.traffic}
                hint={`ETV ${snapshot.estimatedTraffic.toLocaleString("it-IT")}/mo`}
                weight="30%"
              />
              <ComponentBar
                label="Natural Profile"
                value={snapshot.authority.components.naturalProfile}
                hint={`Spam ${snapshot.authority.components.spamScore} · ${snapshot.authority.components.referringDomains} domini`}
                weight="15%"
              />
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2 rounded-xl bg-surface-container-high p-5">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-molten-primary" />
            <h2 className="text-title-md font-semibold text-on-surface">Visibility%</h2>
            <button
              type="button"
              className="flex items-center text-text-muted hover:text-on-surface"
              title="Stima basata su curve CTR settoriali (pos.1 = 35%) — non valore reale"
            >
              <Info className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-display-md font-bold leading-none text-on-surface">
              {snapshot.visibilityScore.toFixed(1)}
              <span className="text-title-md text-text-muted">%</span>
            </span>
            {visibilityDelta !== null && visibilityDelta !== 0 && (
              <span
                className={cn(
                  "flex items-center gap-0.5 text-label-md font-semibold",
                  visibilityDelta > 0 ? "text-emerald-400" : "text-rose-400",
                )}
              >
                {visibilityDelta > 0 ? (
                  <ArrowUpRight className="h-3.5 w-3.5" />
                ) : (
                  <ArrowDownRight className="h-3.5 w-3.5" />
                )}
                {Math.abs(visibilityDelta).toFixed(1)} vs precedente
              </span>
            )}
          </div>
          <p className="text-label-sm text-text-muted">
            ETV{" "}
            <span className="font-mono text-on-surface">
              {snapshot.estimatedTraffic.toLocaleString("it-IT")}
            </span>{" "}
            click/mese stimati
          </p>
        </div>
      </section>

      <section className="rounded-xl bg-surface-container-high p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-title-md font-semibold text-on-surface">
            Trend ultimi 30 giorni
          </h2>
          <span className="text-label-sm text-text-muted">
            Authority · Visibility · ETV
          </span>
        </div>
        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trend} margin={{ top: 8, right: 8, bottom: 8, left: 0 }}>
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
              <Line
                type="monotone"
                dataKey="authority"
                stroke="#fb923c"
                strokeWidth={2}
                dot={false}
                name="VF Authority"
              />
              <Line
                type="monotone"
                dataKey="visibility"
                stroke="#34d399"
                strokeWidth={2}
                dot={false}
                name="Visibility%"
              />
              <Line
                type="monotone"
                dataKey="estimatedTraffic"
                stroke="#60a5fa"
                strokeWidth={2}
                dot={false}
                name="ETV"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-xl bg-surface-container-high p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-title-md font-semibold text-on-surface">
              Distribuzione posizioni
            </h2>
            <span className="text-label-sm text-text-muted">{totalKw} keyword</span>
          </div>
          <div className="flex flex-col gap-2">
            {distEntries.map((d) => (
              <div key={d.key} className="flex items-center gap-3">
                <span className="w-20 text-label-md text-text-muted">
                  {DIST_LABEL[d.key]}
                </span>
                <div className="relative h-5 flex-1 overflow-hidden rounded bg-surface-container-low">
                  <div
                    className={cn("h-full rounded transition-all", DIST_TONE[d.key])}
                    style={{ width: `${Math.max(d.pct, 2)}%` }}
                  />
                </div>
                <span className="w-12 text-right font-mono text-label-md text-on-surface">
                  {d.count}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl bg-surface-container-high p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-title-md font-semibold text-on-surface">
              Benchmark vs Competitor
            </h2>
            <span className="text-label-sm text-text-muted">ETV mensile stimato</span>
          </div>
          <div className="flex flex-col gap-2">
            {competitorBars.map((c) => (
              <div key={c.label} className="flex items-center gap-3">
                <span
                  className={cn(
                    "w-32 truncate text-label-md",
                    c.isOwner ? "font-semibold text-molten-primary" : "text-text-muted",
                  )}
                  title={c.label}
                >
                  {c.label}
                </span>
                <div className="relative h-5 flex-1 overflow-hidden rounded bg-surface-container-low">
                  <div
                    className={cn(
                      "h-full rounded transition-all",
                      c.isOwner ? "bg-molten-primary" : "bg-on-surface/30",
                    )}
                    style={{ width: `${(c.etv / maxEtv) * 100}%` }}
                  />
                </div>
                <span className="w-20 text-right font-mono text-label-md text-on-surface">
                  {c.etv.toLocaleString("it-IT")}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-xl bg-surface-container-high p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-title-md font-semibold text-on-surface">
            Decomposizione contributo Visibility
          </h2>
          <span className="text-label-sm text-text-muted">
            Top {decomposition.length} keyword per click stimati
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-body-sm">
            <thead className="text-label-sm uppercase tracking-wider text-text-muted">
              <tr className="border-b border-surface-container-low">
                <th className="px-3 py-2 font-medium">Keyword</th>
                <th className="px-3 py-2 text-right font-medium">Vol/mese</th>
                <th className="px-3 py-2 text-center font-medium">Pos</th>
                <th className="px-3 py-2 text-center font-medium">SERP</th>
                <th className="px-3 py-2 text-right font-medium">CTR base</th>
                <th className="px-3 py-2 text-right font-medium">CTR adj</th>
                <th className="px-3 py-2 text-right font-medium">Click stim.</th>
                <th className="px-3 py-2 text-right font-medium">Contrib %</th>
              </tr>
            </thead>
            <tbody>
              {decomposition.map((row) => {
                const kw = keywordsById.get(row.keywordId);
                const pills = kw ? featurePills(kw.features) : [];
                return (
                  <tr
                    key={row.keyword}
                    className="border-b border-surface-container-low/50 last:border-0 hover:bg-surface-container-low/30"
                  >
                    <td className="px-3 py-2 text-on-surface">{row.keyword}</td>
                    <td className="px-3 py-2 text-right font-mono text-on-surface">
                      {row.searchVolume.toLocaleString("it-IT")}
                    </td>
                    <td className="px-3 py-2 text-center font-mono">
                      {row.position === 0 ? (
                        <span className="text-text-muted">—</span>
                      ) : (
                        <span
                          className={cn(
                            "rounded px-1.5 py-0.5 text-label-sm font-semibold",
                            row.position <= 3
                              ? "bg-emerald-400/15 text-emerald-300"
                              : row.position <= 10
                                ? "bg-emerald-300/10 text-emerald-200/80"
                                : row.position <= 20
                                  ? "bg-amber-300/10 text-amber-200"
                                  : "bg-rose-400/10 text-rose-300",
                          )}
                        >
                          {row.position}
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-center">
                      <div className="flex flex-wrap justify-center gap-1">
                        {pills.length === 0 ? (
                          <span className="text-text-muted">—</span>
                        ) : (
                          pills.map((p) => (
                            <span
                              key={p}
                              className={cn(
                                "rounded bg-surface-container-low px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                                p.includes("★")
                                  ? "text-emerald-300"
                                  : "text-text-muted",
                              )}
                            >
                              {p}
                            </span>
                          ))
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-2 text-right font-mono text-text-muted">
                      {(row.baseCtr * 100).toFixed(1)}%
                    </td>
                    <td
                      className={cn(
                        "px-3 py-2 text-right font-mono",
                        row.adjustedCtr > row.baseCtr
                          ? "text-emerald-400"
                          : row.adjustedCtr < row.baseCtr
                            ? "text-rose-400"
                            : "text-on-surface",
                      )}
                    >
                      {(row.adjustedCtr * 100).toFixed(1)}%
                    </td>
                    <td className="px-3 py-2 text-right font-mono text-on-surface">
                      {row.estimatedClicks.toLocaleString("it-IT")}
                    </td>
                    <td className="px-3 py-2 text-right font-mono font-semibold text-molten-primary">
                      {row.contributionPct.toFixed(1)}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-label-sm text-text-muted">
          ★ = il sito è proprietario dell'AI Overview o Featured Snippet (CTR
          boost ×1.5). Curva CTR aggiustata da feature SERP: AI Overview ×0.6,
          Featured Snippet ×0.7, Ads pack ×0.8.
        </p>
      </section>
    </div>
  );
}

function ComponentBar({
  label,
  value,
  hint,
  weight,
}: {
  label: string;
  value: number;
  hint: string;
  weight: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between">
        <span className="text-label-sm text-text-muted">{label}</span>
        <span className="text-[10px] uppercase tracking-widest text-text-muted">
          peso {weight}
        </span>
      </div>
      <div className="relative h-2 overflow-hidden rounded-full bg-surface-container-low">
        <div
          className="h-full rounded-full bg-molten-primary"
          style={{ width: `${value}%` }}
        />
      </div>
      <div className="flex items-baseline justify-between">
        <span className="font-mono text-label-md font-semibold text-on-surface">
          {value}
        </span>
        <span className="truncate text-label-sm text-text-muted" title={hint}>
          {hint}
        </span>
      </div>
    </div>
  );
}
