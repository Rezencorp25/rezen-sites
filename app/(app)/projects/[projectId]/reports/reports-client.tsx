"use client";

import { useMemo, useState } from "react";
import {
  Calendar,
  CheckCircle2,
  Download,
  FileBarChart,
  FileText,
  Loader2,
  RefreshCw,
  Sparkles,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { useProjectsStore } from "@/lib/stores/projects-store";
import {
  listAvailableMonthKeys,
  monthKeyOf,
  periodLabelOf,
  simulateGenerateReport,
  useReportsStore,
  type ReportEntry,
} from "@/lib/stores/reports-store";
import { cn } from "@/lib/utils";

const EMPTY_REPORTS: ReportEntry[] = [];

export default function ReportsClient({ projectId }: { projectId: string }) {
  const project = useProjectsStore((s) => s.getById(projectId));
  const reportsRaw = useReportsStore((s) => s.byProject[projectId]);
  const reports = reportsRaw ?? EMPTY_REPORTS;
  const sortedReports = useMemo(
    () => [...reports].sort((a, b) => b.monthKey.localeCompare(a.monthKey)),
    [reports],
  );

  const [generating, setGenerating] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState<string>(monthKeyOf(new Date()));

  const availableMonths = useMemo(() => listAvailableMonthKeys(12), []);

  if (!project) {
    return (
      <div className="p-10 text-body-md text-text-muted">Progetto non trovato.</div>
    );
  }

  const handleGenerate = async () => {
    setGenerating(true);
    const t = toast.loading(`Generazione report ${periodLabelOf(selectedMonth)}…`);
    try {
      // Stub-mode: in produzione sostituire con httpsCallable("generateProjectReport").
      // Per smoke test UI lo stub è sufficiente.
      await simulateGenerateReport(projectId, selectedMonth);
      toast.success(`Report ${periodLabelOf(selectedMonth)} pronto`, { id: t });
    } catch {
      toast.error("Errore generazione report", { id: t });
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="flex h-full flex-col gap-6 px-10 py-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <FileBarChart className="h-5 w-5 text-molten-primary" />
            <h1 className="text-headline-md font-bold text-on-surface">Reports</h1>
            <span className="text-label-md text-text-muted">{project.domain}</span>
          </div>
          <p className="text-body-sm text-secondary-text">
            Report PDF white-label mensili — 8 pagine con SEO, AEO, GEO, AI Search Health
            e azioni concrete priorizzate. Auto-generati il 1° del mese alle 09:00 oppure
            on-demand.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            disabled={generating}
            className="rounded-md bg-surface-container-low px-3 py-2 text-body-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-molten-primary/40"
          >
            {availableMonths.map((mk) => (
              <option key={mk} value={mk}>
                {periodLabelOf(mk)}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={handleGenerate}
            disabled={generating}
            className={cn(
              "flex items-center gap-2 rounded-md px-3.5 py-2 text-label-md font-medium transition-colors",
              generating
                ? "cursor-not-allowed bg-surface-container-low text-text-muted"
                : "bg-molten-primary/15 text-molten-primary hover:bg-molten-primary/25",
            )}
          >
            {generating ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Sparkles className="h-3.5 w-3.5" />
            )}
            Genera report
          </button>
        </div>
      </header>

      <section className="rounded-xl bg-surface-container-high p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-title-md font-semibold text-on-surface">
            <Calendar className="h-4 w-4 text-molten-primary" />
            Storico report
            <span className="text-label-sm font-normal text-text-muted">
              ({sortedReports.length})
            </span>
          </h2>
          <span className="text-label-sm text-text-muted">
            Auto-cleanup dopo 24 mesi
          </span>
        </div>

        {sortedReports.length === 0 ? (
          <EmptyState onGenerate={handleGenerate} disabled={generating} />
        ) : (
          <ul className="flex flex-col gap-2">
            {sortedReports.map((r) => (
              <ReportRow key={r.monthKey} entry={r} />
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-xl bg-surface-container-high p-5">
        <h2 className="mb-3 flex items-center gap-2 text-title-md font-semibold text-on-surface">
          <FileText className="h-4 w-4 text-molten-primary" />
          Cosa contiene il report
        </h2>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <ReportPageCard num={1} title="Cover" desc="Logo cliente + brand color + period" />
          <ReportPageCard num={2} title="Executive Summary" desc="4 KPI tile con delta vs mese precedente" />
          <ReportPageCard num={3} title="SEO" desc="Authority + Visibility + top 10 keyword" />
          <ReportPageCard num={4} title="AEO" desc="SERP feature mix + top opportunità" />
          <ReportPageCard num={5} title="GEO" desc="AI Visibility + sentiment + citation rate" />
          <ReportPageCard num={6} title="AI Search Health" desc="Bot status + warnings critici" />
          <ReportPageCard num={7} title="Action Items" desc="Top 5 azioni priorizzate per impact" />
          <ReportPageCard num={8} title="Glossario" desc="Definizioni metriche + link dashboard" />
        </div>
      </section>

      <p className="text-label-sm text-text-muted">
        ★ Branding (logo + primary color) è hardcoded per progetto in{" "}
        <span className="font-mono">/settings</span>. Email automatica al cliente non è
        ancora wirata (S8.2 richiede consenso GDPR doc). Per ora i PDF vanno scaricati
        manualmente da qui o linkati al cliente via signedUrl 7gg.
      </p>
    </div>
  );
}

function EmptyState({
  onGenerate,
  disabled,
}: {
  onGenerate: () => void;
  disabled: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-surface-container-low p-10 text-center">
      <FileBarChart className="h-10 w-10 text-text-muted/40" />
      <div>
        <p className="text-body-md font-semibold text-on-surface">
          Nessun report ancora generato
        </p>
        <p className="text-body-sm text-text-muted">
          Genera il primo report del mese o aspetta il prossimo run schedulato (1° del mese).
        </p>
      </div>
      <button
        type="button"
        onClick={onGenerate}
        disabled={disabled}
        className={cn(
          "mt-2 flex items-center gap-2 rounded-md px-3.5 py-2 text-label-md font-medium",
          disabled
            ? "cursor-not-allowed bg-surface-container-low text-text-muted"
            : "bg-molten-primary/15 text-molten-primary hover:bg-molten-primary/25",
        )}
      >
        <Sparkles className="h-3.5 w-3.5" />
        Genera adesso
      </button>
    </div>
  );
}

function ReportRow({ entry }: { entry: ReportEntry }) {
  const isReady = entry.status === "ready";
  const isFailed = entry.status === "failed";
  return (
    <li className="flex items-center gap-3 rounded-md bg-surface-container-low/50 px-4 py-3">
      <StatusIcon status={entry.status} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-body-md font-semibold text-on-surface">
            {entry.periodLabel}
          </span>
          <span className="font-mono text-label-sm text-text-muted">
            {entry.monthKey}
          </span>
          <span
            className={cn(
              "rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider",
              isReady && "bg-emerald-400/15 text-emerald-300",
              !isReady && !isFailed && "bg-amber-400/15 text-amber-300",
              isFailed && "bg-rose-400/15 text-rose-300",
            )}
          >
            {entry.status}
          </span>
        </div>
        <span className="text-label-sm text-text-muted">
          Generato {entry.generatedAt.toLocaleString("it-IT")}
          {entry.sizeBytes !== null && ` · ${formatBytes(entry.sizeBytes)}`}
          {` · ${entry.pageCount} pagine`}
        </span>
      </div>
      {isReady && entry.url && (
        <a
          href={entry.url}
          download={`rezen-report-${entry.monthKey}.pdf`}
          className="flex items-center gap-1.5 rounded-md bg-molten-primary/15 px-3 py-1.5 text-label-md text-molten-primary hover:bg-molten-primary/25"
        >
          <Download className="h-3.5 w-3.5" />
          Scarica PDF
        </a>
      )}
      {entry.status === "generating" && (
        <span className="flex items-center gap-1.5 text-label-md text-amber-300">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Generating
        </span>
      )}
      {isFailed && (
        <button
          type="button"
          className="flex items-center gap-1.5 rounded-md bg-surface-container-low px-3 py-1.5 text-label-md text-text-muted hover:text-on-surface"
          title="Riprova"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Riprova
        </button>
      )}
    </li>
  );
}

function StatusIcon({ status }: { status: ReportEntry["status"] }) {
  if (status === "ready") return <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400" />;
  if (status === "generating") return <Loader2 className="h-5 w-5 shrink-0 animate-spin text-amber-400" />;
  return <XCircle className="h-5 w-5 shrink-0 text-rose-400" />;
}

function ReportPageCard({
  num,
  title,
  desc,
}: {
  num: number;
  title: string;
  desc: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-md bg-surface-container-low/50 p-3">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-molten-primary/15 font-mono text-label-sm font-bold text-molten-primary">
        {num}
      </span>
      <div className="flex-1">
        <div className="text-body-sm font-semibold text-on-surface">{title}</div>
        <div className="text-label-sm text-text-muted">{desc}</div>
      </div>
    </div>
  );
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
