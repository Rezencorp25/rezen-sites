"use client";

import { use } from "react";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import {
  GitBranch,
  Rocket,
  Eye,
  AlertTriangle,
  ExternalLink,
  BookOpen,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { useProjectData } from "@/lib/hooks/use-project-data";
import { useProjectsStore } from "@/lib/stores/projects-store";
import { useSettingsStore } from "@/lib/stores/settings-store";
import { StatusPill } from "@/components/luminous/status-pill";
import { GradientButton } from "@/components/luminous/gradient-button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UptimeMonitor } from "@/components/seo/uptime-monitor";

export default function SettingsStagingPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = use(params);
  const project = useProjectsStore((s) => s.getById(projectId));
  const { versions } = useProjectData(projectId);
  const settings = useSettingsStore((s) => s.get(projectId));
  const updateSection = useSettingsStore((s) => s.updateSection);

  if (!project) return null;

  return (
    <div className="mx-auto max-w-5xl px-10 pb-12 pt-2">
      <div className="mb-5 flex flex-wrap items-center justify-end gap-2">
        <button
          type="button"
          onClick={() => toast.success("Preview pubblicata (mock)")}
          className="flex items-center gap-2 rounded-lg bg-surface-container-high px-4 py-2.5 text-body-sm font-semibold text-on-surface hover:bg-surface-container-highest transition-colors"
        >
          <Eye className="h-4 w-4 text-secondary-text" />
          Pubblica Preview
        </button>
        <GradientButton
          size="md"
          onClick={() => toast.success("Deploy produzione avviato (mock)")}
        >
          <Rocket className="h-4 w-4" />
          Deploy Produzione
        </GradientButton>
      </div>

      <div className="mb-5">
        <UptimeMonitor projectId={projectId} />
      </div>

      <div className="grid gap-5 grid-cols-1 lg:grid-cols-[1fr_1.3fr]">
        <section className="flex flex-col rounded-xl bg-surface-container-high p-6">
          <div className="mb-4 flex items-center gap-2.5">
            <GitBranch className="h-4 w-4 text-molten-primary" />
            <h2 className="text-title-md font-semibold text-on-surface">
              Staging
            </h2>
          </div>
          <p className="mb-5 text-body-sm text-secondary-text">
            Un ambiente clone per testare modifiche prima della produzione.
            URL protetto da password.
          </p>

          <div className="mb-3 flex items-center justify-between rounded-lg bg-surface-container-lowest px-4 py-3.5">
            <div className="flex flex-col leading-tight">
              <span className="text-body-md font-semibold text-on-surface">
                {settings.staging.stagingEnabled
                  ? "Staging attivo"
                  : "Staging disabilitato"}
              </span>
              <span className="font-mono text-label-sm text-text-muted">
                {settings.staging.stagingDomain || project.stagingDomain}
              </span>
            </div>
            <Switch
              checked={settings.staging.stagingEnabled}
              onCheckedChange={(v) =>
                updateSection(projectId, "staging", { stagingEnabled: v })
              }
            />
          </div>

          {settings.staging.stagingEnabled && (
            <div className="mb-3 flex flex-col gap-3 rounded-lg border border-outline/20 bg-surface-container-low p-3">
              <div className="space-y-1">
                <Label className="text-label-md text-secondary-text">
                  Staging domain
                </Label>
                <Input
                  value={settings.staging.stagingDomain}
                  onChange={(e) =>
                    updateSection(projectId, "staging", {
                      stagingDomain: e.target.value,
                    })
                  }
                  placeholder={`staging-${projectId}.rezen.sites`}
                  className="font-mono text-body-sm"
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-body-sm font-semibold text-on-surface">
                    Password protection
                  </p>
                  <p className="text-label-md text-text-muted">
                    Basic Auth a livello edge — staging non visibile senza
                    credenziali
                  </p>
                </div>
                <Switch
                  checked={settings.staging.passwordProtected}
                  onCheckedChange={(v) =>
                    updateSection(projectId, "staging", {
                      passwordProtected: v,
                    })
                  }
                />
              </div>
              {settings.staging.passwordProtected && (
                <Input
                  type="text"
                  value={settings.staging.stagingPassword}
                  onChange={(e) =>
                    updateSection(projectId, "staging", {
                      stagingPassword: e.target.value,
                    })
                  }
                  placeholder="Password staging"
                  className="font-mono text-body-sm"
                />
              )}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-body-sm font-semibold text-on-surface">
                    Promote richiede approvazione
                  </p>
                  <p className="text-label-md text-text-muted">
                    Deploy in prod richiede review esplicita di un Admin
                  </p>
                </div>
                <Switch
                  checked={settings.staging.promoteRequiresApproval}
                  onCheckedChange={(v) =>
                    updateSection(projectId, "staging", {
                      promoteRequiresApproval: v,
                    })
                  }
                />
              </div>
            </div>
          )}

          {settings.staging.stagingEnabled ? (
            <div
              className="flex gap-3 rounded-lg p-4"
              style={{
                background: "rgba(250, 204, 21, 0.07)",
                border: "1px solid rgba(250, 204, 21, 0.2)",
              }}
            >
              <AlertTriangle className="h-5 w-5 shrink-0 text-warning" />
              <div className="flex flex-col gap-1">
                <p className="text-body-sm font-semibold text-warning">
                  Staging non indicizzato
                </p>
                <p className="text-body-sm text-secondary-text">
                  robots.txt blocca i bot. Non usare staging per link pubblici.
                </p>
              </div>
            </div>
          ) : (
            <div
              className="flex gap-3 rounded-lg p-4"
              style={{
                background: "rgba(74, 222, 128, 0.07)",
                border: "1px solid rgba(74, 222, 128, 0.2)",
              }}
            >
              <CheckCircle2 className="h-5 w-5 shrink-0 text-success" />
              <div className="flex flex-col gap-1">
                <p className="text-body-sm font-semibold text-success">
                  Nessun ambiente staging
                </p>
                <p className="text-body-sm text-secondary-text">
                  Attiva staging quando vuoi testare modifiche non critiche
                  prima di pubblicare.
                </p>
              </div>
            </div>
          )}

          <button
            type="button"
            className="mt-auto flex items-center justify-center gap-2 rounded-lg bg-surface-container-lowest px-4 py-2.5 text-body-sm font-medium text-on-surface hover:bg-surface-container-low transition-colors"
          >
            <BookOpen className="h-4 w-4 text-secondary-text" />
            Documentazione Pipeline
          </button>
        </section>

        <section className="rounded-xl bg-surface-container-high p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-title-md font-semibold text-on-surface">
              Versioni
            </h2>
            <StatusPill variant="neutral">{versions.length} build</StatusPill>
          </div>
          <ul className="flex max-h-[520px] flex-col gap-2 overflow-y-auto">
            {versions.map((v, i) => (
              <li
                key={v.id}
                className="rounded-lg bg-surface-container-lowest px-4 py-3"
              >
                <div className="mb-1.5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-body-md font-semibold text-on-surface">
                      {v.versionTag}
                    </span>
                    {i === 0 ? (
                      <StatusPill variant="success">1 LIVE</StatusPill>
                    ) : (
                      <StatusPill variant="neutral">{v.status}</StatusPill>
                    )}
                  </div>
                  <span className="text-label-sm text-text-muted">
                    {format(v.publishedAt, "d MMM · HH:mm", { locale: it })}
                  </span>
                </div>
                <p className="text-body-sm text-secondary-text">
                  {v.description ?? "—"}
                </p>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-label-sm text-text-muted">
                    Published by{" "}
                    <span className="text-secondary-text">
                      {v.publishedBy}
                    </span>
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {v.changes.map((c) => (
                      <span
                        key={c}
                        className="rounded bg-surface-container px-1.5 py-0.5 font-mono text-label-sm text-molten-primary"
                      >
                        {c}
                      </span>
                    ))}
                  </div>
                </div>
                {i === 0 ? (
                  <button
                    type="button"
                    className="mt-3 flex items-center gap-1.5 text-label-md font-medium text-molten-primary hover:text-molten-accent-hover"
                  >
                    Apri URL pubblico
                    <ExternalLink className="h-3 w-3" />
                  </button>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
