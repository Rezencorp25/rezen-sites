"use client";

import { useMemo, useState } from "react";
import { fmtDateLong, fmtTime } from "@/lib/utils/format-date";
import { ScrollText, Filter } from "lucide-react";
import { useAuditStore, type AuditAction } from "@/lib/stores/audit-store";

const ACTION_LABEL: Record<AuditAction, string> = {
  "page.create": "Pagina creata",
  "page.update": "Pagina modificata",
  "page.delete": "Pagina eliminata",
  "page.publish": "Pagina pubblicata",
  "version.deploy": "Deploy versione",
  "version.rollback": "Rollback versione",
  "settings.update": "Settings aggiornati",
  "team.invite": "Membro invitato",
  "team.role.change": "Ruolo modificato",
  "team.disable": "Membro disabilitato",
  "form.submission": "Form ricevuto",
  "redirect.create": "Redirect creato",
  "redirect.delete": "Redirect rimosso",
  "campaign.create": "Campagna creata",
  "campaign.pause": "Campagna messa in pausa",
  "schedule.create": "Pubblicazione schedulata",
};

const ACTION_TONE: Record<AuditAction, string> = {
  "page.create": "info",
  "page.update": "info",
  "page.delete": "warning",
  "page.publish": "success",
  "version.deploy": "success",
  "version.rollback": "warning",
  "settings.update": "info",
  "team.invite": "info",
  "team.role.change": "warning",
  "team.disable": "warning",
  "form.submission": "success",
  "redirect.create": "info",
  "redirect.delete": "warning",
  "campaign.create": "info",
  "campaign.pause": "warning",
  "schedule.create": "info",
};

export default function AuditLogPage() {
  const entries = useAuditStore((s) => s.entries);
  const [filterAction, setFilterAction] = useState<AuditAction | "all">("all");
  const [filterActor, setFilterActor] = useState<string>("all");

  const actors = useMemo(() => {
    const m = new Map<string, string>();
    for (const e of entries) m.set(e.actor.id, e.actor.name);
    return [...m.entries()];
  }, [entries]);

  const filtered = useMemo(() => {
    return entries.filter((e) => {
      if (filterAction !== "all" && e.action !== filterAction) return false;
      if (filterActor !== "all" && e.actor.id !== filterActor) return false;
      return true;
    });
  }, [entries, filterAction, filterActor]);

  return (
    <div className="mx-auto max-w-6xl px-10 py-10">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-label-md uppercase tracking-widest text-text-muted">
            <ScrollText className="h-3.5 w-3.5" />
            Audit log
          </div>
          <h1 className="text-headline-md font-bold text-on-surface">
            Activity log
          </h1>
          <p className="text-body-md text-secondary-text">
            {entries.length} eventi totali · ultime 500 azioni del workspace
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-text-muted" />
          <select
            value={filterAction}
            onChange={(e) =>
              setFilterAction(e.target.value as AuditAction | "all")
            }
            className="h-9 rounded-md bg-surface-container-high px-3 text-body-sm"
          >
            <option value="all">Tutte le azioni</option>
            {(Object.keys(ACTION_LABEL) as AuditAction[]).map((a) => (
              <option key={a} value={a}>
                {ACTION_LABEL[a]}
              </option>
            ))}
          </select>
          <select
            value={filterActor}
            onChange={(e) => setFilterActor(e.target.value)}
            className="h-9 rounded-md bg-surface-container-high px-3 text-body-sm"
          >
            <option value="all">Tutti</option>
            {actors.map(([id, name]) => (
              <option key={id} value={id}>
                {name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <section className="overflow-hidden rounded-xl bg-surface-container-high">
        {filtered.length === 0 ? (
          <p className="px-6 py-12 text-center text-body-md text-text-muted">
            Nessun evento corrispondente ai filtri.
          </p>
        ) : (
          <ul>
            {filtered.map((e, i) => (
              <li
                key={e.id}
                className={`grid grid-cols-[140px_1fr_180px_120px] items-center gap-4 px-6 py-3 ${
                  i % 2 === 0
                    ? "bg-surface-container-lowest"
                    : "bg-surface-container-low"
                }`}
              >
                <span
                  className="rounded px-2 py-0.5 text-center font-mono text-label-sm font-bold uppercase"
                  style={{
                    background:
                      ACTION_TONE[e.action] === "success"
                        ? "rgba(94,194,127,0.12)"
                        : ACTION_TONE[e.action] === "warning"
                          ? "rgba(230,179,64,0.12)"
                          : "rgba(110,168,255,0.12)",
                    color:
                      ACTION_TONE[e.action] === "success"
                        ? "#5ec27f"
                        : ACTION_TONE[e.action] === "warning"
                          ? "#e6b340"
                          : "#6ea8ff",
                  }}
                >
                  {ACTION_LABEL[e.action]}
                </span>
                <span className="truncate text-body-sm text-on-surface">
                  {e.description}
                  {e.target && (
                    <span className="ml-2 font-mono text-label-md text-text-muted">
                      → {e.target.name ?? e.target.id}
                    </span>
                  )}
                </span>
                <span className="text-body-sm text-secondary-text">
                  {e.actor.name}
                </span>
                <span
                  className="text-right font-mono text-label-md text-text-muted"
                  title={`${fmtDateLong(e.at)} ${fmtTime(e.at)}`}
                  suppressHydrationWarning
                >
                  {fmtDateLong(e.at)} {fmtTime(e.at)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
