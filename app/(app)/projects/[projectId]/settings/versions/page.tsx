"use client";

import { use, useMemo } from "react";
import { formatDistanceToNow, format } from "date-fns";
import { it } from "date-fns/locale";
import { GitBranch, RotateCcw, CheckCircle2, Clock, CircleAlert } from "lucide-react";
import { toast } from "sonner";
import { useVersionsStore } from "@/lib/stores/versions-store";
import { usePagesStore } from "@/lib/stores/pages-store";
import { GradientButton } from "@/components/luminous/gradient-button";
import { cn } from "@/lib/utils";
import type { VersionStatus } from "@/types";

const STATUS_META: Record<VersionStatus, { label: string; color: string; Icon: typeof CheckCircle2 }> = {
  LIVE: { label: "LIVE", color: "success", Icon: CheckCircle2 },
  READY: { label: "READY", color: "info", Icon: Clock },
  BUILDING: { label: "BUILDING", color: "warning", Icon: Clock },
  FAILED: { label: "FAILED", color: "error", Icon: CircleAlert },
};

export default function VersionsPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = use(params);
  const allVersions = useVersionsStore((s) => s.versions);
  const setLive = useVersionsStore((s) => s.setLive);
  const savePuckData = usePagesStore((s) => s.savePuckData);

  const versions = useMemo(
    () =>
      allVersions
        .filter((v) => v.projectId === projectId)
        .sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime()),
    [allVersions, projectId],
  );

  function rollback(versionId: string) {
    const v = versions.find((x) => x.id === versionId);
    if (!v) return;
    if (!v.snapshot) {
      toast.error("Questa versione non ha uno snapshot (antecedente F5)");
      return;
    }
    for (const [pageId, puckData] of Object.entries(v.snapshot)) {
      savePuckData(pageId, puckData);
    }
    setLive(versionId);
    toast.success(`Rollback a ${v.versionTag} completato`);
  }

  return (
    <div className="mx-auto max-w-5xl px-10 py-6">
      <div className="mb-6 flex items-center gap-3">
        <GitBranch className="h-5 w-5 text-molten-primary" />
        <div className="flex flex-col">
          <h2 className="text-title-lg font-semibold text-on-surface">
            Version history
          </h2>
          <p className="text-body-sm text-secondary-text">
            Ogni Publish crea un snapshot. Puoi rollback in qualsiasi momento.
          </p>
        </div>
      </div>

      {versions.length === 0 ? (
        <div className="rounded-xl bg-surface-container-high px-10 py-16 text-center">
          <GitBranch className="mx-auto mb-3 h-6 w-6 text-text-muted" />
          <p className="text-body-md text-text-muted">
            Nessuna versione pubblicata. Usa &quot;Publish&quot; nell&apos;editor per crearne una.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl bg-surface-container-high">
          {versions.map((v, i) => {
            const meta = STATUS_META[v.status];
            const isLive = v.status === "LIVE";
            const canRollback = Boolean(v.snapshot) && !isLive;
            return (
              <div
                key={v.id}
                className={cn(
                  "grid grid-cols-[90px_110px_1fr_150px_110px] items-center gap-4 px-6 py-4",
                  i > 0 && "border-t border-outline-variant/15",
                  isLive && "bg-success-container/20",
                )}
              >
                <span className="font-mono text-body-sm font-semibold text-on-surface">
                  {v.versionTag}
                </span>
                <span
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-label-sm font-medium",
                    isLive
                      ? "bg-success-container text-success"
                      : meta.color === "info"
                        ? "bg-info-container text-info"
                        : meta.color === "warning"
                          ? "bg-warning-container text-warning"
                          : "bg-surface-container text-text-muted",
                  )}
                >
                  <meta.Icon className="h-3 w-3" />
                  {meta.label}
                </span>
                <div className="flex flex-col">
                  <span className="text-body-sm font-medium text-on-surface truncate">
                    {v.description ?? v.changes.join(" · ")}
                  </span>
                  <span className="text-label-sm text-text-muted">
                    da {v.publishedBy} ·{" "}
                    {format(v.publishedAt, "d MMM yyyy, HH:mm", { locale: it })}
                  </span>
                </div>
                <span className="text-label-sm text-text-muted">
                  {formatDistanceToNow(v.publishedAt, { addSuffix: true, locale: it })}
                </span>
                {isLive ? (
                  <span className="text-right text-label-sm text-success">In produzione</span>
                ) : (
                  <button
                    type="button"
                    onClick={() => rollback(v.id)}
                    disabled={!canRollback}
                    className={cn(
                      "ml-auto flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-body-sm font-medium transition-colors",
                      canRollback
                        ? "bg-surface-container-highest text-on-surface hover:bg-surface-container"
                        : "bg-surface-container-low text-text-muted cursor-not-allowed",
                    )}
                    title={canRollback ? "Ripristina questa versione" : "Snapshot non disponibile"}
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    Rollback
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-6 flex items-center justify-end">
        <GradientButton
          size="md"
          onClick={() => toast.info("Deploy to production: disponibile quando colleghi dominio reale")}
        >
          Deploy live
        </GradientButton>
      </div>
    </div>
  );
}
