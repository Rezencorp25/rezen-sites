"use client";

import { Lock, Plus, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSettingsStore } from "@/lib/stores/settings-store";

export function PrivacyEditor({ projectId }: { projectId: string }) {
  const settings = useSettingsStore((s) => s.get(projectId));
  const updateSection = useSettingsStore((s) => s.updateSection);
  const p = settings.privacy;

  function patch(patchObj: Partial<typeof p>) {
    updateSection(projectId, "privacy", patchObj);
  }

  function addHint() {
    patch({ piiFieldHints: [...p.piiFieldHints, ""] });
  }
  function updateHint(i: number, val: string) {
    const next = [...p.piiFieldHints];
    next[i] = val;
    patch({ piiFieldHints: next });
  }
  function removeHint(i: number) {
    patch({ piiFieldHints: p.piiFieldHints.filter((_, idx) => idx !== i) });
  }

  return (
    <section className="rounded-xl bg-surface-container-high p-6">
      <div className="mb-4 flex items-center gap-2.5">
        <Lock className="h-4 w-4 text-molten-primary" />
        <h2 className="text-title-md font-semibold text-on-surface">
          Privacy & PII
        </h2>
      </div>
      <p className="mb-4 text-body-sm text-text-muted">
        Configurazione data residency, mascheramento PII nelle form
        submissions e Data Subject Access Request (GDPR art. 15-22).
      </p>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-1.5">
          <Label className="text-label-md text-secondary-text">
            Data residency
          </Label>
          <select
            value={p.dataResidency}
            onChange={(e) =>
              patch({
                dataResidency: e.target.value as
                  | "eu"
                  | "us"
                  | "ch"
                  | "auto",
              })
            }
            className="h-10 w-full rounded-md bg-surface-container-low px-3 text-body-sm"
          >
            <option value="eu">EU (Belgium / Frankfurt)</option>
            <option value="ch">Swiss (Zurich)</option>
            <option value="us">United States</option>
            <option value="auto">Auto (closest to user)</option>
          </select>
          <p className="text-label-md text-text-muted">
            Form submissions + analytics data storage region.
          </p>
        </div>

        <div className="space-y-1.5">
          <Label className="text-label-md text-secondary-text">
            Hash strategy
          </Label>
          <select
            value={p.hashStrategy}
            onChange={(e) =>
              patch({ hashStrategy: e.target.value as "sha256" | "none" })
            }
            className="h-10 w-full rounded-md bg-surface-container-low px-3 text-body-sm"
          >
            <option value="sha256">SHA-256 (raccomandato)</option>
            <option value="none">Nessuno</option>
          </select>
          <p className="text-label-md text-text-muted">
            Per Enhanced Conversions (Meta CAPI, Google Ads).
          </p>
        </div>

        <div className="md:col-span-2 space-y-1.5">
          <Label className="text-label-md text-secondary-text">
            DSAR contact email
          </Label>
          <Input
            type="email"
            value={p.dsarEmail}
            onChange={(e) => patch({ dsarEmail: e.target.value })}
            placeholder="privacy@dominio.ch"
          />
          <p className="text-label-md text-text-muted">
            Email pubblicata sulla privacy policy per richieste accesso/
            cancellazione dati (GDPR art. 15/17, CCPA, LGPD).
          </p>
        </div>

        <div className="space-y-1.5">
          <Label className="text-label-md text-secondary-text">
            Retention form submissions (giorni)
          </Label>
          <Input
            type="number"
            min={30}
            max={3650}
            value={p.retentionDays}
            onChange={(e) =>
              patch({ retentionDays: parseInt(e.target.value, 10) || 365 })
            }
          />
          <p className="text-label-md text-text-muted">
            Dopo questi giorni le submissions vengono auto-eliminate.
          </p>
        </div>

        <div className="md:col-span-2">
          <div className="mb-1.5 flex items-center justify-between">
            <Label className="text-label-md text-secondary-text">
              PII field hints (mascheramento auto)
            </Label>
            <button
              type="button"
              onClick={addHint}
              className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-label-md text-molten-primary hover:bg-surface-container-highest"
            >
              <Plus className="h-3 w-3" />
              Aggiungi
            </button>
          </div>
          <div className="flex flex-col gap-1.5">
            {p.piiFieldHints.map((h, i) => (
              <div key={i} className="flex items-center gap-2">
                <Input
                  value={h}
                  onChange={(e) => updateHint(i, e.target.value)}
                  placeholder="email"
                  className="font-mono"
                />
                <button
                  type="button"
                  onClick={() => removeHint(i)}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-surface-container hover:bg-surface-container-highest"
                  aria-label="Rimuovi"
                >
                  <X className="h-4 w-4 text-error" />
                </button>
              </div>
            ))}
          </div>
          <p className="mt-1 text-label-md text-text-muted">
            Field con questi nomi (case-insensitive substring match) vengono
            cifrati at-rest e mascherati nei log/dashboards.
          </p>
        </div>
      </div>
    </section>
  );
}
