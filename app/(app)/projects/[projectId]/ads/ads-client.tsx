"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  BadgeDollarSign,
  Eye,
  Loader2,
  MousePointerClick,
  RefreshCw,
  Target,
  TrendingUp,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { useProjectsStore } from "@/lib/stores/projects-store";
import {
  ensureMetaBootstrap,
  refreshMetaSnapshot,
  useMetaStore,
} from "@/lib/stores/meta-store";
import {
  CPL_BAND_LABEL,
  cplBand,
  fmtMetaInt,
  fmtMetaMoney,
  META_OBJECTIVE_LABEL,
  type MetaCampaign,
  type MetaTrendPoint,
} from "@/lib/marketing/meta-types";
import { MetaCampaignDrillModal } from "@/components/ads/campaign-drill-modal";
import { MetaTrendChart } from "@/components/ads/meta-trend-chart";
import { cn } from "@/lib/utils";

const EMPTY_TREND: MetaTrendPoint[] = [];

const STATUS_TONE: Record<MetaCampaign["status"], string> = {
  ACTIVE: "bg-emerald-400/15 text-emerald-300",
  PAUSED: "bg-amber-400/15 text-amber-300",
  COMPLETED: "bg-blue-400/15 text-blue-300",
  DELETED: "bg-rose-400/15 text-rose-300",
};

const CPL_BAND_TONE: Record<ReturnType<typeof cplBand>, string> = {
  excellent: "text-emerald-400",
  good: "text-blue-400",
  average: "text-amber-400",
  poor: "text-rose-400",
};

export default function AdsClient({ projectId }: { projectId: string }) {
  const project = useProjectsStore((s) => s.getById(projectId));
  const snapshot = useMetaStore((s) => s.byProject[projectId]?.[0]);
  const trendRaw = useMetaStore((s) => s.trendByProject[projectId]);
  const trend = trendRaw ?? EMPTY_TREND;
  const [running, setRunning] = useState(false);
  const [selected, setSelected] = useState<MetaCampaign | null>(null);
  const [statusFilter, setStatusFilter] = useState<
    "all" | MetaCampaign["status"]
  >("all");

  const domain = project?.domain ?? "";

  useEffect(() => {
    if (!domain) return;
    ensureMetaBootstrap({ projectId, domain });
  }, [projectId, domain]);

  const filteredCampaigns = useMemo(() => {
    if (!snapshot) return [];
    if (statusFilter === "all") return snapshot.campaigns;
    return snapshot.campaigns.filter((c) => c.status === statusFilter);
  }, [snapshot, statusFilter]);

  const handleRefresh = async () => {
    if (!domain) return;
    setRunning(true);
    const t = toast.loading("Refresh Meta Ads stub...");
    try {
      await refreshMetaSnapshot({ projectId, domain });
      toast.success("Meta Ads aggiornato", { id: t });
    } catch {
      toast.error("Errore refresh Meta Ads", { id: t });
    } finally {
      setRunning(false);
    }
  };

  if (!project) {
    return (
      <div className="p-10 text-body-md text-text-muted">Progetto non trovato.</div>
    );
  }

  if (!snapshot) {
    return (
      <div className="flex h-full items-center justify-center text-body-md text-text-muted">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Caricamento Meta Ads...
      </div>
    );
  }

  const { totals, currency } = snapshot;
  const cplBandValue = cplBand(totals.cpl30d);
  const isStubMode = snapshot.source === "stub";

  return (
    <div className="flex h-full flex-col gap-6 px-10 py-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <BadgeDollarSign className="h-5 w-5 text-molten-primary" />
            <h1 className="text-headline-md font-bold text-on-surface">
              Meta Ads
            </h1>
            <span className="text-label-md text-text-muted">{project.domain}</span>
            {isStubMode && (
              <span className="rounded bg-amber-400/15 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-300">
                STUB
              </span>
            )}
          </div>
          <p className="text-body-sm text-secondary-text">
            Performance campagne Meta Marketing API · ultimi 30 giorni · refresh
            schedulato {`'0 6 * * *'`} Europe/Rome
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
          Refresh
        </button>
      </header>

      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <KpiTile
          icon={BadgeDollarSign}
          label="Spesa ultimi 30 giorni"
          value={fmtMetaMoney(totals.spend30d, currency)}
          subValue={`${totals.activeCampaigns} campagne attive`}
        />
        <KpiTile
          icon={Eye}
          label="Impression"
          value={fmtMetaInt(totals.impressions30d)}
          subValue={`CTR ${totals.ctr30d}%`}
        />
        <KpiTile
          icon={MousePointerClick}
          label="Click"
          value={fmtMetaInt(totals.clicks30d)}
          subValue={`CPC ${fmtMetaMoney(totals.cpc30d, currency)}`}
        />
        <KpiTile
          icon={Users}
          label="Leads"
          value={fmtMetaInt(totals.leads30d)}
          subValue={
            <span className={cn("font-semibold", CPL_BAND_TONE[cplBandValue])}>
              CPL {fmtMetaMoney(totals.cpl30d, currency)} ·{" "}
              {CPL_BAND_LABEL[cplBandValue]}
            </span>
          }
        />
      </section>

      <section className="rounded-xl bg-surface-container-high p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-title-md font-semibold text-on-surface">
            <TrendingUp className="h-4 w-4 text-molten-primary" />
            Trend 30 giorni
          </h2>
          <span className="text-label-sm text-text-muted">
            spend · impression · click · leads
          </span>
        </div>
        <MetaTrendChart trend={trend} currency={currency} />
      </section>

      <section className="rounded-xl bg-surface-container-high p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 text-title-md font-semibold text-on-surface">
            <Target className="h-4 w-4 text-molten-primary" />
            Campagne
            <span className="text-label-sm font-normal text-text-muted">
              ({filteredCampaigns.length}/{snapshot.campaigns.length})
            </span>
          </h2>
          <div className="flex items-center gap-1">
            {(
              ["all", "ACTIVE", "PAUSED", "COMPLETED"] as const
            ).map((s) => {
              const labelIt =
                s === "all"
                  ? "Tutte"
                  : s === "ACTIVE"
                    ? "Attive"
                    : s === "PAUSED"
                      ? "In pausa"
                      : "Completate";
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStatusFilter(s)}
                  className={cn(
                    "rounded px-2.5 py-1 text-label-sm font-medium transition-colors",
                    statusFilter === s
                      ? "bg-molten-primary/15 text-molten-primary"
                      : "text-text-muted hover:text-on-surface",
                  )}
                >
                  {labelIt}
                </button>
              );
            })}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-body-sm">
            <thead>
              <tr className="border-b border-surface-container-low text-label-sm uppercase tracking-wider text-text-muted">
                <th className="px-2 py-2 text-left">Campagna</th>
                <th className="px-2 py-2 text-left">Obiettivo</th>
                <th className="px-2 py-2 text-center">Stato</th>
                <th className="px-2 py-2 text-right">Spesa</th>
                <th className="px-2 py-2 text-right">Impr.</th>
                <th className="px-2 py-2 text-right">CTR</th>
                <th className="px-2 py-2 text-right">CPC</th>
                <th className="px-2 py-2 text-right">Conv.</th>
                <th className="px-2 py-2 text-right">CPL / ROAS</th>
                <th className="px-2 py-2" />
              </tr>
            </thead>
            <tbody>
              {filteredCampaigns.map((c) => (
                <tr
                  key={c.id}
                  className="cursor-pointer border-b border-surface-container-low/40 transition-colors hover:bg-surface-container-low/40"
                  onClick={() => setSelected(c)}
                >
                  <td className="px-2 py-2 text-on-surface">{c.name}</td>
                  <td className="px-2 py-2 text-text-muted">
                    {META_OBJECTIVE_LABEL[c.objective]}
                  </td>
                  <td className="px-2 py-2 text-center">
                    <span
                      className={cn(
                        "rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                        STATUS_TONE[c.status],
                      )}
                    >
                      {c.status}
                    </span>
                  </td>
                  <td className="px-2 py-2 text-right font-mono tabular-nums text-on-surface">
                    {fmtMetaMoney(c.spend30d, currency)}
                  </td>
                  <td className="px-2 py-2 text-right font-mono tabular-nums text-text-muted">
                    {fmtMetaInt(c.impressions30d)}
                  </td>
                  <td className="px-2 py-2 text-right font-mono tabular-nums text-text-muted">
                    {c.ctr30d}%
                  </td>
                  <td className="px-2 py-2 text-right font-mono tabular-nums text-text-muted">
                    {fmtMetaMoney(c.cpc30d, currency)}
                  </td>
                  <td className="px-2 py-2 text-right font-mono tabular-nums text-on-surface">
                    {fmtMetaInt(c.conversions30d)}
                  </td>
                  <td className="px-2 py-2 text-right font-mono tabular-nums">
                    {c.cpl30d > 0 ? (
                      <span className={CPL_BAND_TONE[cplBand(c.cpl30d)]}>
                        {fmtMetaMoney(c.cpl30d, currency)}
                      </span>
                    ) : c.roas30d > 0 ? (
                      <span className="text-emerald-400">
                        {c.roas30d}× ROAS
                      </span>
                    ) : (
                      <span className="text-text-muted">—</span>
                    )}
                  </td>
                  <td className="px-2 py-2 text-right">
                    <Activity className="ml-auto h-3.5 w-3.5 text-text-muted" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {isStubMode && (
        <div className="flex items-start gap-2 rounded-md border border-amber-400/30 bg-amber-400/10 p-4">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
          <div className="text-body-sm text-amber-100">
            <strong>Stub mode</strong>: i dati sono generati deterministicamente.
            Per attivare Meta Marketing API live, configura{" "}
            <span className="font-mono">businessAccountId</span> +{" "}
            <span className="font-mono">adAccountId</span> + System User token in{" "}
            <span className="font-mono">/settings/integrations</span>, poi setta{" "}
            <span className="font-mono">_config/features.meta_ads = true</span>.
          </div>
        </div>
      )}

      <MetaCampaignDrillModal
        campaign={selected}
        currency={currency}
        onClose={() => setSelected(null)}
      />
    </div>
  );
}

function KpiTile({
  icon: Icon,
  label,
  value,
  subValue,
}: {
  icon: typeof BadgeDollarSign;
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
