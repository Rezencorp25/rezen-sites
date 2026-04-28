"use client";

import { useMemo, useState } from "react";
import { Calendar, CheckCircle2, X, ThumbsUp, ThumbsDown } from "lucide-react";
import { fmtDateLong, fmtTime } from "@/lib/utils/format-date";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GradientButton } from "@/components/luminous/gradient-button";
import { StatusPill } from "@/components/luminous/status-pill";
import {
  useScheduleStore,
  type ScheduleStatus,
} from "@/lib/stores/schedule-store";
import { useAuditStore } from "@/lib/stores/audit-store";

const STATUS_VARIANT: Record<
  ScheduleStatus,
  "neutral" | "info" | "success" | "warning" | "error"
> = {
  draft: "neutral",
  review: "info",
  approved: "success",
  scheduled: "info",
  published: "success",
  rejected: "error",
};

export function ScheduledReleases({ projectId }: { projectId: string }) {
  // Subscribe to raw releases (stable ref); filter via useMemo to avoid
  // creating a new array on every render (React error #185 cause).
  const allReleases = useScheduleStore((s) => s.releases);
  const releases = useMemo(
    () => allReleases.filter((r) => r.projectId === projectId),
    [allReleases, projectId],
  );
  const schedule = useScheduleStore((s) => s.schedule);
  const approve = useScheduleStore((s) => s.approve);
  const reject = useScheduleStore((s) => s.reject);
  const cancel = useScheduleStore((s) => s.cancel);
  const log = useAuditStore((s) => s.log);

  const [scope, setScope] = useState("");
  const [scheduledFor, setScheduledFor] = useState("");
  const [notes, setNotes] = useState("");

  function handleSchedule() {
    if (!scope || !scheduledFor) {
      toast.error("Compila scope + data");
      return;
    }
    const releaseId = schedule({
      projectId,
      scope,
      scheduledFor: new Date(scheduledFor).toISOString(),
      createdBy: "Te",
      notes,
    });
    log({
      actor: { id: "u-owner", name: "Te" },
      action: "schedule.create",
      description: `Schedulata pubblicazione "${scope}"`,
      target: { kind: "release", id: releaseId, name: scope },
    });
    toast.success("Pubblicazione schedulata, in attesa di approvazione");
    setScope("");
    setScheduledFor("");
    setNotes("");
  }

  return (
    <section className="rounded-xl bg-surface-container-high p-6">
      <div className="mb-4 flex items-center gap-2.5">
        <Calendar className="h-4 w-4 text-molten-primary" />
        <h2 className="text-title-md font-semibold text-on-surface">
          Pubblicazioni schedulate &amp; approvazioni
        </h2>
      </div>

      <div className="mb-5 grid grid-cols-1 gap-3 md:grid-cols-[2fr_1fr_auto]">
        <div className="space-y-1.5">
          <Label className="text-label-md text-secondary-text">Scope</Label>
          <Input
            value={scope}
            onChange={(e) => setScope(e.target.value)}
            placeholder='es. "Lancio nuova landing /servizi/seo-2026"'
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-label-md text-secondary-text">
            Data pubblicazione
          </Label>
          <Input
            type="datetime-local"
            value={scheduledFor}
            onChange={(e) => setScheduledFor(e.target.value)}
          />
        </div>
        <div className="flex items-end">
          <GradientButton size="md" onClick={handleSchedule}>
            Schedula
          </GradientButton>
        </div>
        <div className="md:col-span-3 space-y-1.5">
          <Label className="text-label-md text-secondary-text">
            Note per il reviewer (opz.)
          </Label>
          <Input
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Cambi principali, link a JIRA, etc."
          />
        </div>
      </div>

      {releases.length === 0 ? (
        <p className="rounded-md border border-dashed border-outline/30 px-3 py-2 text-label-md text-text-muted">
          Nessuna pubblicazione schedulata. Crea la prima sopra.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {releases.map((r) => {
            const isPast = new Date(r.scheduledFor).getTime() < Date.now();
            const canApprove = r.status === "review";
            return (
              <li
                key={r.id}
                className="rounded-lg border border-outline/20 bg-surface-container-low p-3"
              >
                <div className="mb-1 flex items-center justify-between gap-2">
                  <p className="text-body-sm font-semibold text-on-surface">
                    {r.scope}
                  </p>
                  <StatusPill variant={STATUS_VARIANT[r.status]}>
                    {r.status.toUpperCase()}
                  </StatusPill>
                </div>
                <div className="flex items-center gap-3 text-label-md text-text-muted">
                  <Calendar className="h-3 w-3" />
                  <span suppressHydrationWarning>
                    {fmtDateLong(r.scheduledFor)} alle {fmtTime(r.scheduledFor)}
                  </span>
                  {isPast && r.status === "scheduled" && (
                    <span className="rounded bg-success-container px-1.5 py-0.5 text-success">
                      Pronto al deploy
                    </span>
                  )}
                </div>
                {r.notes && (
                  <p className="mt-1 text-label-md text-secondary-text">
                    Note: {r.notes}
                  </p>
                )}
                <div className="mt-2 flex items-center gap-2">
                  {canApprove && (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          approve(r.id, "Te");
                          log({
                            actor: { id: "u-owner", name: "Te" },
                            action: "schedule.create",
                            description: `Approvata release "${r.scope}"`,
                            target: { kind: "release", id: r.id },
                          });
                          toast.success("Release approvata");
                        }}
                        className="inline-flex items-center gap-1 rounded-md bg-success-container px-2 py-1 text-label-md text-success hover:brightness-110"
                      >
                        <ThumbsUp className="h-3 w-3" />
                        Approva
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          reject(r.id, "Te");
                          toast.success("Release rifiutata");
                        }}
                        className="inline-flex items-center gap-1 rounded-md bg-error-container px-2 py-1 text-label-md text-error hover:brightness-110"
                      >
                        <ThumbsDown className="h-3 w-3" />
                        Rifiuta
                      </button>
                    </>
                  )}
                  {r.status === "approved" && (
                    <button
                      type="button"
                      onClick={() => toast.success("Deploy avviato (mock)")}
                      className="inline-flex items-center gap-1 rounded-md bg-info-container px-2 py-1 text-label-md text-info"
                    >
                      <CheckCircle2 className="h-3 w-3" />
                      Deploy ora
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      cancel(r.id);
                      toast.success("Release rimossa");
                    }}
                    className="ml-auto inline-flex items-center gap-1 rounded-md text-label-md text-text-muted hover:text-error"
                  >
                    <X className="h-3 w-3" />
                    Rimuovi
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
