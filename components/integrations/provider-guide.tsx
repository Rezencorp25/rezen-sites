"use client";

import { ExternalLink } from "lucide-react";
import type { ProviderGuide } from "@/lib/integrations/providers";

export function ProviderGuideBlock({ guide }: { guide: ProviderGuide }) {
  return (
    <div className="rounded-lg bg-surface-container-low p-4">
      <h4 className="mb-2 text-label-md font-semibold uppercase tracking-wider text-text-muted">
        {guide.headline}
      </h4>
      <ol className="ml-4 flex list-decimal flex-col gap-1.5 text-body-sm text-on-surface">
        {guide.steps.map((s, i) => (
          <li key={i}>{s}</li>
        ))}
      </ol>
      <a
        href={guide.docsUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3 inline-flex items-center gap-1 text-label-sm text-sky-300 hover:text-sky-200"
      >
        <ExternalLink className="h-3 w-3" />
        Documentazione ufficiale
      </a>
    </div>
  );
}
