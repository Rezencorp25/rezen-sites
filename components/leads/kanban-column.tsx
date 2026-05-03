"use client";

import { useDroppable } from "@dnd-kit/core";
import { LEAD_STATUS_META } from "@/lib/leads/status-machine";
import { LeadCard } from "./lead-card";
import type { Lead, LeadStatus } from "@/lib/leads/types";
import { cn } from "@/lib/utils";

export function KanbanColumn({
  status,
  leads,
  onCardClick,
}: {
  status: LeadStatus;
  leads: Lead[];
  onCardClick: (lead: Lead) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `col-${status}` });
  const meta = LEAD_STATUS_META[status];
  const totalValue = leads.reduce((acc, l) => acc + (l.value ?? 0), 0);

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex h-full min-h-[500px] flex-col gap-3 rounded-xl p-3 transition-colors",
        meta.bg,
        "ring-1",
        isOver ? "ring-molten-primary/60" : meta.ring,
      )}
    >
      <div className="flex items-baseline justify-between px-1">
        <div className="flex items-center gap-2">
          <span className={cn("h-2 w-2 rounded-full", meta.dot)} />
          <h3 className={cn("text-label-md font-bold uppercase tracking-widest", meta.tone)}>
            {meta.label}
          </h3>
          <span className="text-label-sm text-text-muted">{leads.length}</span>
        </div>
        {totalValue > 0 && (
          <span className="font-mono text-label-sm text-text-muted">
            {totalValue.toLocaleString("it-IT")}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 overflow-y-auto">
        {leads.map((lead) => (
          <LeadCard key={lead.id} lead={lead} onClick={() => onCardClick(lead)} />
        ))}
        {leads.length === 0 && (
          <div className="flex flex-1 items-center justify-center rounded-md border border-dashed border-white/5 px-3 py-6 text-center text-label-sm text-text-muted">
            Trascina un lead qui
          </div>
        )}
      </div>
    </div>
  );
}
