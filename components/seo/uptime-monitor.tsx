"use client";

import { Activity, Mail, MessageSquare } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useSettingsStore } from "@/lib/stores/settings-store";

export function UptimeMonitor({ projectId }: { projectId: string }) {
  const settings = useSettingsStore((s) => s.get(projectId));
  const updateSection = useSettingsStore((s) => s.updateSection);
  const u = settings.uptime;

  function patch(p: Partial<typeof u>) {
    updateSection(projectId, "uptime", p);
  }

  const tone =
    u.uptime30d >= 99.9 ? "success" : u.uptime30d >= 99 ? "warning" : "error";

  return (
    <section className="rounded-xl bg-surface-container-high p-6">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Activity className="h-4 w-4 text-molten-primary" />
          <h2 className="text-title-md font-semibold text-on-surface">
            Uptime monitoring
          </h2>
        </div>
        <Switch
          checked={u.enabled}
          onCheckedChange={(v) => patch({ enabled: v })}
        />
      </div>

      {!u.enabled ? (
        <p className="text-body-sm text-text-muted">
          Attiva per pingare il sito ogni N minuti da multiple regioni; alert
          automatici in caso di downtime &gt; 1min. Provider: Better Stack /
          Cronitor / UptimeRobot al go-live.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div className="md:col-span-2 flex items-center justify-between rounded-lg border border-outline/20 bg-surface-container-low p-3">
            <div>
              <p className="text-label-sm uppercase text-text-muted">
                Uptime ultimi 30 giorni
              </p>
              <p
                className="mt-1 text-headline-md font-bold tabular-nums"
                style={{
                  color:
                    tone === "success"
                      ? "#5ec27f"
                      : tone === "warning"
                        ? "#e6b340"
                        : "#e66b6b",
                }}
              >
                {u.uptime30d.toFixed(2)}%
              </p>
            </div>
            <div className="text-right">
              <p className="text-label-sm uppercase text-text-muted">
                Ultimo incident
              </p>
              <p className="mt-1 font-mono text-body-sm text-secondary-text">
                {u.lastIncidentAt
                  ? new Date(u.lastIncidentAt).toLocaleString("it-IT")
                  : "Nessuno"}
              </p>
            </div>
          </div>

          <div className="md:col-span-2 space-y-1.5">
            <Label className="text-label-md text-secondary-text">
              URL da monitorare
            </Label>
            <Input
              value={u.monitorUrl}
              onChange={(e) => patch({ monitorUrl: e.target.value })}
              placeholder={settings.general.siteUrl || "https://example.ch/"}
              className="font-mono text-body-sm"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-label-md text-secondary-text">
              Intervallo (minuti)
            </Label>
            <select
              value={u.checkInterval}
              onChange={(e) =>
                patch({ checkInterval: parseInt(e.target.value, 10) })
              }
              className="h-10 w-full rounded-md bg-surface-container-low px-3 text-body-sm"
            >
              <option value={1}>1 min</option>
              <option value={5}>5 min</option>
              <option value={10}>10 min</option>
              <option value={30}>30 min</option>
              <option value={60}>60 min</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-label-md text-secondary-text">
              Alert via
            </Label>
            <select
              value={u.alertChannel}
              onChange={(e) =>
                patch({
                  alertChannel: e.target.value as
                    | "email"
                    | "slack"
                    | "sms"
                    | "none",
                })
              }
              className="h-10 w-full rounded-md bg-surface-container-low px-3 text-body-sm"
            >
              <option value="none">Nessuno</option>
              <option value="email">Email</option>
              <option value="slack">Slack webhook</option>
              <option value="sms">SMS</option>
            </select>
          </div>

          {u.alertChannel === "email" && (
            <div className="md:col-span-2 space-y-1.5">
              <Label className="text-label-md text-secondary-text">
                <Mail className="mr-1 inline h-3.5 w-3.5" />
                Email destinatario
              </Label>
              <Input
                type="email"
                value={u.alertEmail}
                onChange={(e) => patch({ alertEmail: e.target.value })}
                placeholder="ops@dominio.ch"
              />
            </div>
          )}
          {u.alertChannel === "slack" && (
            <div className="md:col-span-2 space-y-1.5">
              <Label className="text-label-md text-secondary-text">
                <MessageSquare className="mr-1 inline h-3.5 w-3.5" />
                Slack webhook URL
              </Label>
              <Input
                value={u.alertEmail}
                onChange={(e) => patch({ alertEmail: e.target.value })}
                placeholder="https://hooks.slack.com/services/..."
                className="font-mono text-body-sm"
              />
            </div>
          )}
        </div>
      )}
    </section>
  );
}
