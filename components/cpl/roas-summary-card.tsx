"use client";

import { useEffect, useMemo } from "react";
import Link from "next/link";
import { ArrowRight, AlertTriangle, TrendingUp } from "lucide-react";
import { useLeadsStore } from "@/lib/stores/leads-store";
import { ensureMetaBootstrap, useMetaStore } from "@/lib/stores/meta-store";
import { useProjectsStore } from "@/lib/stores/projects-store";
import {
  computeCplSummary,
  fmtRoas,
  fmtCplMoney,
} from "@/lib/marketing/cpl-calculator";
import { fmtMetaMoney } from "@/lib/marketing/meta-types";
import { cn } from "@/lib/utils";

type Props = {
  projectId: string;
};

export function RoasSummaryCard({ projectId }: Props) {
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

  const top = summary.topRoasChannel;
  const warning = summary.metaCplWarning;

  return (
    <Link
      href={`/projects/${projectId}/cpl`}
      className="group flex items-center justify-between rounded-xl bg-surface-container-high p-5 transition-colors hover:bg-surface-container-highest"
    >
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2 text-label-sm uppercase tracking-wider text-text-muted">
          <TrendingUp className="h-3 w-3" />
          CPL & ROAS
        </div>
        {top ? (
          <div className="font-mono text-headline-sm font-bold text-on-surface">
            <span className="text-emerald-400">{fmtRoas(top.roas)}</span>{" "}
            <span className="text-body-md font-normal text-text-muted">
              top fonte
            </span>{" "}
            <span className="text-on-surface">{top.label}</span>
          </div>
        ) : (
          <div className="font-mono text-headline-sm font-bold text-text-muted">
            Nessun ROAS attribuibile
          </div>
        )}
        <div className="flex items-center gap-3 font-mono text-label-sm text-text-muted">
          <span>
            Spend:{" "}
            <span className="text-on-surface">
              {summary.totals.spend > 0
                ? fmtMetaMoney(summary.totals.spend, summary.currency)
                : "—"}
            </span>
          </span>
          <span>·</span>
          <span>
            Leads: <span className="text-on-surface">{summary.totals.leads}</span>
          </span>
          <span>·</span>
          <span>
            CPL:{" "}
            <span className="text-on-surface">
              {fmtCplMoney(summary.totals.cpl, summary.currency)}
            </span>
          </span>
        </div>
        {warning && (
          <div
            className={cn(
              "mt-1 inline-flex items-center gap-1 rounded bg-rose-400/15 px-2 py-0.5 text-label-sm text-rose-300",
            )}
          >
            <AlertTriangle className="h-3 w-3" />
            CPL Meta sopra soglia €30
          </div>
        )}
      </div>
      <ArrowRight className="h-4 w-4 text-text-muted transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}
