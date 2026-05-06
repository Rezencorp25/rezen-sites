"use client";

import type { Alert } from "@/types";
import {
  useTasksStore,
  type TaskPriority,
} from "@/lib/stores/tasks-store";

const SEVERITY_TO_PRIORITY: Record<Alert["severity"], TaskPriority> = {
  critical: "urgent",
  warning: "high",
  info: "medium",
  ok: "low",
};

const SEVERITY_TO_HOURS: Record<Alert["severity"], number> = {
  critical: 2,
  warning: 1,
  info: 0.5,
  ok: 0.25,
};

const SEVERITY_TO_DUE_DAYS: Record<Alert["severity"], number> = {
  critical: 2,
  warning: 5,
  info: 10,
  ok: 14,
};

function addDays(d: Date, days: number): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + days);
}

export type CreateTaskFromAlertOptions = {
  /** Status iniziale della task. Default "todo". Quando auto-fix è già applicato, passare "done". */
  status?: "todo" | "in_progress" | "done" | "blocked";
  /** Suffisso libero da appendere alla descrizione (es. "Auto-risolto da sistema 2026-05-05"). */
  resolutionNote?: string;
};

/**
 * S12 — Crea una ProjectTask a partire da un Alert. Mappa severity → priority/ore/due,
 * riusa fromAlertId per il deeplink bidirezionale, default customerPriced=false
 * (alert interni non si fatturano).
 *
 * Ritorna l'id della task creata.
 */
export function createTaskFromAlert(
  alert: Alert,
  opts: CreateTaskFromAlertOptions = {},
): string {
  const tasksStore = useTasksStore.getState();
  const status = opts.status ?? "todo";
  const dueDate = addDays(new Date(), SEVERITY_TO_DUE_DAYS[alert.severity])
    .toISOString()
    .slice(0, 10);

  const description =
    `${alert.description}\n\n` +
    `Origine: alert ${alert.id}` +
    (alert.page ? ` (pagina ${alert.page})` : "") +
    (opts.resolutionNote ? `\n\n${opts.resolutionNote}` : "");

  return tasksStore.add({
    projectId: alert.projectId,
    title: alert.title,
    description,
    status,
    priority: SEVERITY_TO_PRIORITY[alert.severity],
    hoursSpent: status === "done" ? SEVERITY_TO_HOURS[alert.severity] : 0,
    estimatedHours: SEVERITY_TO_HOURS[alert.severity],
    customRate: null,
    customerPriced: false,
    assigneeName: "Te",
    dueDate,
    fromAlertId: alert.id,
  });
}
