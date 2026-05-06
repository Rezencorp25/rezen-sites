"use client";

import { useMemo, useState } from "react";
import { FileDown, FileSpreadsheet, FileText, X } from "lucide-react";
import { toast } from "sonner";
import type { ProjectTask } from "@/lib/stores/tasks-store";
import type { Project } from "@/types";
import {
  exportTasksPdf,
  type ExportBilling,
  type ExportInvoiceMeta,
  type ExportProject,
} from "@/lib/tasks/export-pdf";
import { exportTasksCsv } from "@/lib/tasks/export-csv";
import { useWorkspaceStore } from "@/lib/stores/workspace-store";
import { cn } from "@/lib/utils";

type Props = {
  open: boolean;
  onClose: () => void;
  tasks: ProjectTask[];
  project: Project;
  billing: ExportBilling;
};

export function ExportTasksModal({
  open,
  onClose,
  tasks,
  project,
  billing,
}: Props) {
  const brandName = useWorkspaceStore((s) => s.config.brandName);

  const [clienteName, setClienteName] = useState(project.name);
  const [clienteAddress, setClienteAddress] = useState("");
  const [clientePartitaIva, setClientePartitaIva] = useState("");
  const [proposalNumber, setProposalNumber] = useState(
    `PROP-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`,
  );
  const [proposalDate, setProposalDate] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [notes, setNotes] = useState(
    "Validità offerta: 30 giorni dalla data di emissione.",
  );

  const totals = useMemo(() => {
    const subtotal = tasks.reduce(
      (s, t) =>
        s + t.estimatedHours * (t.customRate ?? billing.hourlyRate),
      0,
    );
    const markupAmount = (subtotal * billing.costMarkup) / 100;
    const total = subtotal + markupAmount;
    return { subtotal, markupAmount, total };
  }, [tasks, billing]);

  const projectMeta: ExportProject = {
    name: project.name,
    domain: project.domain,
  };

  const meta: ExportInvoiceMeta = {
    clienteName,
    clienteAddress,
    clientePartitaIva,
    proposalNumber,
    proposalDate,
    notes,
  };

  const handlePdf = () => {
    try {
      exportTasksPdf({
        tasks,
        project: projectMeta,
        billing,
        meta,
        brandName,
      });
      toast.success("PDF scaricato");
    } catch (e) {
      console.error(e);
      toast.error("Errore generazione PDF");
    }
  };

  const handleCsv = () => {
    try {
      exportTasksCsv({ tasks, project: projectMeta, billing, meta });
      toast.success("CSV scaricato");
    } catch (e) {
      console.error(e);
      toast.error("Errore generazione CSV");
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-surface-container-high"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between border-b border-outline/10 px-6 py-4">
          <div>
            <h2 className="flex items-center gap-2 text-title-lg font-semibold text-on-surface">
              <FileDown className="h-5 w-5 text-molten-primary" />
              Esporta proposta tasks per cliente
            </h2>
            <p className="text-body-sm text-secondary-text">
              {tasks.length} task incluse · {project.name}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-surface-container-highest"
            aria-label="Chiudi"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          <section className="mb-5">
            <h3 className="mb-3 text-label-md uppercase tracking-widest text-text-muted">
              Intestatario cliente
            </h3>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <Field label="Nome cliente">
                <input
                  type="text"
                  value={clienteName}
                  onChange={(e) => setClienteName(e.target.value)}
                  className={inputCls}
                />
              </Field>
              <Field label="P.IVA / Codice fiscale">
                <input
                  type="text"
                  value={clientePartitaIva}
                  onChange={(e) => setClientePartitaIva(e.target.value)}
                  placeholder="opzionale"
                  className={inputCls}
                />
              </Field>
              <Field label="Indirizzo" className="md:col-span-2">
                <input
                  type="text"
                  value={clienteAddress}
                  onChange={(e) => setClienteAddress(e.target.value)}
                  placeholder="opzionale"
                  className={inputCls}
                />
              </Field>
            </div>
          </section>

          <section className="mb-5">
            <h3 className="mb-3 text-label-md uppercase tracking-widest text-text-muted">
              Documento
            </h3>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <Field label="Numero proposta">
                <input
                  type="text"
                  value={proposalNumber}
                  onChange={(e) => setProposalNumber(e.target.value)}
                  className={cn(inputCls, "font-mono")}
                />
              </Field>
              <Field label="Data">
                <input
                  type="date"
                  value={proposalDate}
                  onChange={(e) => setProposalDate(e.target.value)}
                  className={cn(inputCls, "font-mono")}
                />
              </Field>
            </div>
          </section>

          <section className="mb-5">
            <h3 className="mb-3 text-label-md uppercase tracking-widest text-text-muted">
              Anteprima tabella
            </h3>
            {tasks.length === 0 ? (
              <p className="rounded-md bg-surface-container-low/50 px-4 py-6 text-center text-body-sm text-text-muted">
                Nessuna task da esportare. Spunta "Include export" sulle task
                in tabella.
              </p>
            ) : (
              <div className="overflow-hidden rounded-md bg-surface-container-low/40">
                <table className="w-full text-body-sm">
                  <thead className="bg-molten-primary/15 text-molten-primary">
                    <tr>
                      <th className="px-3 py-2 text-left text-label-sm uppercase tracking-wider">
                        Task
                      </th>
                      <th className="px-3 py-2 text-right text-label-sm uppercase tracking-wider">
                        Ore
                      </th>
                      <th className="px-3 py-2 text-right text-label-sm uppercase tracking-wider">
                        Tariffa/h
                      </th>
                      <th className="px-3 py-2 text-right text-label-sm uppercase tracking-wider">
                        Subtotale
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {tasks.map((t, i) => {
                      const rate = t.customRate ?? billing.hourlyRate;
                      const subtotal = t.estimatedHours * rate;
                      return (
                        <tr
                          key={t.id}
                          className={
                            i % 2 === 0 ? "" : "bg-surface-container-low/30"
                          }
                        >
                          <td className="px-3 py-2 text-on-surface">
                            {t.title}
                          </td>
                          <td className="px-3 py-2 text-right font-mono tabular-nums text-on-surface">
                            {t.estimatedHours.toFixed(1)}
                          </td>
                          <td className="px-3 py-2 text-right font-mono tabular-nums text-secondary-text">
                            {billing.currency} {rate.toFixed(2)}
                          </td>
                          <td className="px-3 py-2 text-right font-mono font-semibold tabular-nums text-on-surface">
                            {billing.currency} {subtotal.toFixed(2)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot className="bg-surface-container-lowest">
                    <tr>
                      <td
                        colSpan={3}
                        className="px-3 py-2 text-right text-label-md text-text-muted"
                      >
                        Subtotale
                      </td>
                      <td className="px-3 py-2 text-right font-mono tabular-nums text-on-surface">
                        {billing.currency} {totals.subtotal.toFixed(2)}
                      </td>
                    </tr>
                    <tr>
                      <td
                        colSpan={3}
                        className="px-3 py-2 text-right text-label-md text-text-muted"
                      >
                        Markup {billing.costMarkup}%
                      </td>
                      <td className="px-3 py-2 text-right font-mono tabular-nums text-on-surface">
                        {billing.currency} {totals.markupAmount.toFixed(2)}
                      </td>
                    </tr>
                    <tr className="border-t border-molten-primary/30">
                      <td
                        colSpan={3}
                        className="px-3 py-2 text-right text-title-sm font-bold text-on-surface"
                      >
                        Totale
                      </td>
                      <td className="px-3 py-2 text-right font-mono text-title-sm font-bold tabular-nums text-molten-primary">
                        {billing.currency} {totals.total.toFixed(2)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </section>

          <section>
            <h3 className="mb-3 text-label-md uppercase tracking-widest text-text-muted">
              Note libere
            </h3>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className={cn(inputCls, "resize-none")}
              placeholder="es. Validità 30 giorni · pagamento 50% advance + 50% delivery"
            />
          </section>
        </div>

        <footer className="flex items-center justify-between gap-3 border-t border-outline/10 px-6 py-4">
          <p className="text-label-sm text-text-muted">
            ★ Documento NON è una fattura legale. Placeholder commerciale per
            preventivi.
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCsv}
              disabled={tasks.length === 0}
              className={cn(
                "flex items-center gap-2 rounded-md px-3.5 py-2 text-label-md font-medium transition-colors",
                tasks.length === 0
                  ? "cursor-not-allowed bg-surface-container-low text-text-muted"
                  : "bg-surface-container-low text-on-surface hover:bg-surface-container-lowest",
              )}
            >
              <FileSpreadsheet className="h-3.5 w-3.5" />
              CSV
            </button>
            <button
              type="button"
              onClick={handlePdf}
              disabled={tasks.length === 0}
              className={cn(
                "flex items-center gap-2 rounded-md px-3.5 py-2 text-label-md font-medium transition-colors",
                tasks.length === 0
                  ? "cursor-not-allowed bg-surface-container-low text-text-muted"
                  : "bg-molten-primary/15 text-molten-primary hover:bg-molten-primary/25",
              )}
            >
              <FileText className="h-3.5 w-3.5" />
              PDF
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}

const inputCls =
  "h-10 w-full rounded-md bg-surface-container-low px-3 text-body-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-molten-primary/40";

function Field({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <label className="text-label-sm text-text-muted">{label}</label>
      {children}
    </div>
  );
}
