"use client";

import { Plus, X, Send, Globe2, GitBranch, Database } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSettingsStore } from "@/lib/stores/settings-store";

export function TrackingAdvanced({ projectId }: { projectId: string }) {
  const settings = useSettingsStore((s) => s.get(projectId));
  const updateSection = useSettingsStore((s) => s.updateSection);
  const t = settings.tracking;

  function patch(p: Partial<typeof t>) {
    updateSection(projectId, "tracking", p);
  }

  function addDomain() {
    patch({ crossDomains: [...(t.crossDomains ?? []), ""] });
  }
  function updateDomain(i: number, val: string) {
    const next = [...(t.crossDomains ?? [])];
    next[i] = val;
    patch({ crossDomains: next });
  }
  function removeDomain(i: number) {
    patch({ crossDomains: (t.crossDomains ?? []).filter((_, idx) => idx !== i) });
  }

  function fireTestPixel(label: string) {
    toast.success(`Test event "${label}" inviato (mock)`);
  }

  return (
    <section className="rounded-xl bg-surface-container-high p-6">
      <div className="mb-4 flex items-center gap-2.5">
        <GitBranch className="h-4 w-4 text-molten-primary" />
        <h2 className="text-title-md font-semibold text-on-surface">
          Tracking avanzato
        </h2>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <Globe2 className="h-3.5 w-3.5 text-molten-primary" />
            <Label className="text-label-md text-secondary-text">
              Cross-domain tracking
            </Label>
          </div>
          <p className="mb-2 text-label-md text-text-muted">
            Domini aggiuntivi da includere nel linker GA4 (es. blog/checkout
            su sub-dominio diverso).
          </p>
          <div className="flex flex-col gap-1.5">
            {(t.crossDomains ?? []).length === 0 ? (
              <p className="rounded-md border border-dashed border-outline/30 px-3 py-2 text-label-md text-text-muted">
                Nessun cross-domain.
              </p>
            ) : (
              (t.crossDomains ?? []).map((d, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Input
                    value={d}
                    onChange={(e) => updateDomain(i, e.target.value)}
                    placeholder="checkout.example.ch"
                    className="font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => removeDomain(i)}
                    className="flex h-9 w-9 items-center justify-center rounded-md bg-surface-container hover:bg-surface-container-highest"
                    aria-label="Rimuovi"
                  >
                    <X className="h-4 w-4 text-error" />
                  </button>
                </div>
              ))
            )}
          </div>
          <button
            type="button"
            onClick={addDomain}
            className="mt-2 inline-flex items-center gap-1 rounded-md px-2 py-1 text-label-md text-molten-primary hover:bg-surface-container-highest"
          >
            <Plus className="h-3 w-3" />
            Aggiungi dominio
          </button>
        </div>

        <div>
          <div className="mb-2 flex items-center gap-2">
            <Database className="h-3.5 w-3.5 text-molten-primary" />
            <Label className="text-label-md text-secondary-text">
              GA4 data retention
            </Label>
          </div>
          <select
            value={t.dataRetentionMonths ?? 14}
            onChange={(e) =>
              patch({
                dataRetentionMonths: parseInt(e.target.value, 10) as
                  | 2
                  | 14
                  | 26
                  | 38
                  | 50,
              })
            }
            className="h-10 w-full rounded-md bg-surface-container-low px-3 text-body-sm"
          >
            <option value={2}>2 mesi (default GA4)</option>
            <option value={14}>14 mesi (raccomandato)</option>
            <option value={26}>26 mesi</option>
            <option value={38}>38 mesi</option>
            <option value={50}>50 mesi (Analytics 360)</option>
          </select>
          <p className="mt-1 text-label-md text-text-muted">
            Tempo di conservazione user-level + event-level data.
          </p>

          <div className="mt-4 flex items-center gap-2">
            <GitBranch className="h-3.5 w-3.5 text-molten-primary" />
            <Label className="text-label-md text-secondary-text">
              Attribution model (multi-touch)
            </Label>
          </div>
          <select
            value={t.attributionModel ?? "last-click"}
            onChange={(e) =>
              patch({
                attributionModel:
                  e.target.value as typeof t.attributionModel,
              })
            }
            className="mt-1 h-10 w-full rounded-md bg-surface-container-low px-3 text-body-sm"
          >
            <option value="last-click">Last-click (default)</option>
            <option value="first-click">First-click</option>
            <option value="linear">Linear (split equal)</option>
            <option value="time-decay">Time-decay</option>
            <option value="position-based">Position-based 40/20/40</option>
            <option value="data-driven">Data-driven (ML, GA4 only)</option>
          </select>
        </div>

        <div className="md:col-span-2">
          <div className="mb-2 flex items-center gap-2">
            <Send className="h-3.5 w-3.5 text-molten-primary" />
            <Label className="text-label-md text-secondary-text">
              Pixel debug — fire test event
            </Label>
          </div>
          <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
            <button
              type="button"
              onClick={() => fireTestPixel("GA4 page_view")}
              disabled={!t.ga4.id}
              className="rounded-md bg-surface-container-low px-3 py-2 text-label-md font-medium text-on-surface hover:bg-surface-container disabled:opacity-50"
            >
              GA4 test
            </button>
            <button
              type="button"
              onClick={() => fireTestPixel("Meta PageView")}
              disabled={!t.metaPixel.id}
              className="rounded-md bg-surface-container-low px-3 py-2 text-label-md font-medium text-on-surface hover:bg-surface-container disabled:opacity-50"
            >
              Meta test
            </button>
            <button
              type="button"
              onClick={() => fireTestPixel("Google Ads conversion")}
              disabled={!t.googleAds.id}
              className="rounded-md bg-surface-container-low px-3 py-2 text-label-md font-medium text-on-surface hover:bg-surface-container disabled:opacity-50"
            >
              Ads test
            </button>
            <button
              type="button"
              onClick={() => fireTestPixel("Form → GA4 mapping")}
              className="rounded-md bg-success-container px-3 py-2 text-label-md font-medium text-success hover:brightness-110"
            >
              Form→GA4
            </button>
          </div>
          <p className="mt-2 text-label-md text-text-muted">
            Form submissions sono auto-mappate come evento GA4 `form_submit`
            (vedi Custom events sopra). Il test event verifica che il
            data-layer push avvenga correttamente.
          </p>
        </div>
      </div>
    </section>
  );
}
