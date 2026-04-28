"use client";

import { use, useMemo, useState } from "react";
import { fmtDateLong, fmtTime } from "@/lib/utils/format-date";
import {
  AlertTriangle,
  AlertCircle,
  Info,
  CheckCircle2,
  CheckCheck,
  Wrench,
} from "lucide-react";
import { toast } from "sonner";
import { useProjectData } from "@/lib/hooks/use-project-data";
import { useProjectsStore } from "@/lib/stores/projects-store";
import { useSettingsStore } from "@/lib/stores/settings-store";
import { computeAlerts } from "@/lib/seo/alert-engine";
import { SeverityPill } from "@/components/luminous/status-pill";
import { cn } from "@/lib/utils";
import type { Alert, AlertSeverity } from "@/types";

const FILTER_OPTIONS: { value: AlertSeverity | "all"; label: string }[] = [
  { value: "all", label: "Tutti" },
  { value: "critical", label: "Critical" },
  { value: "warning", label: "Warning" },
  { value: "info", label: "Info" },
  { value: "ok", label: "OK" },
];

const SEVERITY_ICON = {
  critical: AlertCircle,
  warning: AlertTriangle,
  info: Info,
  ok: CheckCircle2,
} as const;

export default function AlertsPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = use(params);
  const data = useProjectData(projectId);
  const project = useProjectsStore((s) => s.getById(projectId));
  const settings = useSettingsStore((s) => s.get(projectId));
  // Real alerts from rule engine (live from page state) instead of MOCK_ALERTS.
  // Falls back to data.alerts (mock) only if project is missing.
  const alerts = useMemo(() => {
    if (!project) return data.alerts;
    return computeAlerts({
      project,
      pages: data.pages,
      redirects: data.redirects,
      localBusiness: settings.localBusiness,
    });
  }, [project, data.pages, data.redirects, data.alerts, settings.localBusiness]);
  const [filter, setFilter] = useState<AlertSeverity | "all">("all");
  const [acknowledged, setAcknowledged] = useState<Set<string>>(new Set());

  const counts = useMemo(() => {
    const counts: Record<string, number> = {
      all: 0,
      critical: 0,
      warning: 0,
      info: 0,
      ok: 0,
    };
    for (const a of alerts) {
      if (acknowledged.has(a.id)) continue;
      counts.all = (counts.all ?? 0) + 1;
      counts[a.severity] = (counts[a.severity] ?? 0) + 1;
    }
    return counts;
  }, [alerts, acknowledged]);

  const filtered = useMemo<Alert[]>(() => {
    return alerts.filter((a) => {
      if (acknowledged.has(a.id)) return false;
      if (filter === "all") return true;
      return a.severity === filter;
    });
  }, [alerts, filter, acknowledged]) as Alert[];

  function ackAlert(id: string) {
    setAcknowledged((s) => new Set([...s, id]));
    toast.success("Alert acknowledged");
  }

  return (
    <div className="mx-auto max-w-5xl px-10 py-10">
      <div className="mb-6 flex flex-col gap-1">
        <div className="text-label-md uppercase tracking-widest text-text-muted">
          Monitoring
        </div>
        <h1 className="text-headline-md font-bold text-on-surface">Alert</h1>
        <p className="text-body-md text-secondary-text">
          Segnalazioni automatiche su SEO, tracking, backlink e qualità contenuti.
        </p>
      </div>

      <div className="mb-5 flex flex-wrap items-center gap-2">
        {FILTER_OPTIONS.map((opt) => {
          const count = counts[opt.value] ?? 0;
          const active = filter === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => setFilter(opt.value)}
              className={cn(
                "flex items-center gap-2 rounded-lg px-4 py-2 text-body-sm font-medium transition-colors",
                active
                  ? "bg-surface-container-highest text-on-surface"
                  : "bg-surface-container-high text-secondary-text hover:text-on-surface",
              )}
            >
              {opt.label}
              <span
                className={cn(
                  "rounded-full px-1.5 text-label-sm font-bold",
                  active
                    ? "bg-molten-primary-container text-on-molten"
                    : "bg-surface-container-lowest text-text-muted",
                )}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      <div className="flex flex-col gap-3">
        {filtered.length === 0 ? (
          <div className="rounded-xl bg-surface-container-high px-10 py-16 text-center">
            <CheckCheck className="mx-auto mb-3 h-8 w-8 text-success" />
            <p className="text-body-md text-text-muted">
              Nessun alert per questo filtro.
            </p>
          </div>
        ) : (
          filtered.map((a) => {
            const Icon = SEVERITY_ICON[a.severity];
            return (
              <div
                key={a.id}
                className="flex items-start gap-4 rounded-xl bg-surface-container-high p-5"
              >
                <div
                  className={cn(
                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
                    a.severity === "critical" && "pill-error",
                    a.severity === "warning" && "pill-warning",
                    a.severity === "info" && "pill-info",
                    a.severity === "ok" && "pill-success",
                  )}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="mb-1.5 flex items-center gap-3">
                    <SeverityPill severity={a.severity} />
                    <span
                      className="text-label-sm text-text-muted"
                      suppressHydrationWarning
                    >
                      {fmtDateLong(a.createdAt)} {fmtTime(a.createdAt)}
                    </span>
                  </div>
                  <h3 className="text-body-md font-semibold text-on-surface">
                    {a.title}
                  </h3>
                  <p className="mt-1 text-body-sm text-secondary-text">
                    {a.description}
                  </p>
                  {a.page ? (
                    <span className="mt-2 inline-flex items-center gap-1.5 rounded-md bg-surface-container-lowest px-2 py-0.5 font-mono text-label-sm text-text-muted">
                      page: {a.page}
                    </span>
                  ) : null}
                </div>
                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => ackAlert(a.id)}
                    className="flex items-center gap-1.5 rounded-lg bg-surface-container-lowest px-3 py-1.5 text-body-sm font-medium text-on-surface hover:bg-surface-container-low transition-colors"
                  >
                    <CheckCheck className="h-3.5 w-3.5 text-success" />
                    Acknowledge
                  </button>
                  {a.severity !== "ok" ? (
                    <button
                      type="button"
                      onClick={() => toast.success("Fix — azione F3/F4")}
                      className="flex items-center gap-1.5 rounded-lg bg-surface-container-lowest px-3 py-1.5 text-body-sm font-medium text-molten-primary hover:bg-surface-container-low transition-colors"
                    >
                      <Wrench className="h-3.5 w-3.5" />
                      Fix
                    </button>
                  ) : null}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
