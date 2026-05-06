"use client";

import type { ProjectTask } from "@/lib/stores/tasks-store";
import type {
  ExportBilling,
  ExportInvoiceMeta,
  ExportProject,
} from "./export-pdf";

function csvEscape(value: string | number): string {
  const s = String(value);
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export function exportTasksCsv(input: {
  tasks: ProjectTask[];
  project: ExportProject;
  billing: ExportBilling;
  meta: ExportInvoiceMeta;
}): void {
  const { tasks, project, billing, meta } = input;

  const lines: string[] = [];
  // Header rows con metadata cliente (commenti CSV-friendly).
  lines.push(`# ${project.name} · ${project.domain}`);
  lines.push(`# Cliente: ${meta.clienteName}`);
  if (meta.clienteAddress) lines.push(`# Indirizzo: ${meta.clienteAddress}`);
  if (meta.clientePartitaIva) lines.push(`# P.IVA: ${meta.clientePartitaIva}`);
  lines.push(`# Proposta: ${meta.proposalNumber} del ${meta.proposalDate}`);
  lines.push("");

  // Table header
  lines.push(
    [
      "Task",
      "Ore stimate",
      `Tariffa/h (${billing.currency})`,
      `Subtotale (${billing.currency})`,
    ]
      .map(csvEscape)
      .join(","),
  );

  let subtotalAll = 0;
  for (const t of tasks) {
    const rate = t.customRate ?? billing.hourlyRate;
    const subtotal = t.estimatedHours * rate;
    subtotalAll += subtotal;
    lines.push(
      [
        csvEscape(t.title),
        t.estimatedHours.toFixed(1),
        rate.toFixed(2),
        subtotal.toFixed(2),
      ].join(","),
    );
  }

  const markupAmount = (subtotalAll * billing.costMarkup) / 100;
  const total = subtotalAll + markupAmount;

  lines.push("");
  lines.push(`Subtotale,,,${subtotalAll.toFixed(2)}`);
  lines.push(`Markup ${billing.costMarkup}%,,,${markupAmount.toFixed(2)}`);
  lines.push(`Totale,,,${total.toFixed(2)}`);

  if (meta.notes) {
    lines.push("");
    lines.push(`# Note: ${meta.notes.replace(/\n/g, " ")}`);
  }

  const csv = lines.join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const safeName = project.name.replace(/[^a-z0-9]+/gi, "-").toLowerCase();
  const today = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `rezen-tasks-${safeName}-${today}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
