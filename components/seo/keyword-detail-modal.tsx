"use client";

import { useMemo } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip as RTooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  ArrowDown,
  ArrowUp,
  Camera,
  ExternalLink,
  HelpCircle,
  Image as ImageIcon,
  Minus,
  Sparkles,
  Star,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { KeywordRank, KeywordDrill } from "@/lib/seo/rank-types";
import type { SerpFeatureFlags } from "@/lib/seo/seo-types";
import { cn } from "@/lib/utils";

const INTENT_LABEL: Record<KeywordRank["intent"], string> = {
  informational: "Informational",
  navigational: "Navigational",
  transactional: "Transactional",
  commercial: "Commercial",
};

const INTENT_TONE: Record<KeywordRank["intent"], string> = {
  informational: "bg-blue-400/15 text-blue-300",
  navigational: "bg-violet-400/15 text-violet-300",
  transactional: "bg-emerald-400/15 text-emerald-300",
  commercial: "bg-amber-400/15 text-amber-300",
};

type Props = {
  keyword: KeywordRank | null;
  drill: KeywordDrill | null;
  open: boolean;
  onClose: () => void;
};

function PositionPill({ pos, large }: { pos: number; large?: boolean }) {
  if (pos === 0) {
    return (
      <span
        className={cn(
          "rounded text-rose-300",
          large ? "bg-rose-400/10 px-2 py-1 text-title-md font-semibold" : "px-1.5 py-0.5 text-label-sm",
        )}
      >
        fuori top 100
      </span>
    );
  }
  return (
    <span
      className={cn(
        "rounded font-mono font-semibold",
        large ? "px-2 py-1 text-title-md" : "px-1.5 py-0.5 text-label-sm",
        pos <= 3
          ? "bg-emerald-400/15 text-emerald-300"
          : pos <= 10
            ? "bg-emerald-300/10 text-emerald-200/80"
            : pos <= 20
              ? "bg-amber-300/10 text-amber-200"
              : "bg-rose-400/10 text-rose-300",
      )}
    >
      #{pos}
    </span>
  );
}

function DeltaPill({
  current,
  prev,
  label,
}: {
  current: number;
  prev: number | null;
  label: string;
}) {
  const delta = useMemo(() => {
    if (prev === null) return null;
    if (current === 0 && prev === 0) return null;
    if (current === 0) return -1;
    if (prev === 0) return 1;
    return prev - current;
  }, [current, prev]);

  let body;
  if (delta === null) {
    body = (
      <span className="flex items-center gap-1 text-text-muted">
        <Minus className="h-3 w-3" />
        n/d
      </span>
    );
  } else if (delta === 0) {
    body = (
      <span className="flex items-center gap-1 text-text-muted">
        <Minus className="h-3 w-3" />
        invariato
      </span>
    );
  } else {
    const isUp = delta > 0;
    body = (
      <span
        className={cn(
          "flex items-center gap-1 font-mono font-semibold",
          isUp ? "text-emerald-400" : "text-rose-400",
        )}
      >
        {isUp ? <ArrowUp className="h-3.5 w-3.5" /> : <ArrowDown className="h-3.5 w-3.5" />}
        {Math.abs(delta)}
      </span>
    );
  }

  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-label-sm text-text-muted">{label}</span>
      {body}
    </div>
  );
}

function SerpFeatureBadge({ features }: { features: SerpFeatureFlags }) {
  const items: Array<{ key: string; label: string; owner: boolean }> = [];
  if (features.aiOverview) {
    items.push({
      key: "aio",
      label: "AI Overview",
      owner: !!features.aiOverviewOwner,
    });
  }
  if (features.featuredSnippet) {
    items.push({
      key: "snip",
      label: "Featured Snippet",
      owner: !!features.featuredSnippetOwner,
    });
  }
  if (features.paa) {
    items.push({ key: "paa", label: "People Also Ask", owner: false });
  }
  if (features.adsPack) {
    items.push({ key: "ads", label: "Ads pack", owner: false });
  }
  if (features.knowledgePanel) {
    items.push({ key: "kp", label: "Knowledge Panel", owner: false });
  }
  if (items.length === 0) {
    return (
      <span className="text-label-sm text-text-muted">
        Nessuna SERP feature presente
      </span>
    );
  }
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((it) => (
        <span
          key={it.key}
          className={cn(
            "flex items-center gap-1 rounded px-2 py-1 text-label-sm",
            it.owner
              ? "bg-emerald-400/15 text-emerald-300"
              : "bg-surface-container-low text-text-muted",
          )}
        >
          {it.owner && <Star className="h-3 w-3" />}
          {it.label}
          {it.owner && <span className="text-[10px] uppercase">owned</span>}
        </span>
      ))}
    </div>
  );
}

export function KeywordDetailModal({ keyword, drill, open, onClose }: Props) {
  if (!keyword) return null;

  const chartData = keyword.history.map((h) => ({
    date: h.date,
    pos: h.position === 0 ? 101 : h.position,
  }));
  const chartMin = Math.min(...chartData.map((d) => d.pos), keyword.position || 1);
  const chartMax = Math.max(...chartData.map((d) => d.pos), keyword.position || 1);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="!w-[min(90vw,920px)] !max-w-none max-h-[88vh] overflow-y-auto bg-surface-container-high p-0">
        <DialogHeader className="border-b border-surface-container-low p-6">
          <DialogTitle className="flex flex-wrap items-start gap-4">
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={cn(
                    "rounded px-1.5 py-0.5 text-[10px] font-bold uppercase",
                    INTENT_TONE[keyword.intent],
                  )}
                >
                  {INTENT_LABEL[keyword.intent]}
                </span>
                <h2 className="truncate text-title-lg font-bold text-on-surface">
                  {keyword.keyword}
                </h2>
              </div>
              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-label-md">
                <span className="text-text-muted">
                  Volume:{" "}
                  <span className="font-mono text-on-surface">
                    {keyword.searchVolume.toLocaleString("it-IT")}
                  </span>
                  /mese
                </span>
                {keyword.url && (
                  <a
                    href={keyword.url}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="flex items-center gap-1 font-mono text-molten-primary hover:underline"
                  >
                    URL ranking
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex flex-col gap-0.5">
                <span className="text-label-sm text-text-muted">Posizione</span>
                <PositionPill pos={keyword.position} large />
              </div>
              <DeltaPill
                current={keyword.position}
                prev={keyword.position7dAgo}
                label="Δ 7gg"
              />
              <DeltaPill
                current={keyword.position}
                prev={keyword.position30dAgo}
                label="Δ 30gg"
              />
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-5 p-6">
          <section>
            <h3 className="mb-3 flex items-center gap-2 text-title-sm font-semibold text-on-surface">
              <Sparkles className="h-4 w-4 text-molten-primary" />
              Trend posizione (30 giorni)
            </h3>
            <div className="h-44 w-full rounded-lg bg-surface-container-low/40 p-3">
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                <AreaChart
                  data={chartData}
                  margin={{ top: 8, right: 12, bottom: 4, left: 0 }}
                >
                  <defs>
                    <linearGradient id="rankGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#fb923c" stopOpacity={0.6} />
                      <stop offset="100%" stopColor="#fb923c" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(255,255,255,0.05)"
                  />
                  <XAxis
                    dataKey="date"
                    stroke="rgba(255,255,255,0.4)"
                    fontSize={10}
                    tickFormatter={(d) => {
                      const dt = new Date(d);
                      return `${dt.getDate()}/${dt.getMonth() + 1}`;
                    }}
                  />
                  <YAxis
                    reversed
                    domain={[Math.max(1, chartMin - 2), chartMax + 2]}
                    stroke="rgba(255,255,255,0.4)"
                    fontSize={10}
                    width={32}
                    tickFormatter={(v) => (v >= 101 ? "—" : `#${v}`)}
                  />
                  <RTooltip
                    contentStyle={{
                      background: "#1a1a1a",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                    formatter={(value) => {
                      const v = typeof value === "number" ? value : Number(value);
                      return v >= 101 ? "fuori top 100" : `posizione #${v}`;
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="pos"
                    stroke="#fb923c"
                    strokeWidth={2}
                    fill="url(#rankGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <p className="mt-1 text-[11px] text-text-muted">
              Asse Y invertito: posizione #1 in alto. "—" = fuori top 100.
            </p>
          </section>

          <section>
            <h3 className="mb-2 text-title-sm font-semibold text-on-surface">
              SERP feature presenti
            </h3>
            <SerpFeatureBadge features={keyword.features} />
          </section>

          {drill?.aiOverviewExcerpt && (
            <section>
              <h3 className="mb-2 flex items-center gap-2 text-title-sm font-semibold text-on-surface">
                <ImageIcon className="h-4 w-4 text-emerald-400" />
                AI Overview content
                {keyword.features.aiOverviewOwner && (
                  <span className="rounded bg-emerald-400/15 px-1.5 py-0.5 text-[10px] font-bold uppercase text-emerald-300">
                    Owned
                  </span>
                )}
              </h3>
              <blockquote className="border-l-2 border-emerald-400/40 bg-surface-container-low/40 p-3 text-body-sm italic text-on-surface">
                {drill.aiOverviewExcerpt}
              </blockquote>
              <p className="mt-1 text-[11px] text-text-muted">
                Estratto stub — sostituito da response live DataForSEO in S5.3
              </p>
            </section>
          )}

          {drill?.paaQuestions && drill.paaQuestions.length > 0 && (
            <section>
              <h3 className="mb-2 flex items-center gap-2 text-title-sm font-semibold text-on-surface">
                <HelpCircle className="h-4 w-4 text-blue-400" />
                People Also Ask
              </h3>
              <ul className="flex flex-col gap-1.5">
                {drill.paaQuestions.map((q) => (
                  <li
                    key={q}
                    className="flex items-start gap-2 rounded bg-surface-container-low/40 px-3 py-2 text-body-sm text-on-surface"
                  >
                    <HelpCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-blue-400" />
                    {q}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {drill && (
            <section>
              <h3 className="mb-2 text-title-sm font-semibold text-on-surface">
                Top 10 SERP (Google)
              </h3>
              <div className="overflow-hidden rounded-lg border border-surface-container-low">
                <table className="w-full text-left text-body-sm">
                  <thead className="bg-surface-container-low/40 text-label-sm uppercase tracking-wider text-text-muted">
                    <tr>
                      <th className="px-3 py-2 text-center font-medium">#</th>
                      <th className="px-3 py-2 font-medium">Risultato</th>
                      <th className="px-3 py-2 font-medium">Dominio</th>
                    </tr>
                  </thead>
                  <tbody>
                    {drill.serpTop10.map((r) => (
                      <tr
                        key={r.position}
                        className={cn(
                          "border-t border-surface-container-low/50",
                          r.isOwner && "bg-molten-primary/5",
                        )}
                      >
                        <td className="px-3 py-2 text-center font-mono">
                          {r.position}
                        </td>
                        <td className="max-w-[420px] px-3 py-2">
                          <a
                            href={r.url}
                            target="_blank"
                            rel="noreferrer noopener"
                            className={cn(
                              "block truncate hover:underline",
                              r.isOwner
                                ? "font-semibold text-molten-primary"
                                : "text-on-surface",
                            )}
                            title={r.title}
                          >
                            {r.title}
                          </a>
                        </td>
                        <td
                          className={cn(
                            "px-3 py-2 font-mono text-label-md",
                            r.isOwner ? "text-molten-primary" : "text-text-muted",
                          )}
                        >
                          {r.isOwner && (
                            <Star className="mr-1 inline h-3 w-3" />
                          )}
                          {r.domain}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {drill && drill.competitors.length > 0 && (
            <section>
              <h3 className="mb-2 text-title-sm font-semibold text-on-surface">
                Competitor URL ranking
              </h3>
              <ul className="flex flex-col gap-1.5">
                {drill.competitors.map((c) => (
                  <li
                    key={c.domain}
                    className="flex items-center justify-between gap-3 rounded bg-surface-container-low/40 px-3 py-2"
                  >
                    <div className="flex min-w-0 flex-col">
                      <span className="text-body-sm text-on-surface">
                        {c.label}
                      </span>
                      {c.url ? (
                        <a
                          href={c.url}
                          target="_blank"
                          rel="noreferrer noopener"
                          className="truncate font-mono text-label-sm text-text-muted hover:text-molten-primary hover:underline"
                          title={c.url}
                        >
                          {c.url.replace(/^https?:\/\//, "")}
                        </a>
                      ) : (
                        <span className="text-label-sm text-text-muted">
                          fuori top 100
                        </span>
                      )}
                    </div>
                    <PositionPill pos={c.position} />
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section>
            <h3 className="mb-2 flex items-center gap-2 text-title-sm font-semibold text-on-surface">
              <Camera className="h-4 w-4 text-text-muted" />
              SERP screenshot
            </h3>
            <div className="flex h-32 items-center justify-center rounded-lg border border-dashed border-surface-container-low bg-surface-container-low/20 text-label-sm text-text-muted">
              Screenshot disponibile post-S5.3 (Cloud Function DataForSEO live)
            </div>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}
