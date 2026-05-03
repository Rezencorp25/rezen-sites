"use client";

import Link from "next/link";
import { ChevronRight, Users } from "lucide-react";
import { useLeadsStore } from "@/lib/stores/leads-store";
import { LEAD_STATUSES, LEAD_STATUS_META } from "@/lib/leads/status-machine";
import type { LeadStatus } from "@/lib/leads/types";
import { cn } from "@/lib/utils";

export function LeadsSummaryCard({ projectId }: { projectId: string }) {
  const leads = useLeadsStore((s) => s.list(projectId));
  const counts = LEAD_STATUSES.reduce(
    (acc, s) => {
      acc[s] = leads.filter((l) => l.status === s).length;
      return acc;
    },
    {} as Record<LeadStatus, number>,
  );
  const pipeline = leads
    .filter((l) => l.status !== "lost" && l.status !== "won")
    .reduce((acc, l) => acc + (l.value ?? 0), 0);

  return (
    <div className="flex flex-col gap-4 rounded-xl bg-surface-container-high p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-molten-primary" />
          <h3 className="text-title-md font-semibold text-on-surface">
            Pipeline Leads
          </h3>
        </div>
        <Link
          href={`/projects/${projectId}/leads`}
          className="flex items-center gap-1 text-label-md text-text-muted hover:text-on-surface"
        >
          Apri kanban
          <ChevronRight className="h-3 w-3" />
        </Link>
      </div>

      <div className="grid grid-cols-5 gap-1.5">
        {LEAD_STATUSES.map((s) => {
          const meta = LEAD_STATUS_META[s];
          return (
            <div
              key={s}
              className={cn(
                "flex flex-col items-center gap-1 rounded-md px-1 py-2",
                meta.bg,
                "ring-1",
                meta.ring,
              )}
            >
              <span className={cn("text-title-md font-bold", meta.tone)}>
                {counts[s]}
              </span>
              <span className="text-[10px] uppercase tracking-widest text-text-muted">
                {meta.label}
              </span>
            </div>
          );
        })}
      </div>

      <div className="flex items-baseline justify-between rounded-md bg-surface-container-low px-3 py-2.5">
        <span className="text-label-md text-text-muted">Pipeline aperta</span>
        <span className="font-mono text-body-sm font-semibold text-on-surface">
          CHF {pipeline.toLocaleString("it-IT")}
        </span>
      </div>
    </div>
  );
}
