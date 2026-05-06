"use client";

import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import type { ProjectTask } from "@/lib/stores/tasks-store";

export type ExportInvoiceMeta = {
  /** Customer header */
  clienteName: string;
  clienteAddress: string;
  clientePartitaIva: string;
  /** Document header */
  proposalNumber: string;
  /** ISO YYYY-MM-DD */
  proposalDate: string;
  /** Free notes (e.g., "validità 30gg") */
  notes: string;
};

export type ExportBilling = {
  hourlyRate: number;
  costMarkup: number;
  currency: "CHF" | "EUR" | "USD";
};

export type ExportProject = {
  name: string;
  domain: string;
};

const REZEN_PRIMARY: [number, number, number] = [255, 98, 0];

function rateOf(t: ProjectTask, billing: ExportBilling): number {
  return t.customRate ?? billing.hourlyRate;
}

function subtotalOf(t: ProjectTask, billing: ExportBilling): number {
  return t.estimatedHours * rateOf(t, billing);
}

function fmtMoney(n: number, currency: string): string {
  return `${currency} ${n.toLocaleString("it-IT", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function exportTasksPdf(input: {
  tasks: ProjectTask[];
  project: ExportProject;
  billing: ExportBilling;
  meta: ExportInvoiceMeta;
  brandName?: string;
}): void {
  const { tasks, project, billing, meta } = input;
  const brand = input.brandName ?? "REZEN Sites";

  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const marginX = 15;

  // Header brand bar
  doc.setFillColor(...REZEN_PRIMARY);
  doc.rect(0, 0, pageWidth, 8, "F");

  // Brand
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(20, 20, 20);
  doc.text(brand, marginX, 22);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(120, 120, 120);
  doc.text(
    `Proposta task per ${project.name} · ${project.domain}`,
    marginX,
    28,
  );

  // Document meta block
  doc.setFontSize(9);
  doc.setTextColor(60, 60, 60);
  const metaLeft = marginX;
  const metaRight = pageWidth / 2 + 5;

  doc.setFont("helvetica", "bold");
  doc.text("Cliente:", metaLeft, 42);
  doc.setFont("helvetica", "normal");
  doc.text(meta.clienteName || "—", metaLeft + 18, 42);

  if (meta.clienteAddress) {
    doc.text(meta.clienteAddress, metaLeft + 18, 47);
  }
  if (meta.clientePartitaIva) {
    doc.text(`P.IVA ${meta.clientePartitaIva}`, metaLeft + 18, 52);
  }

  doc.setFont("helvetica", "bold");
  doc.text("Proposta:", metaRight, 42);
  doc.setFont("helvetica", "normal");
  doc.text(meta.proposalNumber || "—", metaRight + 22, 42);

  doc.setFont("helvetica", "bold");
  doc.text("Data:", metaRight, 47);
  doc.setFont("helvetica", "normal");
  doc.text(meta.proposalDate || "—", metaRight + 22, 47);

  // Tasks table
  const body = tasks.map((t) => {
    const rate = rateOf(t, billing);
    const subtotal = subtotalOf(t, billing);
    return [
      t.title,
      t.estimatedHours.toFixed(1),
      fmtMoney(rate, billing.currency),
      fmtMoney(subtotal, billing.currency),
    ];
  });

  const subtotalAll = tasks.reduce((s, t) => s + subtotalOf(t, billing), 0);
  const markupAmount = (subtotalAll * billing.costMarkup) / 100;
  const totalAll = subtotalAll + markupAmount;

  autoTable(doc, {
    startY: 62,
    head: [["Task", "Ore", "Tariffa/h", "Subtotale"]],
    body,
    theme: "grid",
    styles: {
      fontSize: 9,
      cellPadding: 3,
      lineColor: [220, 220, 220],
    },
    headStyles: {
      fillColor: REZEN_PRIMARY,
      textColor: 255,
      fontStyle: "bold",
      fontSize: 9,
    },
    columnStyles: {
      0: { cellWidth: "auto" },
      1: { cellWidth: 18, halign: "right", font: "courier" },
      2: { cellWidth: 32, halign: "right", font: "courier" },
      3: { cellWidth: 32, halign: "right", font: "courier", fontStyle: "bold" },
    },
    margin: { left: marginX, right: marginX },
  });

  const finalY =
    (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable
      .finalY ?? 100;

  // Totals box (right aligned)
  const totalsX = pageWidth - marginX - 70;
  let cy = finalY + 8;

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(60, 60, 60);
  doc.text("Subtotale:", totalsX, cy);
  doc.text(fmtMoney(subtotalAll, billing.currency), pageWidth - marginX, cy, {
    align: "right",
  });

  cy += 5;
  doc.text(`Markup ${billing.costMarkup}%:`, totalsX, cy);
  doc.text(fmtMoney(markupAmount, billing.currency), pageWidth - marginX, cy, {
    align: "right",
  });

  cy += 7;
  doc.setDrawColor(...REZEN_PRIMARY);
  doc.setLineWidth(0.4);
  doc.line(totalsX, cy - 4, pageWidth - marginX, cy - 4);

  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(20, 20, 20);
  doc.text("Totale:", totalsX, cy);
  doc.text(fmtMoney(totalAll, billing.currency), pageWidth - marginX, cy, {
    align: "right",
  });

  // Notes block
  if (meta.notes && meta.notes.trim().length > 0) {
    cy += 14;
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(60, 60, 60);
    doc.text("Note:", marginX, cy);
    cy += 5;
    doc.setFont("helvetica", "normal");
    const wrapped = doc.splitTextToSize(meta.notes, pageWidth - marginX * 2);
    doc.text(wrapped, marginX, cy);
  }

  // Footer
  const footerY = doc.internal.pageSize.getHeight() - 10;
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text(
    `Documento generato da ${brand} · ${new Date().toLocaleString("it-IT")}`,
    pageWidth / 2,
    footerY,
    { align: "center" },
  );

  const safeName = project.name.replace(/[^a-z0-9]+/gi, "-").toLowerCase();
  const today = new Date().toISOString().slice(0, 10);
  doc.save(`rezen-tasks-${safeName}-${today}.pdf`);
}
