"use client";

import { Languages, Plus, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSettingsStore } from "@/lib/stores/settings-store";

const COMMON_LOCALES = [
  "it",
  "en",
  "en-US",
  "en-GB",
  "de",
  "de-CH",
  "fr",
  "fr-CH",
  "es",
  "pt",
  "nl",
];

export function HreflangEditor({ projectId }: { projectId: string }) {
  const settings = useSettingsStore((s) => s.get(projectId));
  const updateSection = useSettingsStore((s) => s.updateSection);
  const general = settings.general;

  function setDefault(loc: string) {
    updateSection(projectId, "general", { defaultLocale: loc });
  }
  function addAlternate() {
    updateSection(projectId, "general", {
      alternates: [...general.alternates, { hreflang: "en", href: "" }],
    });
  }
  function updateAlternate(i: number, patch: { hreflang?: string; href?: string }) {
    const next = [...general.alternates];
    next[i] = { ...next[i], ...patch };
    updateSection(projectId, "general", { alternates: next });
  }
  function removeAlternate(i: number) {
    updateSection(projectId, "general", {
      alternates: general.alternates.filter((_, idx) => idx !== i),
    });
  }

  return (
    <section className="rounded-xl bg-surface-container-high p-6">
      <div className="mb-4 flex items-center gap-2.5">
        <Languages className="h-4 w-4 text-molten-primary" />
        <h2 className="text-title-md font-semibold text-on-surface">
          Lingue & hreflang
        </h2>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label className="text-label-md text-secondary-text">
            Lingua di default (BCP 47)
          </Label>
          <div className="flex gap-2">
            <Input
              value={general.defaultLocale}
              onChange={(e) => setDefault(e.target.value)}
              placeholder="it"
              className="font-mono"
              maxLength={8}
            />
            <select
              onChange={(e) => e.target.value && setDefault(e.target.value)}
              className="rounded-md bg-surface-container-low px-3 text-body-sm"
              value=""
            >
              <option value="">scegli…</option>
              {COMMON_LOCALES.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <Label className="text-label-md text-secondary-text">
              Versioni alternative ({general.alternates.length})
            </Label>
            <button
              type="button"
              onClick={addAlternate}
              className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-label-md text-molten-primary hover:bg-surface-container-highest"
            >
              <Plus className="h-3 w-3" />
              Aggiungi
            </button>
          </div>
          {general.alternates.length === 0 ? (
            <p className="rounded-md border border-dashed border-outline/30 px-3 py-2 text-label-md text-text-muted">
              Nessuna versione alternativa. Aggiungi se servi mercati esteri.
            </p>
          ) : (
            <div className="flex flex-col gap-1.5">
              {general.alternates.map((alt, i) => (
                <div
                  key={i}
                  className="grid grid-cols-[100px_1fr_36px] gap-2"
                >
                  <Input
                    value={alt.hreflang}
                    onChange={(e) =>
                      updateAlternate(i, { hreflang: e.target.value })
                    }
                    placeholder="en-US"
                    className="font-mono"
                  />
                  <Input
                    value={alt.href}
                    onChange={(e) => updateAlternate(i, { href: e.target.value })}
                    placeholder="https://example.com/en/"
                    className="font-mono text-body-sm"
                  />
                  <button
                    type="button"
                    onClick={() => removeAlternate(i)}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-surface-container hover:bg-surface-container-highest"
                    aria-label="Rimuovi"
                  >
                    <X className="h-4 w-4 text-error" />
                  </button>
                </div>
              ))}
            </div>
          )}
          <p className="text-label-md text-text-muted">
            Inietta `&lt;link rel=&quot;alternate&quot; hreflang=&quot;…&quot;&gt;` in
            ogni pagina esportata + `x-default`.
          </p>
        </div>
      </div>
    </section>
  );
}
