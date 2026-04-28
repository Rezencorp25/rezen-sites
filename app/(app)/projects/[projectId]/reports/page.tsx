"use client";

import { use, useMemo, useState } from "react";
import {
  FileBarChart,
  Send,
  Copy,
  Calendar,
  Mail,
  Eye,
  Plus,
} from "lucide-react";
import { toast } from "sonner";
import { useProjectsStore } from "@/lib/stores/projects-store";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { GradientButton } from "@/components/luminous/gradient-button";

const AVAILABLE_WIDGETS = [
  { id: "traffic", label: "Traffic 30d", category: "Analytics" },
  { id: "topPages", label: "Top pages", category: "Analytics" },
  { id: "devices", label: "Devices split", category: "Analytics" },
  { id: "countries", label: "Countries split", category: "Analytics" },
  { id: "seoScore", label: "SEO score", category: "SEO" },
  { id: "alerts", label: "Alert critici", category: "SEO" },
  { id: "backlinks", label: "Backlinks summary", category: "SEO" },
  { id: "campaigns", label: "Campagne attive", category: "Ads" },
  { id: "spend", label: "Total spend", category: "Ads" },
  { id: "leads", label: "Lead generation", category: "Forms" },
  { id: "hotLeads", label: "Hot leads list", category: "Forms" },
];

export default function ReportsPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = use(params);
  const project = useProjectsStore((s) => s.getById(projectId));

  const [reportName, setReportName] = useState("Monthly client report");
  const [recipients, setRecipients] = useState("");
  const [frequency, setFrequency] = useState<"none" | "weekly" | "monthly">(
    "monthly",
  );
  const [enabled, setEnabled] = useState<Set<string>>(
    new Set(["traffic", "topPages", "seoScore", "leads"]),
  );

  function toggleWidget(id: string) {
    const next = new Set(enabled);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setEnabled(next);
  }

  const portalLink = useMemo(() => {
    return `https://is.gd/rezen-${projectId}-${Math.abs(
      projectId.length * 7919,
    ).toString(36)}`;
  }, [projectId]);

  if (!project) return null;

  return (
    <div className="mx-auto max-w-6xl px-10 py-10">
      <div className="mb-6">
        <div className="flex items-center gap-2 text-label-md uppercase tracking-widest text-text-muted">
          <FileBarChart className="h-3.5 w-3.5" />
          Reports
        </div>
        <h1 className="text-headline-md font-bold text-on-surface">
          Custom reports &amp; client portal
        </h1>
        <p className="text-body-md text-secondary-text">
          Costruisci report client-facing con drag-drop widget. Schedule
          delivery o condividi link read-only.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.4fr_1fr]">
        <section className="rounded-xl bg-surface-container-high p-6">
          <h2 className="mb-4 text-title-md font-semibold text-on-surface">
            Report builder
          </h2>
          <div className="mb-4 space-y-3">
            <div className="space-y-1.5">
              <Label className="text-label-md text-secondary-text">
                Nome report
              </Label>
              <Input
                value={reportName}
                onChange={(e) => setReportName(e.target.value)}
                placeholder="Aprile 2026 — VerumFlow.ch"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-label-md text-secondary-text">
                Frequenza invio
              </Label>
              <select
                value={frequency}
                onChange={(e) =>
                  setFrequency(
                    e.target.value as "none" | "weekly" | "monthly",
                  )
                }
                className="h-10 w-full rounded-md bg-surface-container-low px-3 text-body-sm"
              >
                <option value="none">Manuale (solo on-demand)</option>
                <option value="weekly">Settimanale (lunedì 09:00)</option>
                <option value="monthly">Mensile (1° del mese 09:00)</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-label-md text-secondary-text">
                Destinatari email (separati da virgola)
              </Label>
              <Input
                value={recipients}
                onChange={(e) => setRecipients(e.target.value)}
                placeholder="cliente@example.it, sales@rezen.dev"
                className="font-mono text-body-sm"
              />
            </div>
          </div>

          <div>
            <h3 className="mb-2 text-body-md font-semibold text-on-surface">
              Widget inclusi ({enabled.size}/{AVAILABLE_WIDGETS.length})
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {AVAILABLE_WIDGETS.map((w) => (
                <button
                  key={w.id}
                  type="button"
                  onClick={() => toggleWidget(w.id)}
                  className={`flex items-center justify-between rounded-md border px-3 py-2 text-left transition-colors ${
                    enabled.has(w.id)
                      ? "border-molten-primary-container bg-surface-container"
                      : "border-outline/20 bg-surface-container-low hover:bg-surface-container"
                  }`}
                >
                  <div>
                    <p className="text-body-sm font-medium text-on-surface">
                      {w.label}
                    </p>
                    <p className="text-label-sm text-text-muted">
                      {w.category}
                    </p>
                  </div>
                  <span
                    className="text-body-sm font-bold"
                    style={{
                      color: enabled.has(w.id) ? "#ff8533" : "#76787c",
                    }}
                  >
                    {enabled.has(w.id) ? "✓" : "+"}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-2">
            <GradientButton
              size="md"
              onClick={() => {
                if (!recipients) {
                  toast.error("Aggiungi almeno un destinatario");
                  return;
                }
                toast.success(
                  `Report "${reportName}" inviato a ${recipients.split(",").length} destinatari`,
                );
              }}
            >
              <Send className="h-4 w-4" />
              Invia ora
            </GradientButton>
            <button
              type="button"
              onClick={() => toast.success("Report scaricato (PDF mock)")}
              className="flex items-center gap-2 rounded-lg bg-surface-container-high px-4 py-2.5 text-body-sm font-semibold text-on-surface hover:bg-surface-container-highest"
            >
              <FileBarChart className="h-4 w-4 text-molten-primary" />
              Scarica PDF
            </button>
          </div>
        </section>

        <section className="rounded-xl bg-surface-container-high p-6">
          <h2 className="mb-3 text-title-md font-semibold text-on-surface">
            Client portal
          </h2>
          <p className="mb-4 text-body-sm text-text-muted">
            Link read-only condivisibile col cliente: vede analytics +
            forms + report storici, niente accesso editor o settings.
          </p>

          <div className="mb-3 rounded-lg border border-outline/20 bg-surface-container-low p-3">
            <p className="text-label-sm uppercase text-text-muted">
              Link cliente
            </p>
            <div className="mt-1 flex items-center gap-2">
              <code className="flex-1 truncate font-mono text-body-sm text-info">
                {portalLink}
              </code>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(portalLink);
                  toast.success("Link copiato");
                }}
                className="flex h-7 w-7 items-center justify-center rounded-md text-text-muted hover:bg-surface-container-high"
                aria-label="Copia"
              >
                <Copy className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <PortalRow
              icon={Eye}
              label="Analytics dashboard"
              hint="Solo lettura traffico + KPI"
            />
            <PortalRow
              icon={Mail}
              label="Form submissions"
              hint="Vedi lead in arrivo (no export PII)"
            />
            <PortalRow
              icon={Calendar}
              label="Report storici"
              hint="Archivio report mensili"
            />
            <PortalRow
              icon={Plus}
              label="Richiesta modifiche"
              hint="Form interno → ticket REZEN"
            />
          </div>

          <div className="mt-4 flex items-center justify-between rounded-md border border-outline/20 bg-surface-container-low px-3 py-2">
            <div>
              <p className="text-body-sm font-semibold text-on-surface">
                Portal attivo
              </p>
              <p className="text-label-md text-text-muted">
                Token scade tra 90 giorni. Auto-rinnovo.
              </p>
            </div>
            <Switch checked={true} onCheckedChange={() => {}} />
          </div>
        </section>
      </div>
    </div>
  );
}

function PortalRow({
  icon: Icon,
  label,
  hint,
}: {
  icon: typeof Eye;
  label: string;
  hint: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-md bg-surface-container-low px-3 py-2">
      <Icon className="h-4 w-4 text-molten-primary" />
      <div className="flex-1">
        <p className="text-body-sm font-medium text-on-surface">{label}</p>
        <p className="text-label-sm text-text-muted">{hint}</p>
      </div>
      <span className="rounded bg-success-container px-1.5 py-0.5 text-label-sm text-success">
        ON
      </span>
    </div>
  );
}
