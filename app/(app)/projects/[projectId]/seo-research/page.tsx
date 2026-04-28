"use client";

import { use, useMemo, useState } from "react";
import {
  Telescope,
  Plus,
  Shield,
  ShieldOff,
  Trash2,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import { useSeoResearchStore } from "@/lib/stores/seo-research-store";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GradientButton } from "@/components/luminous/gradient-button";
import { StatusPill } from "@/components/luminous/status-pill";
import { fmtDateLong } from "@/lib/utils/format-date";

export default function SeoResearchPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = use(params);
  const allBacklinks = useSeoResearchStore((s) => s.backlinks);
  const allCompetitors = useSeoResearchStore((s) => s.competitors);
  const addBacklink = useSeoResearchStore((s) => s.addBacklink);
  const toggleDisavow = useSeoResearchStore((s) => s.toggleDisavow);
  const removeBacklink = useSeoResearchStore((s) => s.removeBacklink);
  const addCompetitor = useSeoResearchStore((s) => s.addCompetitor);
  const removeCompetitor = useSeoResearchStore((s) => s.removeCompetitor);

  const backlinks = useMemo(
    () => allBacklinks.filter((b) => b.projectId === projectId),
    [allBacklinks, projectId],
  );
  const competitors = useMemo(
    () => allCompetitors.filter((c) => c.projectId === projectId),
    [allCompetitors, projectId],
  );

  const stats = useMemo(() => {
    const total = backlinks.length;
    const dofollow = backlinks.filter(
      (b) => b.rel === "dofollow" && b.status === "active",
    ).length;
    const toxic = backlinks.filter(
      (b) => b.domainAuthority < 20 && b.status === "active",
    ).length;
    const refDomains = new Set(backlinks.map((b) => b.sourceDomain)).size;
    const avgDA =
      total > 0
        ? Math.round(
            backlinks.reduce((s, b) => s + b.domainAuthority, 0) / total,
          )
        : 0;
    return { total, dofollow, toxic, refDomains, avgDA };
  }, [backlinks]);

  const [bSourceUrl, setBSourceUrl] = useState("");
  const [bAnchor, setBAnchor] = useState("");
  const [cDomain, setCDomain] = useState("");

  return (
    <div className="mx-auto max-w-7xl px-10 py-10">
      <div className="mb-6">
        <div className="flex items-center gap-2 text-label-md uppercase tracking-widest text-text-muted">
          <Telescope className="h-3.5 w-3.5" />
          SEO Research
        </div>
        <h1 className="text-headline-md font-bold text-on-surface">
          Backlink &amp; Competitor
        </h1>
        <p className="text-body-md text-secondary-text">
          Monitor link profile + competitor benchmarking. Integrazione
          Ahrefs/Moz/Semrush al go-live.
        </p>
      </div>

      <div className="mb-5 grid grid-cols-1 gap-3 md:grid-cols-5">
        <Stat label="Backlinks totali" value={stats.total} />
        <Stat label="Dofollow attivi" value={stats.dofollow} />
        <Stat
          label="Tossici (DA<20)"
          value={stats.toxic}
          tone={stats.toxic > 0 ? "warning" : "success"}
        />
        <Stat label="Referring domains" value={stats.refDomains} />
        <Stat label="Avg DA" value={stats.avgDA} />
      </div>

      <section className="mb-5 overflow-hidden rounded-xl bg-surface-container-high">
        <div className="flex items-center justify-between px-6 py-3">
          <h2 className="text-title-md font-semibold text-on-surface">
            Backlink profile ({backlinks.length})
          </h2>
        </div>
        <div className="grid grid-cols-1 gap-2 px-6 pb-3 md:grid-cols-[1fr_1fr_120px_auto]">
          <Input
            value={bSourceUrl}
            onChange={(e) => setBSourceUrl(e.target.value)}
            placeholder="URL sorgente https://..."
            className="font-mono text-body-sm"
          />
          <Input
            value={bAnchor}
            onChange={(e) => setBAnchor(e.target.value)}
            placeholder="Anchor text"
          />
          <span className="flex items-center text-label-md text-text-muted">
            (auto-DA stimato)
          </span>
          <button
            type="button"
            onClick={() => {
              if (!bSourceUrl) return;
              let domain: string;
              try {
                domain = new URL(bSourceUrl).hostname;
              } catch {
                toast.error("URL non valido");
                return;
              }
              addBacklink({
                projectId,
                sourceDomain: domain,
                sourceUrl: bSourceUrl,
                targetUrl: "https://verumflow.ch/",
                anchorText: bAnchor,
                domainAuthority: 30 + (domain.length % 50),
                rel: "dofollow",
                status: "active",
              });
              toast.success("Backlink aggiunto");
              setBSourceUrl("");
              setBAnchor("");
            }}
            className="rounded-md bg-surface-container-lowest px-3 py-2 text-body-sm font-semibold text-molten-primary hover:bg-surface-container"
          >
            <Plus className="mr-1 inline h-3.5 w-3.5" />
            Aggiungi
          </button>
        </div>
        <div className="grid grid-cols-[2fr_1fr_70px_90px_120px_50px] gap-3 px-6 py-2 text-label-sm uppercase tracking-wider text-text-muted">
          <span>Sorgente</span>
          <span>Anchor</span>
          <span className="text-right">DA</span>
          <span className="text-center">Rel</span>
          <span className="text-center">Status</span>
          <span />
        </div>
        {backlinks.map((b, i) => (
          <div
            key={b.id}
            className={`grid grid-cols-[2fr_1fr_70px_90px_120px_50px] items-center gap-3 px-6 py-2 ${
              i % 2 === 0
                ? "bg-surface-container-lowest"
                : "bg-surface-container-low"
            }`}
          >
            <div className="flex flex-col leading-tight">
              <a
                href={b.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-body-sm font-semibold text-on-surface hover:text-molten-primary"
              >
                {b.sourceDomain}
                <ExternalLink className="h-3 w-3" />
              </a>
              <span
                className="font-mono text-label-sm text-text-muted"
                suppressHydrationWarning
              >
                vista da {fmtDateLong(b.firstSeenAt)}
              </span>
            </div>
            <span className="truncate text-body-sm text-secondary-text">
              {b.anchorText}
            </span>
            <span
              className="text-right font-mono text-body-sm tabular-nums"
              style={{
                color: b.domainAuthority >= 40 ? "#5ec27f" : b.domainAuthority >= 20 ? "#e6b340" : "#e66b6b",
              }}
            >
              {b.domainAuthority}
            </span>
            <span className="text-center font-mono text-label-md text-text-muted">
              {b.rel}
            </span>
            <span className="flex justify-center">
              <StatusPill
                variant={
                  b.status === "active"
                    ? "success"
                    : b.status === "disavowed"
                      ? "warning"
                      : "neutral"
                }
              >
                {b.status}
              </StatusPill>
            </span>
            <div className="flex items-center justify-end gap-1">
              <button
                type="button"
                onClick={() => toggleDisavow(b.id)}
                className="flex h-7 w-7 items-center justify-center rounded-md hover:bg-surface-container-highest"
                aria-label={b.status === "disavowed" ? "Re-include" : "Disavow"}
                title={b.status === "disavowed" ? "Re-include" : "Disavow"}
              >
                {b.status === "disavowed" ? (
                  <Shield className="h-3.5 w-3.5 text-warning" />
                ) : (
                  <ShieldOff className="h-3.5 w-3.5 text-text-muted" />
                )}
              </button>
              <button
                type="button"
                onClick={() => removeBacklink(b.id)}
                className="flex h-7 w-7 items-center justify-center rounded-md hover:bg-surface-container-highest"
                aria-label="Rimuovi"
              >
                <Trash2 className="h-3.5 w-3.5 text-error" />
              </button>
            </div>
          </div>
        ))}
      </section>

      <section className="overflow-hidden rounded-xl bg-surface-container-high">
        <div className="flex items-center justify-between px-6 py-3">
          <h2 className="text-title-md font-semibold text-on-surface">
            Competitor benchmarking ({competitors.length})
          </h2>
        </div>
        <div className="flex items-end gap-2 px-6 pb-3">
          <div className="flex-1 space-y-1.5">
            <Label className="text-label-md text-secondary-text">
              Aggiungi competitor (dominio)
            </Label>
            <Input
              value={cDomain}
              onChange={(e) => setCDomain(e.target.value)}
              placeholder="competitor.ch"
              className="font-mono"
            />
          </div>
          <GradientButton
            size="md"
            onClick={() => {
              if (!cDomain) return;
              const seed = cDomain.length;
              addCompetitor({
                projectId,
                domain: cDomain,
                domainAuthority: 30 + ((seed * 7) % 50),
                estTraffic: 1000 + ((seed * 311) % 30000),
                keywordOverlap: (seed * 13) % 60,
                backlinks: 100 + ((seed * 41) % 2000),
                notes: "",
              });
              toast.success("Competitor aggiunto (dati stimati mock)");
              setCDomain("");
            }}
          >
            Analizza
          </GradientButton>
        </div>
        {competitors.length === 0 ? (
          <p className="px-6 py-12 text-center text-body-md text-text-muted">
            Nessun competitor.
          </p>
        ) : (
          <>
            <div className="grid grid-cols-[1.5fr_70px_120px_120px_120px_50px] gap-3 px-6 py-2 text-label-sm uppercase tracking-wider text-text-muted">
              <span>Dominio</span>
              <span className="text-right">DA</span>
              <span className="text-right">Traffic est</span>
              <span className="text-right">KW overlap</span>
              <span className="text-right">Backlinks</span>
              <span />
            </div>
            {competitors.map((c, i) => (
              <div
                key={c.id}
                className={`grid grid-cols-[1.5fr_70px_120px_120px_120px_50px] items-center gap-3 px-6 py-2 ${
                  i % 2 === 0
                    ? "bg-surface-container-lowest"
                    : "bg-surface-container-low"
                }`}
              >
                <div className="flex flex-col leading-tight">
                  <span className="font-mono text-body-sm font-semibold text-on-surface">
                    {c.domain}
                  </span>
                  {c.notes && (
                    <span className="text-label-sm text-text-muted">
                      {c.notes}
                    </span>
                  )}
                </div>
                <span className="text-right font-mono text-body-sm text-on-surface tabular-nums">
                  {c.domainAuthority}
                </span>
                <span className="text-right font-mono text-body-sm text-secondary-text tabular-nums">
                  {c.estTraffic.toLocaleString("it-IT")}
                </span>
                <span className="text-right font-mono text-body-sm text-molten-primary tabular-nums">
                  {c.keywordOverlap}
                </span>
                <span className="text-right font-mono text-body-sm text-secondary-text tabular-nums">
                  {c.backlinks.toLocaleString("it-IT")}
                </span>
                <button
                  type="button"
                  onClick={() => removeCompetitor(c.id)}
                  className="flex h-7 w-7 items-center justify-center rounded-md hover:bg-surface-container-highest"
                  aria-label="Rimuovi"
                >
                  <Trash2 className="h-3.5 w-3.5 text-error" />
                </button>
              </div>
            ))}
          </>
        )}
      </section>
    </div>
  );
}

function Stat({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: number | string;
  tone?: "default" | "success" | "warning" | "error";
}) {
  const color =
    tone === "success"
      ? "#5ec27f"
      : tone === "warning"
        ? "#e6b340"
        : tone === "error"
          ? "#e66b6b"
          : undefined;
  return (
    <div className="rounded-xl bg-surface-container-high p-4">
      <p className="text-label-sm uppercase tracking-wider text-text-muted">
        {label}
      </p>
      <p
        className="mt-1 text-headline-sm font-bold tabular-nums"
        style={color ? { color } : undefined}
      >
        {value}
      </p>
    </div>
  );
}
