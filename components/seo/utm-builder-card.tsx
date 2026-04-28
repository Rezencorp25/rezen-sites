"use client";

import { useMemo, useState } from "react";
import { Copy, Link2, AlertCircle, Wand2 } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  buildUtmUrl,
  normalizeUtm,
  validateUtmParams,
  type UtmParams,
} from "@/lib/seo/utm-builder";

const COMMON_SOURCES = ["google", "facebook", "linkedin", "newsletter", "instagram"];
const COMMON_MEDIUMS = ["cpc", "social", "email", "organic", "display", "referral"];

export function UtmBuilderCard({ defaultBaseUrl }: { defaultBaseUrl: string }) {
  const [baseUrl, setBaseUrl] = useState(defaultBaseUrl);
  const [params, setParams] = useState<UtmParams>({
    source: "",
    medium: "",
    campaign: "",
    term: "",
    content: "",
  });

  function patch(p: Partial<UtmParams>) {
    setParams((cur) => ({ ...cur, ...p }));
  }

  const validation = useMemo(() => validateUtmParams(params), [params]);
  const built = useMemo(() => buildUtmUrl(baseUrl, params), [baseUrl, params]);

  return (
    <section className="rounded-xl bg-surface-container-high p-6">
      <div className="mb-4 flex items-center gap-2.5">
        <Link2 className="h-4 w-4 text-molten-primary" />
        <h2 className="text-title-md font-semibold text-on-surface">
          UTM builder
        </h2>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div className="md:col-span-2 flex flex-col gap-1.5">
          <Label className="text-label-md text-secondary-text">URL base</Label>
          <Input
            value={baseUrl}
            onChange={(e) => setBaseUrl(e.target.value)}
            placeholder="https://example.ch/landing"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label className="text-label-md text-secondary-text">
            utm_source*
          </Label>
          <Input
            list="utm-sources"
            value={params.source}
            onChange={(e) => patch({ source: normalizeUtm(e.target.value) })}
            placeholder="google"
            className="font-mono"
          />
          <datalist id="utm-sources">
            {COMMON_SOURCES.map((s) => (
              <option key={s} value={s} />
            ))}
          </datalist>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label className="text-label-md text-secondary-text">
            utm_medium*
          </Label>
          <Input
            list="utm-mediums"
            value={params.medium}
            onChange={(e) => patch({ medium: normalizeUtm(e.target.value) })}
            placeholder="cpc"
            className="font-mono"
          />
          <datalist id="utm-mediums">
            {COMMON_MEDIUMS.map((s) => (
              <option key={s} value={s} />
            ))}
          </datalist>
        </div>

        <div className="md:col-span-2 flex flex-col gap-1.5">
          <Label className="text-label-md text-secondary-text">
            utm_campaign*
          </Label>
          <Input
            value={params.campaign}
            onChange={(e) => patch({ campaign: normalizeUtm(e.target.value) })}
            placeholder="black_friday_2026"
            className="font-mono"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label className="text-label-md text-secondary-text">utm_term</Label>
          <Input
            value={params.term ?? ""}
            onChange={(e) => patch({ term: normalizeUtm(e.target.value) })}
            placeholder="seo+svizzera"
            className="font-mono"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label className="text-label-md text-secondary-text">
            utm_content
          </Label>
          <Input
            value={params.content ?? ""}
            onChange={(e) => patch({ content: normalizeUtm(e.target.value) })}
            placeholder="hero_cta_v2"
            className="font-mono"
          />
        </div>
      </div>

      {validation.warnings.length > 0 && (
        <div className="mt-3 rounded-md border border-warning/40 bg-warning-container px-3 py-2">
          <div className="mb-1 flex items-center gap-1.5">
            <AlertCircle className="h-3.5 w-3.5 text-warning" />
            <span className="text-label-md font-semibold text-on-surface">
              {validation.warnings.length} warning
            </span>
          </div>
          <ul className="ml-4 list-disc space-y-0.5 text-label-md text-secondary-text">
            {validation.warnings.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-4 flex items-start gap-2 rounded-lg border border-outline/20 bg-surface-container-lowest p-3">
        <Wand2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-molten-primary" />
        <p className="flex-1 break-all font-mono text-label-md text-on-surface">
          {built}
        </p>
        <button
          type="button"
          onClick={() => {
            navigator.clipboard.writeText(built);
            toast.success("URL UTM copiato");
          }}
          className="shrink-0 rounded-md bg-surface-container px-2 py-1 text-label-md text-secondary-text hover:bg-surface-container-highest hover:text-on-surface"
        >
          <Copy className="h-3.5 w-3.5" />
        </button>
      </div>
    </section>
  );
}
