"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { Plus, Users, Filter, Search, Download } from "lucide-react";
import { useProjectsStore } from "@/lib/stores/projects-store";
import { useLeadsStore } from "@/lib/stores/leads-store";
import { LEAD_STATUSES, LEAD_STATUS_META } from "@/lib/leads/status-machine";
import type { Lead, LeadStatus } from "@/lib/leads/types";
import { KanbanColumn } from "@/components/leads/kanban-column";
import { LeadDetailDrawer } from "@/components/leads/lead-detail-drawer";
import { NewLeadModal } from "@/components/leads/new-lead-modal";
import { toast } from "sonner";

const ACTOR = { uid: "demo-user", name: "Admin" };

export default function LeadsPageClient({
  projectId,
}: {
  projectId: string;
}) {
  const project = useProjectsStore((s) => s.getById(projectId));
  const allLeads = useLeadsStore((s) => s.byProject[projectId]);
  const setStatus = useLeadsStore((s) => s.setStatus);

  const leads = useMemo(
    () => (allLeads ?? []).filter((l) => !l.deleted),
    [allLeads],
  );

  const search = useSearchParams();
  const [openNew, setOpenNew] = useState(false);
  const [active, setActive] = useState<Lead | null>(null);
  const [query, setQuery] = useState("");
  const [showAssignedOnly, setShowAssignedOnly] = useState(false);

  // Quick action `add-lead` aggancia automaticamente la modale
  useEffect(() => {
    if (search.get("action") === "new") setOpenNew(true);
  }, [search]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return leads.filter((l) => {
      if (showAssignedOnly && !l.assignedTo) return false;
      if (!q) return true;
      return (
        l.fields.name.toLowerCase().includes(q) ||
        (l.fields.email ?? "").toLowerCase().includes(q) ||
        l.tags.some((t) => t.toLowerCase().includes(q))
      );
    });
  }, [leads, query, showAssignedOnly]);

  const grouped = useMemo(() => {
    const acc: Record<LeadStatus, Lead[]> = {
      new: [],
      contacted: [],
      qualified: [],
      won: [],
      lost: [],
    };
    for (const l of filtered) acc[l.status].push(l);
    for (const k of Object.keys(acc) as LeadStatus[]) {
      acc[k].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }
    return acc;
  }, [filtered]);

  const totals = {
    count: filtered.length,
    won: grouped.won.reduce((acc, l) => acc + (l.value ?? 0), 0),
    pipeline: filtered
      .filter((l) => l.status !== "lost" && l.status !== "won")
      .reduce((acc, l) => acc + (l.value ?? 0), 0),
  };

  function handleDragEnd(e: DragEndEvent) {
    const dropId = e.over?.id;
    if (!dropId || typeof dropId !== "string") return;
    const next = dropId.replace("col-", "") as LeadStatus;
    const lead = e.active.data.current?.lead as Lead | undefined;
    if (!lead || lead.status === next) return;
    setStatus(projectId, lead.id, next, ACTOR);
    toast.success(
      `${lead.fields.name} → ${LEAD_STATUS_META[next].label}`,
    );
  }

  if (!project) {
    return (
      <div className="p-10 text-body-md text-text-muted">
        Progetto non trovato.
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col px-10 py-8">
      <header className="mb-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-molten-primary" />
            <h1 className="text-headline-md font-bold text-on-surface">
              Leads
            </h1>
            <span className="text-label-md text-text-muted">
              {totals.count} totali
            </span>
          </div>
          <p className="text-body-sm text-secondary-text">
            Pipeline interna · pipeline aperta{" "}
            <span className="font-mono text-on-surface">
              CHF {totals.pipeline.toLocaleString("it-IT")}
            </span>{" "}
            · won{" "}
            <span className="font-mono text-emerald-300">
              CHF {totals.won.toLocaleString("it-IT")}
            </span>
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-muted" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cerca lead, email, tag…"
              className="h-9 w-64 rounded-md bg-surface-container-high pl-9 pr-3 text-body-sm text-on-surface placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-molten-primary"
            />
          </div>
          <button
            type="button"
            onClick={() => setShowAssignedOnly((v) => !v)}
            className={
              "flex items-center gap-1.5 rounded-md px-3 py-2 text-label-md font-medium transition-colors " +
              (showAssignedOnly
                ? "bg-molten-primary/15 text-molten-primary ring-1 ring-molten-primary/30"
                : "bg-surface-container-high text-on-surface hover:bg-surface-container-highest")
            }
          >
            <Filter className="h-3.5 w-3.5" />
            Solo assegnati
          </button>
          <button
            type="button"
            onClick={() => exportCsv(filtered, project.name)}
            className="flex items-center gap-1.5 rounded-md bg-surface-container-high px-3 py-2 text-label-md font-medium text-on-surface hover:bg-surface-container-highest"
          >
            <Download className="h-3.5 w-3.5" />
            Export CSV
          </button>
          <button
            type="button"
            onClick={() => setOpenNew(true)}
            className="flex items-center gap-1.5 rounded-md bg-molten-primary px-3 py-2 text-label-md font-bold text-on-molten hover:bg-molten-primary-container"
          >
            <Plus className="h-3.5 w-3.5" />
            Nuovo lead
          </button>
        </div>
      </header>

      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <div className="grid flex-1 grid-cols-1 gap-3 overflow-x-auto pb-4 md:grid-cols-2 xl:grid-cols-5">
          {LEAD_STATUSES.map((s) => (
            <KanbanColumn
              key={s}
              status={s}
              leads={grouped[s]}
              onCardClick={setActive}
            />
          ))}
        </div>
      </DndContext>

      <LeadDetailDrawer lead={active} onClose={() => setActive(null)} />
      <NewLeadModal
        projectId={projectId}
        open={openNew}
        onClose={() => setOpenNew(false)}
      />
    </div>
  );
}

function exportCsv(leads: Lead[], projectName: string) {
  const headers = [
    "id",
    "name",
    "email",
    "phone",
    "status",
    "source",
    "value",
    "currency",
    "assignedTo",
    "tags",
    "createdAt",
  ];
  const rows = leads.map((l) =>
    [
      l.id,
      l.fields.name,
      l.fields.email ?? "",
      l.fields.phone ?? "",
      l.status,
      l.source,
      l.value ?? "",
      l.currency ?? "",
      l.assignedToName ?? "",
      l.tags.join("|"),
      l.createdAt.toISOString(),
    ]
      .map((v) => `"${String(v).replace(/"/g, '""')}"`)
      .join(","),
  );
  const csv = [headers.join(","), ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `leads-${projectName.toLowerCase().replace(/\s+/g, "-")}-${new Date()
    .toISOString()
    .slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  toast.success(`Esportati ${leads.length} lead`);
}
