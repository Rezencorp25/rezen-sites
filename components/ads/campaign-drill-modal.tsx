"use client";

import { Layers, X, Image as ImageIcon, Video, Grid3x3 } from "lucide-react";
import {
  fmtMetaInt,
  fmtMetaMoney,
  META_OBJECTIVE_LABEL,
  type MetaCampaign,
  type MetaCreativeFormat,
} from "@/lib/marketing/meta-types";
import { cn } from "@/lib/utils";

const FORMAT_ICON: Record<MetaCreativeFormat, typeof ImageIcon> = {
  image: ImageIcon,
  video: Video,
  carousel: Grid3x3,
  collection: Grid3x3,
};

const STATUS_TONE = {
  ACTIVE: "bg-emerald-400/15 text-emerald-300",
  PAUSED: "bg-amber-400/15 text-amber-300",
  COMPLETED: "bg-blue-400/15 text-blue-300",
  DELETED: "bg-rose-400/15 text-rose-300",
} as const;

type Props = {
  campaign: MetaCampaign | null;
  currency: string;
  onClose: () => void;
};

export function MetaCampaignDrillModal({ campaign, currency, onClose }: Props) {
  if (!campaign) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-surface-container-high"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-start justify-between gap-4 border-b border-outline/10 px-6 py-4">
          <div className="flex flex-col gap-1 min-w-0">
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-molten-primary" />
              <h2 className="truncate text-title-md font-semibold text-on-surface">
                {campaign.name}
              </h2>
              <span
                className={cn(
                  "rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                  STATUS_TONE[campaign.status],
                )}
              >
                {campaign.status}
              </span>
            </div>
            <p className="text-body-sm text-secondary-text">
              {META_OBJECTIVE_LABEL[campaign.objective]} · dal{" "}
              {campaign.startedAt}
              {campaign.endedAt ? ` → ${campaign.endedAt}` : " (attiva)"}
              {campaign.lifetimeBudget &&
                ` · budget lifetime ${fmtMetaMoney(campaign.lifetimeBudget, currency)}`}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md hover:bg-surface-container-highest"
            aria-label="Chiudi"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          <section className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-4">
            <Stat label="Spesa 30 giorni" value={fmtMetaMoney(campaign.spend30d, currency)} />
            <Stat label="Impression" value={fmtMetaInt(campaign.impressions30d)} />
            <Stat label="Click" value={fmtMetaInt(campaign.clicks30d)} sub={`CTR ${campaign.ctr30d}%`} />
            <Stat
              label={campaign.cpl30d > 0 ? "CPL" : "CPC"}
              value={fmtMetaMoney(campaign.cpl30d > 0 ? campaign.cpl30d : campaign.cpc30d, currency)}
              sub={
                campaign.roas30d > 0
                  ? `${campaign.roas30d}× ROAS`
                  : `${fmtMetaInt(campaign.conversions30d)} conv.`
              }
            />
          </section>

          <section>
            <h3 className="mb-3 text-label-md uppercase tracking-widest text-text-muted">
              Ad Set ({campaign.adSets.length})
            </h3>
            <div className="flex flex-col gap-3">
              {campaign.adSets.map((as) => (
                <div
                  key={as.id}
                  className="rounded-md bg-surface-container-low/50 p-4"
                >
                  <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
                    <h4 className="text-body-md font-semibold text-on-surface">
                      {as.name}
                    </h4>
                    <div className="flex items-center gap-3 text-label-sm text-text-muted">
                      <span>
                        Daily{" "}
                        <span className="font-mono font-semibold text-on-surface">
                          {fmtMetaMoney(as.dailyBudget, currency)}
                        </span>
                      </span>
                      <span>
                        Spend{" "}
                        <span className="font-mono font-semibold text-on-surface">
                          {fmtMetaMoney(as.spend30d, currency)}
                        </span>
                      </span>
                      <span>
                        Frequency{" "}
                        <span className="font-mono font-semibold text-on-surface">
                          {as.frequency}
                        </span>
                      </span>
                      {as.leads30d > 0 && (
                        <span>
                          Leads{" "}
                          <span className="font-mono font-semibold text-emerald-400">
                            {as.leads30d}
                          </span>
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    {as.creatives.map((cr) => {
                      const Icon = FORMAT_ICON[cr.format];
                      return (
                        <div
                          key={cr.id}
                          className="flex items-center gap-3 rounded bg-surface-container-low/50 px-3 py-2"
                        >
                          <Icon className="h-3.5 w-3.5 shrink-0 text-text-muted" />
                          <span className="flex-1 truncate text-body-sm text-on-surface">
                            {cr.name}
                          </span>
                          <span className="rounded bg-surface-container-lowest px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-text-muted">
                            {cr.format}
                          </span>
                          <span className="font-mono text-label-sm text-text-muted">
                            CTR{" "}
                            <span
                              className={cn(
                                "font-semibold",
                                cr.ctr >= 2
                                  ? "text-emerald-400"
                                  : cr.ctr >= 1
                                    ? "text-blue-400"
                                    : "text-amber-400",
                              )}
                            >
                              {cr.ctr}%
                            </span>
                          </span>
                          <span className="font-mono text-label-sm text-text-muted">
                            {fmtMetaMoney(cr.spend30d, currency)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="rounded-md bg-surface-container-low/50 p-3">
      <div className="text-label-sm uppercase tracking-wider text-text-muted">
        {label}
      </div>
      <div className="font-mono text-title-md font-bold tabular-nums text-on-surface">
        {value}
      </div>
      {sub && (
        <div className="font-mono text-label-sm text-text-muted">{sub}</div>
      )}
    </div>
  );
}
