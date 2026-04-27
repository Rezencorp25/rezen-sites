"use client";

import Link from "next/link";
import { ArrowRight, ShieldAlert } from "lucide-react";
import { SeverityPill } from "@/components/luminous/status-pill";
import type { Alert } from "@/types";

export function ActiveAlerts({
  alerts,
  projectId,
}: {
  alerts: Alert[];
  projectId: string;
}) {
  const visible = alerts.slice(0, 3);
  const critical = alerts.filter((a) => a.severity === "critical").length;

  return (
    <div className="flex flex-col rounded-xl bg-surface-container-high">
      <div className="flex items-center justify-between px-6 py-5">
        <div className="flex items-center gap-2.5">
          <ShieldAlert className="h-5 w-5 text-molten-primary" />
          <h3 className="text-title-md font-semibold text-on-surface">
            Alert Attivi
          </h3>
        </div>
        {critical > 0 ? (
          <SeverityPill severity="critical">
            {critical} CRITICAL
          </SeverityPill>
        ) : null}
      </div>
      <ul className="flex flex-col gap-2 px-3 pb-3">
        {visible.length === 0 ? (
          <li className="px-3 py-4 text-center text-body-sm text-text-muted">
            Nessun alert attivo
          </li>
        ) : (
          visible.map((a) => (
            <li
              key={a.id}
              className="flex items-start justify-between gap-3 rounded-lg bg-surface-container-lowest px-4 py-3 hover:bg-surface-container-low transition-colors"
            >
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex items-center gap-2">
                  <SeverityPill severity={a.severity} />
                </div>
                <p className="truncate text-body-sm font-semibold text-on-surface">
                  {a.title}
                </p>
                {a.page ? (
                  <p className="text-label-sm text-text-muted">
                    pagina {a.page}
                  </p>
                ) : null}
              </div>
              <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-text-muted" />
            </li>
          ))
        )}
      </ul>
      <Link
        href={`/projects/${projectId}/alerts`}
        className="flex items-center justify-center gap-1.5 px-6 py-3 text-body-sm font-semibold text-molten-primary hover:text-molten-accent-hover transition-colors"
      >
        Vedi tutti gli alert
        <ArrowRight className="h-3.5 w-3.5" />
      </Link>
    </div>
  );
}
