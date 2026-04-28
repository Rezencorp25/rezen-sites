"use client";

import { use, useMemo } from "react";

const MONTHS_IT = [
  "gen", "feb", "mar", "apr", "mag", "giu",
  "lug", "ago", "set", "ott", "nov", "dic",
];

/** UTC-stable date formatter — avoids SSR/CSR hydration mismatch. */
function fmtDate(d: Date): string {
  return `${d.getUTCDate()} ${MONTHS_IT[d.getUTCMonth()]}`;
}
function fmtTime(d: Date): string {
  return `${String(d.getUTCHours()).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(2, "0")}`;
}
import {
  Download,
  Inbox,
  Target,
  BarChart3,
  Users,
  MousePointerClick,
  Calendar,
} from "lucide-react";
import { toast } from "sonner";
import { useProjectData } from "@/lib/hooks/use-project-data";
import { UtmPills } from "@/components/forms/utm-pills";
import { FormHeatmap, FormAbTest } from "@/components/forms/form-heatmap";
import { StatusPill } from "@/components/luminous/status-pill";
import { KpiCard } from "@/components/luminous/kpi-card";
import { scoreLead, TIER_META } from "@/lib/seo/lead-scoring";

function truncate(s: string, n = 18) {
  return s.length > n ? `${s.slice(0, n)}…` : s;
}

export default function FormsPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = use(params);
  const { forms } = useProjectData(projectId);

  const scored = useMemo(
    () => forms.map((f) => ({ ...f, lead: scoreLead(f) })),
    [forms],
  );

  const stats = useMemo(() => {
    const withUtm = forms.filter((f) => f.utm).length;
    const withGclid = forms.filter((f) => f.gclid).length;
    const activeUtms = new Set(
      forms
        .map((f) => f.utm?.source)
        .filter(Boolean) as string[],
    ).size;
    const convRate = forms.length ? (withGclid / forms.length) * 100 : 0;
    const hot = scored.filter((s) => s.lead.tier === "hot").length;
    const warm = scored.filter((s) => s.lead.tier === "warm").length;
    // MOCK abandonment rate: deterministic ~38% baseline
    const abandonmentRate =
      forms.length > 0
        ? Math.round(
            (forms.length / (forms.length + forms.length * 0.6)) * 100 - 100,
          ) +
          37
        : 0;
    return {
      total: forms.length,
      withUtm,
      withGclid,
      activeUtms,
      convRate,
      hot,
      warm,
      abandonmentRate,
    };
  }, [forms, scored]);

  function exportCsv() {
    if (forms.length === 0) {
      toast.error("Nessun submission da esportare");
      return;
    }
    const headers = [
      "createdAt",
      "formName",
      "name",
      "email",
      "company",
      "page",
      "utm_source",
      "utm_medium",
      "utm_campaign",
      "gclid",
    ];
    const rows = forms.map((f) =>
      [
        f.createdAt.toISOString(),
        f.formName,
        f.fields.name ?? "",
        f.fields.email ?? "",
        f.fields.company ?? "",
        f.page,
        f.utm?.source ?? "",
        f.utm?.medium ?? "",
        f.utm?.campaign ?? "",
        f.gclid ?? "",
      ]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(","),
    );
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `form-submissions-${projectId}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Esportate ${forms.length} submission`);
  }

  return (
    <div className="mx-auto max-w-7xl px-10 py-10">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 text-label-md uppercase tracking-widest text-text-muted">
            <Inbox className="h-3.5 w-3.5" />
            Submissions
          </div>
          <h1 className="text-headline-md font-bold text-on-surface">
            Form Submissions
          </h1>
          <p className="text-body-md text-secondary-text">
            Tutti i lead raccolti, con tracking UTM e GCLID.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="flex items-center gap-2 rounded-lg bg-surface-container-high px-3.5 py-2.5 text-body-sm font-medium text-on-surface hover:bg-surface-container-highest transition-colors"
          >
            <Calendar className="h-4 w-4 text-secondary-text" />
            Ultimi 30 giorni
          </button>
          <button
            type="button"
            onClick={exportCsv}
            className="flex items-center gap-2 rounded-lg bg-surface-container-high px-3.5 py-2.5 text-body-sm font-semibold text-on-surface hover:bg-surface-container-highest transition-colors"
          >
            <Download className="h-4 w-4 text-molten-primary" />
            Export CSV
          </button>
        </div>
      </div>

      <div className="mb-5 grid gap-4 grid-cols-1 md:grid-cols-4">
        <KpiCard
          label="Hot leads"
          value={stats.hot}
          deltaLabel={`${stats.warm} warm · score >70`}
        />
        <KpiCard
          label="Abandonment rate"
          value={`${stats.abandonmentRate}%`}
          delta={-3}
          deltaLabel="vs 30gg prec."
        />
        <KpiCard
          label="Conv. rate"
          value={`${stats.convRate.toFixed(1)}%`}
          icon={MousePointerClick}
          deltaLabel="GCLID hits"
        />
        <KpiCard
          label="Active UTMs"
          value={stats.activeUtms}
          deltaLabel="campagne live"
        />
      </div>

      <div className="mb-5 grid gap-4 grid-cols-1 md:grid-cols-3">
        <div className="md:col-span-2 flex items-stretch gap-3 rounded-xl bg-surface-container-high p-6">
          <div className="flex flex-1 flex-col gap-2">
            <div className="flex items-center gap-2 text-label-md uppercase tracking-widest text-text-muted">
              <Target className="h-3.5 w-3.5" />
              Campaign Tracking
            </div>
            <div className="grid grid-cols-3 gap-6">
              <div className="flex flex-col gap-1">
                <span className="text-label-sm uppercase tracking-widest text-text-muted">
                  Active UTMs
                </span>
                <span className="text-title-lg font-bold text-on-surface tabular-nums">
                  {stats.activeUtms}
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-label-sm uppercase tracking-widest text-text-muted">
                  GCLID Hits
                </span>
                <span className="text-title-lg font-bold text-molten-primary tabular-nums">
                  {stats.withGclid}
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-label-sm uppercase tracking-widest text-text-muted">
                  Conv. Rate
                </span>
                <span className="text-title-lg font-bold text-success tabular-nums">
                  {stats.convRate.toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
        </div>
        <KpiCard
          label="Total Submissions"
          value={stats.total}
          icon={Users}
          deltaLabel="ultimi 30 giorni"
        />
      </div>

      <div className="mb-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <FormHeatmap projectId={projectId} />
        <FormAbTest projectId={projectId} />
      </div>

      <div className="overflow-hidden rounded-xl bg-surface-container-high">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-molten-primary" />
            <h2 className="text-title-md font-semibold text-on-surface">
              Submissions Recenti
            </h2>
          </div>
          <span className="text-label-md text-text-muted">
            {forms.length} risultati
          </span>
        </div>
        <div className="grid grid-cols-[110px_70px_1fr_1.3fr_1fr_1fr_100px] items-center gap-4 px-6 py-3 text-label-md uppercase tracking-widest text-text-muted">
          <span>Data</span>
          <span className="text-center">Score</span>
          <span>Nome</span>
          <span>Email</span>
          <span>Pagina</span>
          <span>UTM</span>
          <span>GCLID</span>
        </div>
        <div className="flex flex-col">
          {scored.slice(0, 12).map((f, i) => (
            <div
              key={f.id}
              className={`grid grid-cols-[110px_70px_1fr_1.3fr_1fr_1fr_100px] items-center gap-4 px-6 py-3 transition-colors hover:bg-surface-container-highest ${
                i % 2 === 0
                  ? "bg-surface-container-lowest"
                  : "bg-surface-container-low"
              }`}
            >
              <div className="flex flex-col leading-tight">
                <span className="text-body-sm font-medium text-on-surface">
                  {fmtDate(f.createdAt)}
                </span>
                <span className="text-label-sm text-text-muted">
                  {fmtTime(f.createdAt)}
                </span>
              </div>
              <span
                className="flex items-center justify-center rounded-full px-2 py-0.5 text-label-sm font-bold tabular-nums"
                style={{
                  background: `${TIER_META[f.lead.tier].color}22`,
                  color: TIER_META[f.lead.tier].color,
                }}
                title={`${TIER_META[f.lead.tier].label} — ${TIER_META[f.lead.tier].routing}`}
              >
                {f.lead.score}
              </span>
              <span className="truncate text-body-sm text-on-surface">
                {f.fields.name}
              </span>
              <span
                className="truncate font-mono text-body-sm text-secondary-text"
                title={f.fields.email}
              >
                {f.fields.email}
              </span>
              <span className="truncate font-mono text-body-sm text-secondary-text">
                {f.page}
              </span>
              <UtmPills utm={f.utm} />
              {f.gclid ? (
                <span
                  className="truncate font-mono text-label-sm text-molten-primary"
                  title={f.gclid}
                >
                  {truncate(f.gclid, 10)}
                </span>
              ) : (
                <span className="text-text-muted">—</span>
              )}
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between px-6 py-3 text-label-md text-text-muted">
          <span>Mostrando prime 12 di {forms.length}</span>
          <span>Paginazione completa in DOC 3</span>
        </div>
      </div>
    </div>
  );
}
