"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  CheckCircle2,
  ListTodo,
  Sparkles,
  Wrench,
  X,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import type { Alert } from "@/types";
import {
  AUTO_FIX_DESCRIPTION,
  executeAutoFix,
} from "@/lib/alerts/auto-fixers";
import { createTaskFromAlert } from "@/lib/alerts/create-task-from-alert";
import { cn } from "@/lib/utils";

const SEVERITY_TONE: Record<Alert["severity"], string> = {
  critical: "bg-rose-400/15 text-rose-300 border-rose-400/30",
  warning: "bg-amber-400/15 text-amber-300 border-amber-400/30",
  info: "bg-blue-400/15 text-blue-300 border-blue-400/30",
  ok: "bg-emerald-400/15 text-emerald-300 border-emerald-400/30",
};

const PRIORITY_LABEL: Record<Alert["severity"], string> = {
  critical: "urgent",
  warning: "high",
  info: "medium",
  ok: "low",
};

const HOURS_BY_SEVERITY: Record<Alert["severity"], number> = {
  critical: 2,
  warning: 1,
  info: 0.5,
  ok: 0.25,
};

const DUE_DAYS_BY_SEVERITY: Record<Alert["severity"], number> = {
  critical: 2,
  warning: 5,
  info: 10,
  ok: 14,
};

type Props = {
  open: boolean;
  onClose: () => void;
  alert: Alert | null;
  /** Callback opzionale post-action (per ack alert + ricarica). */
  onActionComplete?: (action: "task" | "auto", taskId: string) => void;
};

export function AlertFixDialog({
  open,
  onClose,
  alert,
  onActionComplete,
}: Props) {
  const [busy, setBusy] = useState(false);

  const dueDateLabel = useMemo(() => {
    if (!alert) return "";
    const d = new Date();
    d.setDate(d.getDate() + DUE_DAYS_BY_SEVERITY[alert.severity]);
    return d.toLocaleDateString("it-IT", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }, [alert]);

  if (!open || !alert) return null;

  const isAuto = alert.fixAction === "auto";
  const autoDescription =
    isAuto && alert.fixActionId
      ? AUTO_FIX_DESCRIPTION[alert.fixActionId]
      : null;

  const handleCreateTask = () => {
    setBusy(true);
    try {
      const taskId = createTaskFromAlert(alert, { status: "todo" });
      toast.success("Task creata. Apri Tasks per gestirla.", {
        action: {
          label: "Vai",
          onClick: () => {
            window.location.href = `/projects/${alert.projectId}/tasks`;
          },
        },
      });
      onActionComplete?.("task", taskId);
      onClose();
    } catch (e) {
      console.error(e);
      toast.error("Errore creazione task");
    } finally {
      setBusy(false);
    }
  };

  const handleAutoFix = () => {
    setBusy(true);
    try {
      const result = executeAutoFix(alert);
      if (!result.ok) {
        toast.error(`Auto-fix fallito: ${result.error ?? "errore sconosciuto"}`);
        return;
      }
      const taskId = createTaskFromAlert(alert, {
        status: "done",
        resolutionNote: `🤖 Risolto automaticamente: ${result.summary}`,
      });
      toast.success(result.summary, {
        action: {
          label: "Task #" + taskId.slice(-6),
          onClick: () => {
            window.location.href = `/projects/${alert.projectId}/tasks`;
          },
        },
      });
      onActionComplete?.("auto", taskId);
      onClose();
    } catch (e) {
      console.error(e);
      toast.error("Errore esecuzione auto-fix");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-surface-container-high"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-start justify-between gap-4 border-b border-outline/10 px-6 py-4">
          <div className="flex items-start gap-3 min-w-0">
            <div
              className={cn(
                "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border",
                SEVERITY_TONE[alert.severity],
              )}
            >
              <Wrench className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <h2 className="text-title-md font-semibold text-on-surface">
                Risolvi alert
              </h2>
              <p className="truncate text-body-sm text-secondary-text">
                {alert.title}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md hover:bg-surface-container-highest"
            aria-label="Chiudi"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          <section className="mb-5 rounded-md bg-surface-container-low/40 p-4">
            <h3 className="mb-2 flex items-center gap-1.5 text-label-sm uppercase tracking-wider text-text-muted">
              <AlertTriangle className="h-3 w-3" />
              Descrizione alert
            </h3>
            <p className="text-body-sm text-on-surface">{alert.description}</p>
            {alert.page && (
              <p className="mt-2 font-mono text-label-sm text-text-muted">
                Pagina: {alert.page}
              </p>
            )}
          </section>

          {isAuto && autoDescription && (
            <section className="mb-5 rounded-md border border-emerald-400/30 bg-emerald-400/10 p-4">
              <h3 className="mb-2 flex items-center gap-1.5 text-label-sm uppercase tracking-wider text-emerald-300">
                <Sparkles className="h-3 w-3" />
                Risolvibile automaticamente
              </h3>
              <p className="text-body-sm text-emerald-100">
                {autoDescription}
              </p>
            </section>
          )}

          {!isAuto && (
            <section className="mb-5 rounded-md border border-amber-400/30 bg-amber-400/10 p-4">
              <h3 className="mb-2 flex items-center gap-1.5 text-label-sm uppercase tracking-wider text-amber-300">
                <Wrench className="h-3 w-3" />
                Richiede intervento umano
              </h3>
              <p className="text-body-sm text-amber-100">
                Questo alert non può essere risolto automaticamente. Verrà creata
                una task pre-compilata che potrai gestire dal modulo Tasks.
              </p>
            </section>
          )}

          <section>
            <h3 className="mb-3 flex items-center gap-1.5 text-label-sm uppercase tracking-wider text-text-muted">
              <ListTodo className="h-3 w-3" />
              Task che verrà creata
            </h3>
            <div className="rounded-md bg-surface-container-low/40 p-4">
              <div className="grid grid-cols-3 gap-3 text-body-sm">
                <Field label="Priorità" value={PRIORITY_LABEL[alert.severity]} />
                <Field
                  label="Ore stimate"
                  value={`${HOURS_BY_SEVERITY[alert.severity]}h`}
                />
                <Field label="Scadenza" value={dueDateLabel} />
              </div>
              <div className="mt-3 border-t border-outline/10 pt-3">
                <p className="text-label-sm text-text-muted">Titolo</p>
                <p className="text-body-sm font-semibold text-on-surface">
                  {alert.title}
                </p>
              </div>
              <p className="mt-3 text-label-sm text-text-muted">
                ★ Customer-priced: <span className="font-semibold">no</span>{" "}
                (alerts interni non si fatturano cliente per default)
              </p>
            </div>
          </section>
        </div>

        <footer className="flex flex-wrap items-center justify-end gap-2 border-t border-outline/10 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="rounded-md px-3.5 py-2 text-label-md text-text-muted hover:text-on-surface"
          >
            Annulla
          </button>
          <button
            type="button"
            onClick={handleCreateTask}
            disabled={busy}
            className={cn(
              "flex items-center gap-2 rounded-md px-3.5 py-2 text-label-md font-medium transition-colors",
              isAuto
                ? "bg-surface-container-low text-on-surface hover:bg-surface-container-lowest"
                : "bg-molten-primary/15 text-molten-primary hover:bg-molten-primary/25",
              busy && "cursor-not-allowed opacity-60",
            )}
          >
            <ListTodo className="h-3.5 w-3.5" />
            {isAuto ? "Crea solo task" : "Crea task per intervento"}
          </button>
          {isAuto && (
            <button
              type="button"
              onClick={handleAutoFix}
              disabled={busy}
              className={cn(
                "flex items-center gap-2 rounded-md bg-emerald-400/20 px-3.5 py-2 text-label-md font-medium text-emerald-200 transition-colors hover:bg-emerald-400/30",
                busy && "cursor-not-allowed opacity-60",
              )}
            >
              <Zap className="h-3.5 w-3.5" />
              Risolvi automaticamente
            </button>
          )}
        </footer>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-label-sm text-text-muted">{label}</span>
      <span className="text-body-sm font-semibold text-on-surface">
        {value}
      </span>
    </div>
  );
}
