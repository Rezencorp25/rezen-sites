"use client";

import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { Mail, Phone, User, Tag } from "lucide-react";
import { LEAD_STATUS_META } from "@/lib/leads/status-machine";
import type { Lead } from "@/lib/leads/types";
import { cn } from "@/lib/utils";

export function LeadCard({
  lead,
  onClick,
}: {
  lead: Lead;
  onClick: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id: lead.id, data: { lead } });

  const tone = LEAD_STATUS_META[lead.status];

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Translate.toString(transform),
        opacity: isDragging ? 0.4 : 1,
      }}
      {...listeners}
      {...attributes}
      className={cn(
        "group relative flex flex-col gap-2 rounded-lg bg-surface-container-low p-3 ring-1 ring-white/5",
        "cursor-grab active:cursor-grabbing transition-shadow hover:shadow-md hover:shadow-black/40",
      )}
    >
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
        onPointerDownCapture={(e) => e.stopPropagation()}
        className="absolute inset-0 z-10 cursor-pointer rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-molten-primary"
        aria-label={`Apri dettaglio lead ${lead.fields.name}`}
      />

      <div className="flex items-start justify-between gap-2 pointer-events-none">
        <p className="text-body-sm font-semibold text-on-surface line-clamp-1">
          {lead.fields.name}
        </p>
        {lead.value !== null && lead.value !== undefined && (
          <span className="rounded-md bg-emerald-500/10 px-1.5 py-0.5 text-label-sm font-mono font-semibold text-emerald-300">
            {lead.currency ?? "CHF"} {lead.value.toLocaleString("it-IT")}
          </span>
        )}
      </div>

      <div className="flex flex-col gap-1 text-label-sm text-text-muted pointer-events-none">
        {lead.fields.email && (
          <span className="flex items-center gap-1.5">
            <Mail className="h-3 w-3" />
            <span className="truncate">{lead.fields.email}</span>
          </span>
        )}
        {lead.fields.phone && (
          <span className="flex items-center gap-1.5">
            <Phone className="h-3 w-3" />
            <span>{lead.fields.phone}</span>
          </span>
        )}
      </div>

      {lead.tags.length > 0 && (
        <div className="flex flex-wrap items-center gap-1 pointer-events-none">
          {lead.tags.slice(0, 3).map((t) => (
            <span
              key={t}
              className="flex items-center gap-1 rounded bg-surface-container px-1.5 py-0.5 text-[10px] uppercase tracking-widest text-text-muted"
            >
              <Tag className="h-2.5 w-2.5" />
              {t}
            </span>
          ))}
          {lead.tags.length > 3 && (
            <span className="text-[10px] text-text-muted">
              +{lead.tags.length - 3}
            </span>
          )}
        </div>
      )}

      <div className="flex items-center justify-between pt-1 text-label-sm text-text-muted pointer-events-none">
        <span className="flex items-center gap-1">
          <User className="h-3 w-3" />
          {lead.assignedToName ?? "—"}
        </span>
        <span className={cn("font-mono", tone.tone)}>
          {timeAgo(lead.createdAt)}
        </span>
      </div>
    </div>
  );
}

function timeAgo(d: Date): string {
  const diff = Date.now() - d.getTime();
  const m = Math.round(diff / 60000);
  if (m < 1) return "ora";
  if (m < 60) return `${m}m`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.round(h / 24)}g`;
}
