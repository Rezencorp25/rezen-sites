"use client";

import { useState } from "react";
import {
  CheckCircle2,
  Circle,
  ListChecks,
  Wand2,
  AlertCircle,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSettingsStore } from "@/lib/stores/settings-store";
import {
  validateTrackingId,
  type TrackingId,
} from "@/lib/seo/tracking-validator";

const STEPS: {
  key: TrackingId;
  title: string;
  description: string;
  example: string;
  hint: string;
}[] = [
  {
    key: "ga4",
    title: "Step 1 · Google Analytics 4",
    description:
      "Crea una property GA4 su analytics.google.com → Admin → Property → Data Streams → Web. Copia il Measurement ID.",
    example: "G-XXXXXXXXXX",
    hint: "Imposta una conversion event \"form_submit\" subito.",
  },
  {
    key: "metaPixel",
    title: "Step 2 · Meta Pixel",
    description:
      "Da business.facebook.com → Events Manager → Connect Data Sources → Web. Copia il Pixel ID (15-16 cifre).",
    example: "902345671234567",
    hint: "Configura anche Conversions API server-side per AY su iOS.",
  },
  {
    key: "googleAds",
    title: "Step 3 · Google Ads conversion",
    description:
      "Su ads.google.com → Tools → Conversions → +. Tipo: Website. Categoria: Submit lead. Copia AW-… e Conversion Label.",
    example: "AW-10987654321/abc_xyz",
    hint: "L'enhanced conversion richiede sha256 hash di email/phone — fatto a deploy.",
  },
  {
    key: "adsense",
    title: "Step 4 · AdSense (opzionale)",
    description:
      "Solo se monetizzi con annunci. adsense.google.com → Setup → Site verification.",
    example: "pub-1234567890123456",
    hint: "Skip se non hai monetizzazione AdSense.",
  },
];

export function ConversionWizard({ projectId }: { projectId: string }) {
  const settings = useSettingsStore((s) => s.get(projectId));
  const updateSection = useSettingsStore((s) => s.updateSection);
  const [open, setOpen] = useState(false);

  const completedCount = STEPS.filter((s) => {
    const id = settings.tracking[s.key].id;
    return id && validateTrackingId(id, s.key).valid;
  }).length;

  return (
    <section className="mb-5 rounded-xl bg-surface-container-high">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-4 rounded-xl px-6 py-4 text-left hover:bg-surface-container"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface-container-lowest">
            <Wand2 className="h-4 w-4 text-molten-primary" />
          </div>
          <div>
            <p className="text-body-md font-semibold text-on-surface">
              Conversion tracking wizard
            </p>
            <p className="text-label-md text-text-muted">
              Step-by-step per GA4, Meta Pixel, Google Ads, AdSense
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-body-sm text-text-muted">
          <ListChecks className="h-4 w-4 text-molten-primary" />
          {completedCount} / {STEPS.length} configurati
          <span className="ml-2 text-label-md">{open ? "▴" : "▾"}</span>
        </div>
      </button>

      {open && (
        <div className="border-t border-outline/20 px-6 py-5">
          <ol className="flex flex-col gap-4">
            {STEPS.map((step) => {
              const section = settings.tracking[step.key];
              const validation = validateTrackingId(section.id, step.key);
              const done = validation.valid;
              return (
                <li
                  key={step.key}
                  className="rounded-lg border border-outline/20 bg-surface-container-low p-4"
                >
                  <div className="mb-2 flex items-start gap-2">
                    {done ? (
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                    ) : (
                      <Circle className="mt-0.5 h-4 w-4 shrink-0 text-text-muted" />
                    )}
                    <div className="flex-1">
                      <p className="text-body-md font-semibold text-on-surface">
                        {step.title}
                      </p>
                      <p className="text-body-sm text-secondary-text">
                        {step.description}
                      </p>
                    </div>
                  </div>
                  <div className="ml-6 flex flex-col gap-2">
                    <div className="flex flex-col gap-1.5">
                      <Label className="text-label-md text-secondary-text">
                        {step.example}
                      </Label>
                      <Input
                        value={section.id}
                        onChange={(e) =>
                          updateSection(projectId, "tracking", {
                            [step.key]: {
                              ...section,
                              id: e.target.value,
                              verified: validateTrackingId(
                                e.target.value,
                                step.key,
                              ).valid,
                            },
                          } as Partial<typeof settings.tracking>)
                        }
                        placeholder={step.example}
                        className="font-mono"
                      />
                    </div>
                    {section.id && !validation.valid && (
                      <div className="flex items-start gap-1.5 rounded-md bg-error-container px-2 py-1">
                        <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-error" />
                        <p className="text-label-md text-on-surface">
                          {validation.message}
                        </p>
                      </div>
                    )}
                    <p className="text-label-md text-text-muted">
                      💡 {step.hint}
                    </p>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      )}
    </section>
  );
}
