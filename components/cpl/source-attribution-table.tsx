"use client";

import { Globe, BadgeDollarSign, Search, MousePointerClick, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  fmtCplMoney,
  fmtRoas,
  type MarketingChannel,
  type SourceAttribution,
} from "@/lib/marketing/cpl-calculator";
import { CPL_BAND_LABEL, fmtMetaInt, fmtMetaMoney } from "@/lib/marketing/meta-types";

type Props = {
  rows: SourceAttribution[];
};

const CHANNEL_ICON: Record<MarketingChannel, typeof Globe> = {
  organic: Search,
  meta: BadgeDollarSign,
  google: BadgeDollarSign,
  direct: Globe,
  referral: Users,
};

const CHANNEL_DOT: Record<MarketingChannel, string> = {
  organic: "bg-emerald-400",
  meta: "bg-sky-400",
  google: "bg-amber-400",
  direct: "bg-violet-400",
  referral: "bg-pink-400",
};

const CPL_BAND_TONE: Record<SourceAttribution["cplBand"], string> = {
  excellent: "text-emerald-400",
  good: "text-blue-400",
  average: "text-amber-400",
  poor: "text-rose-400",
};

export function SourceAttributionTable({ rows }: Props) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-body-sm">
        <thead>
          <tr className="border-b border-surface-container-low text-label-sm uppercase tracking-wider text-text-muted">
            <th className="px-2 py-2 text-left">Fonte</th>
            <th className="px-2 py-2 text-right">Leads</th>
            <th className="px-2 py-2 text-right">Qualified</th>
            <th className="px-2 py-2 text-right">Won</th>
            <th className="px-2 py-2 text-right">Win rate</th>
            <th className="px-2 py-2 text-right">Spend</th>
            <th className="px-2 py-2 text-right">CPL</th>
            <th className="px-2 py-2 text-right">CPA</th>
            <th className="px-2 py-2 text-right">Lifetime value</th>
            <th className="px-2 py-2 text-right">ROAS</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const Icon = CHANNEL_ICON[r.channel];
            const isInfRoas = !Number.isFinite(r.roas) && r.lifetimeValue > 0;
            return (
              <tr
                key={r.channel}
                className="border-b border-surface-container-low/40"
              >
                <td className="px-2 py-2.5">
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "h-2 w-2 rounded-full",
                        CHANNEL_DOT[r.channel],
                      )}
                    />
                    <Icon className="h-3.5 w-3.5 text-text-muted" />
                    <span className="text-on-surface">{r.label}</span>
                  </div>
                </td>
                <td className="px-2 py-2.5 text-right font-mono tabular-nums text-on-surface">
                  {fmtMetaInt(r.leads)}
                </td>
                <td className="px-2 py-2.5 text-right font-mono tabular-nums text-text-muted">
                  {fmtMetaInt(r.qualified)}{" "}
                  <span className="text-[10px] text-text-muted">
                    ({r.qualifiedRate}%)
                  </span>
                </td>
                <td className="px-2 py-2.5 text-right font-mono tabular-nums text-emerald-300">
                  {fmtMetaInt(r.won)}
                </td>
                <td className="px-2 py-2.5 text-right font-mono tabular-nums text-text-muted">
                  {r.winRate}%
                </td>
                <td className="px-2 py-2.5 text-right font-mono tabular-nums text-on-surface">
                  {r.spend > 0 ? fmtMetaMoney(r.spend, r.currency) : "—"}
                </td>
                <td className="px-2 py-2.5 text-right font-mono tabular-nums">
                  {r.spend > 0 && Number.isFinite(r.cpl) ? (
                    <span className={CPL_BAND_TONE[r.cplBand]}>
                      {fmtCplMoney(r.cpl, r.currency)}{" "}
                      <span className="text-[10px] uppercase">
                        {CPL_BAND_LABEL[r.cplBand]}
                      </span>
                    </span>
                  ) : (
                    <span className="text-text-muted">—</span>
                  )}
                </td>
                <td className="px-2 py-2.5 text-right font-mono tabular-nums text-text-muted">
                  {r.spend > 0 && r.won > 0
                    ? fmtCplMoney(r.cpa, r.currency)
                    : "—"}
                </td>
                <td className="px-2 py-2.5 text-right font-mono tabular-nums text-on-surface">
                  {r.lifetimeValue > 0
                    ? fmtMetaMoney(r.lifetimeValue, r.currency)
                    : "—"}
                </td>
                <td className="px-2 py-2.5 text-right font-mono tabular-nums">
                  {isInfRoas ? (
                    <span className="text-emerald-400" title="Spend zero (gratis)">
                      ∞
                    </span>
                  ) : r.spend > 0 && r.lifetimeValue > 0 ? (
                    <span
                      className={cn(
                        r.roas >= 3
                          ? "text-emerald-400"
                          : r.roas >= 1
                            ? "text-amber-400"
                            : "text-rose-400",
                      )}
                    >
                      {fmtRoas(r.roas)}
                    </span>
                  ) : (
                    <span className="text-text-muted">—</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
