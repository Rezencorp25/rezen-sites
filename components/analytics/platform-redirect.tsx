"use client";

import { ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

export type PlatformKey = "google-ads" | "adsense" | "ga4" | "meta-ads";

const PLATFORM_META: Record<
  PlatformKey,
  { label: string; url: string; description: string }
> = {
  "google-ads": {
    label: "Google Ads",
    url: "https://ads.google.com",
    description: "Gestione campagne, budget, parole chiave, audience.",
  },
  adsense: {
    label: "Google AdSense",
    url: "https://adsense.google.com",
    description: "Configurazione blocchi, ottimizzazione revenue, payment.",
  },
  ga4: {
    label: "Google Analytics",
    url: "https://analytics.google.com",
    description: "Esplorazioni avanzate, audience builder, attribution.",
  },
  "meta-ads": {
    label: "Meta Ads Manager",
    url: "https://business.facebook.com/adsmanager",
    description: "Campagne Facebook + Instagram, audience, creativi.",
  },
};

export function PlatformRedirect({
  platform,
  className,
  variant = "card",
}: {
  platform: PlatformKey;
  className?: string;
  variant?: "card" | "inline";
}) {
  const meta = PLATFORM_META[platform];

  if (variant === "inline") {
    return (
      <a
        href={meta.url}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(
          "inline-flex items-center gap-1.5 rounded-md bg-surface-container-low px-2.5 py-1 text-label-md font-medium text-secondary-text hover:bg-surface-container-high hover:text-on-surface transition-colors",
          className,
        )}
      >
        Apri in {meta.label}
        <ExternalLink className="h-3 w-3" />
      </a>
    );
  }

  return (
    <a
      href={meta.url}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "group flex items-start justify-between gap-3 rounded-xl bg-surface-container-high p-4 hover:bg-surface-container-highest transition-colors",
        className,
      )}
    >
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-1.5 text-label-md font-semibold uppercase tracking-widest text-text-muted">
          Approfondimento
        </div>
        <p className="text-body-sm font-semibold text-on-surface">
          Apri in {meta.label}
        </p>
        <p className="text-label-sm text-text-muted">{meta.description}</p>
      </div>
      <ExternalLink className="h-4 w-4 shrink-0 text-text-muted transition-colors group-hover:text-molten-primary" />
    </a>
  );
}
