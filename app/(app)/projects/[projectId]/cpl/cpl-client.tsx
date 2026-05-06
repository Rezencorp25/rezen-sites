"use client";

import { useEffect, useMemo } from "react";
import {
  AlertTriangle,
  BadgeDollarSign,
  Filter,
  Loader2,
  Target,
  TrendingDown,
  TrendingUp,
  Trophy,
  Users,
} from "lucide-react";
import { useProjectsStore } from "@/lib/stores/projects-store";
import { useLeadsStore } from "@/lib/stores/leads-store";
import { ensureMetaBootstrap, useMetaStore } from "@/lib/stores/meta-store";
import {
  computeCplSummary,
  fmtCplMoney,
  fmtRoas,
} from "@/lib/marketing/cpl-calculator";
import { fmtMetaInt, fmtMetaMoney } from "@/lib/marketing/meta-types";
import { CplFunnelChart } from "@/components/cpl/funnel-chart";
import { SourceAttributionTable } from "@/components/cpl/source-attribution-table";
import { cn } from "@/lib/utils";

export default function CplClient({ projectId }: { projectId: string }) {
  const project = useProjectsStore((s) => s.getById(projectId));
  const leads = useLeadsStore((s) => s.byProject[projectId]);
  const snapshot = useMetaStore((s) => s.byProject[projectId]?.[0]);

  const domain = project?.domain ?? "";

  useEffect(() => {
    if (!domain) return;
    ensureMetaBootstrap({ projectId, domain });
  }, [projectId, domain]);

  const summary = useMemo(
    () =>
      computeCplSummary({
        leads: leads ?? [],
        metaSnapshot: snapshot,
      }),
    [leads, snapshot],
  );

  if (!project) {
    return (
      <div className="p-10 text-body-md text-text-muted">
        Progetto non trovato.
      </div>
    );
  }

  if (!snapshot) {
    return (
      <div className="flex h-full items-center justify-center text-body-md text-text-muted">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Caricamento attribution...
      </div>
    );
  }

  const { totals, currency, funnel, bySource, topRoasChannel, metaCplWarning } =
    summary;
  const isStub = snapshot.source === "stub";

  return (
    <div className="flex h-full flex-col gap-6 px-10 py-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-molten-primary" />
            <h1 className="text-headline-md font-bold text-on-surface">
              CPL & ROAS
            </h1>
            <span className="text-label-md text-text-muted">{project.domain}</span>
            {isStub && (
              <span className="rounded bg-amber-400/15 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-300">
                STUB
              </span>
            )}
          </div>
          <p className="text-body-sm text-secondary-text">
            Conversion rate cross-channel · last 30 giorni · join lead pipeline
            (S3) × ad spend (S9 Meta) × Google Ads stub
          </p>
        </div>
      </header>

      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <KpiTile
          icon={BadgeDollarSign}
          label="Spend totale"
          value={
            totals.spend > 0 ? fmtMetaMoney(totals.spend, currency) : "—"
          }
          subValue="Meta + Google (stub 60%)"
        />
        <KpiTile
          icon={Users}
          label="Leads"
          value={fmtMetaInt(totals.leads)}
          subValue={
            <span>
              Won{" "}
              <span className="text-emerald-300">{totals.won}</span> ·{" "}
              <span>{totals.winRate}% win rate</span>
            </span>
          }
        />
        <KpiTile
          icon={Target}
          label="CPL medio"
          value={fmtCplMoney(totals.cpl, currency)}
          subValue={
            metaCplWarning ? (
              <span className="text-rose-400">⚠ Meta sopra soglia €30</span>
            ) : (
              `CPA ${fmtCplMoney(totals.cpa, currency)}`
            )
          }
        />
        <KpiTile
          icon={Trophy}
          label="ROAS"
          value={fmtRoas(totals.roas)}
          subValue={
            topRoasChannel ? (
              <span className="text-emerald-300">
                Top: {topRoasChannel.label}
              </span>
            ) : (
              "—"
            )
          }
        />
      </section>

      <section className="rounded-xl bg-surface-container-high p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-title-md font-semibold text-on-surface">
            <Filter className="h-4 w-4 text-molten-primary" />
            Funnel di conversione
          </h2>
          <span className="text-label-sm text-text-muted">
            % rispetto a impressions · drop-off per stage
          </span>
        </div>
        <CplFunnelChart stages={funnel} />
      </section>

      <section className="rounded-xl bg-surface-container-high p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-title-md font-semibold text-on-surface">
            <TrendingUp className="h-4 w-4 text-molten-primary" />
            Attribution per fonte
          </h2>
          <span className="text-label-sm text-text-muted">
            ordine: organic → meta → google → direct → referral
          </span>
        </div>
        <SourceAttributionTable rows={bySource} />
      </section>

      {topRoasChannel && (
        <section
          className={cn(
            "flex items-start gap-3 rounded-xl border p-5",
            topRoasChannel.roas >= 3
              ? "border-emerald-400/30 bg-emerald-400/10"
              : "border-amber-400/30 bg-amber-400/10",
          )}
        >
          {topRoasChannel.roas >= 3 ? (
            <TrendingUp className="mt-0.5 h-5 w-5 text-emerald-400" />
          ) : (
            <TrendingDown className="mt-0.5 h-5 w-5 text-amber-400" />
          )}
          <div className="flex flex-col gap-1 text-body-sm">
            <strong className="text-on-surface">
              {topRoasChannel.label} è la fonte più redditizia
            </strong>
            <span className="text-text-muted">
              ROAS {fmtRoas(topRoasChannel.roas)} con{" "}
              {fmtMetaMoney(topRoasChannel.lifetimeValue, currency)} lifetime
              value su {fmtMetaMoney(topRoasChannel.spend, currency)} di spend (
              {topRoasChannel.won} clienti acquisiti, win rate{" "}
              {topRoasChannel.winRate}%).
            </span>
          </div>
        </section>
      )}

      {isStub && (
        <div className="flex items-start gap-2 rounded-md border border-amber-400/30 bg-amber-400/10 p-4">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
          <div className="text-body-sm text-amber-100">
            <strong>Stub mode</strong>: channel attribution derivato da hash
            deterministic <span className="font-mono">lead.id</span> + tag{" "}
            <span className="font-mono">channel:X</span>. Live mode richiede
            UTM params al form submission (es.{" "}
            <span className="font-mono">utm_source=meta</span>) per popolare un
            campo <span className="font-mono">marketingChannel</span> sul Lead.
            Google Ads spend è stimato 60% del Meta spend (per S5.3-bis con
            Google Ads API live).
          </div>
        </div>
      )}
    </div>
  );
}

function KpiTile({
  icon: Icon,
  label,
  value,
  subValue,
}: {
  icon: typeof TrendingUp;
  label: string;
  value: string;
  subValue: React.ReactNode;
}) {
  return (
    <div className="rounded-xl bg-surface-container-high p-4">
      <div className="mb-1 flex items-center gap-2 text-label-sm uppercase tracking-wider text-text-muted">
        <Icon className="h-3 w-3" />
        {label}
      </div>
      <div className="font-mono text-headline-sm font-bold tabular-nums text-on-surface">
        {value}
      </div>
      <div className="font-mono text-label-sm text-text-muted">{subValue}</div>
    </div>
  );
}
