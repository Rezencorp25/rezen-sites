"use client";

import { use, useState } from "react";
import {
  LineChart,
  Eye as MetaIcon,
  DollarSign,
  Target,
  Zap,
  Copy,
  Code2,
  CheckCircle2,
  Circle,
} from "lucide-react";
import { toast } from "sonner";
import { useProjectsStore } from "@/lib/stores/projects-store";
import { useSettingsStore } from "@/lib/stores/settings-store";
import { StatusPill } from "@/components/luminous/status-pill";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ConversionWizard } from "@/components/seo/conversion-wizard";
import { UtmBuilderCard } from "@/components/seo/utm-builder-card";
import { CustomEventsCard } from "@/components/seo/custom-events-card";
import { cn } from "@/lib/utils";

type IntegrationKey = "ga4" | "metaPixel" | "adsense" | "googleAds";

const INTEGRATIONS: {
  key: IntegrationKey;
  title: string;
  description: string;
  placeholder: string;
  icon: typeof LineChart;
}[] = [
  {
    key: "ga4",
    title: "Google Analytics 4",
    description: "Measurement ID (G-XXXXXX)",
    placeholder: "G-XXXXXXXXXX",
    icon: LineChart,
  },
  {
    key: "metaPixel",
    title: "Meta Pixel",
    description: "Pixel ID conversion tracking Facebook/Instagram",
    placeholder: "902345671234567",
    icon: MetaIcon,
  },
  {
    key: "adsense",
    title: "Google AdSense",
    description: "Publisher ID per monetizzazione",
    placeholder: "pub-1234567890123456",
    icon: DollarSign,
  },
  {
    key: "googleAds",
    title: "Google Ads",
    description: "Conversion ID + Label",
    placeholder: "AW-10987654321",
    icon: Target,
  },
];

export default function SettingsTrackingPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = use(params);
  const project = useProjectsStore((s) => s.getById(projectId));
  const settings = useSettingsStore((s) => s.get(projectId));
  const updateSection = useSettingsStore((s) => s.updateSection);
  const [snippetTab, setSnippetTab] = useState<"header" | "footer">("header");

  if (!project) return null;

  // Seed from project integrations on first render.
  const currentTracking = settings.tracking;
  const ids = {
    ga4: currentTracking.ga4.id || project.integrations.googleAnalytics?.measurementId || "",
    metaPixel:
      currentTracking.metaPixel.id ||
      project.integrations.metaPixel?.pixelId ||
      "",
    adsense:
      currentTracking.adsense.id ||
      project.integrations.googleAdsense?.publisherId ||
      "",
    googleAds:
      currentTracking.googleAds.id ||
      project.integrations.googleAds?.conversionId ||
      "",
  };

  const snippet = snippetTab === "header" ? buildHeaderSnippet(ids) : buildFooterSnippet(ids);

  function copySnippet() {
    navigator.clipboard.writeText(snippet);
    toast.success("Snippet copiato negli appunti");
  }

  return (
    <div className="mx-auto max-w-5xl px-10 pb-12 pt-2">
      <ConversionWizard projectId={projectId} />

      <div className="mb-5 grid gap-4 grid-cols-1 md:grid-cols-2">
        {INTEGRATIONS.map((integration) => {
          const section = settings.tracking[integration.key];
          const hasId =
            section.id || currentIntegrationHasSeed(project, integration.key);
          return (
            <div
              key={integration.key}
              className="flex flex-col rounded-xl bg-surface-container-high p-5"
            >
              <div className="mb-3 flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface-container-lowest">
                    <integration.icon className="h-4 w-4 text-molten-primary" />
                  </div>
                  <div className="flex flex-col leading-tight">
                    <span className="text-body-md font-semibold text-on-surface">
                      {integration.title}
                    </span>
                    <span className="text-label-sm text-text-muted">
                      {integration.description}
                    </span>
                  </div>
                </div>
                {section.verified || hasId ? (
                  <StatusPill
                    variant="success"
                    className="flex items-center gap-1"
                  >
                    <CheckCircle2 className="h-3 w-3" />
                    Verificato
                  </StatusPill>
                ) : (
                  <StatusPill
                    variant="neutral"
                    className="flex items-center gap-1"
                  >
                    <Circle className="h-3 w-3" />
                    Non configurato
                  </StatusPill>
                )}
              </div>
              <div className="flex flex-col gap-1.5">
                <Label
                  htmlFor={integration.key}
                  className="text-label-sm text-text-muted"
                >
                  ID
                </Label>
                <Input
                  id={integration.key}
                  value={section.id}
                  placeholder={integration.placeholder}
                  onChange={(e) =>
                    updateSection(projectId, "tracking", {
                      [integration.key]: {
                        ...section,
                        id: e.target.value,
                        verified: Boolean(e.target.value),
                      },
                    } as Partial<typeof settings.tracking>)
                  }
                  className="h-10 bg-surface-container-low border-none font-mono text-body-sm"
                />
              </div>
            </div>
          );
        })}
      </div>

      <section
        className="mb-5 rounded-xl p-6"
        style={{
          background:
            "linear-gradient(135deg, rgba(255,181,153,0.15), rgba(245,97,23,0.08))",
          border: "1px solid rgba(245,97,23,0.3)",
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="flex h-11 w-11 items-center justify-center rounded-lg"
            style={{
              background: "linear-gradient(135deg,#ffb599,#f56117)",
            }}
          >
            <Zap className="h-5 w-5 text-on-molten" />
          </div>
          <div className="flex-1">
            <h3 className="text-title-md font-semibold text-on-surface">
              Integrazione API Direct
            </h3>
            <p className="text-body-sm text-secondary-text">
              Invia eventi server-side direttamente a GA4 + Meta CAPI, bypassando ad-blocker. Setup
              in DOC 3.
            </p>
          </div>
          <button
            type="button"
            className="shrink-0 rounded-lg bg-surface-container-highest px-4 py-2 text-body-sm font-semibold text-on-surface"
          >
            Abilita
          </button>
        </div>
      </section>

      <div className="mb-5">
        <UtmBuilderCard
          defaultBaseUrl={`https://${project.domain}/landing`}
        />
      </div>

      <div className="mb-5">
        <CustomEventsCard projectId={projectId} />
      </div>

      <section className="rounded-xl bg-surface-container-high">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2.5">
            <Code2 className="h-4 w-4 text-molten-primary" />
            <h2 className="text-title-md font-semibold text-on-surface">
              Snippet Preview
            </h2>
          </div>
          <div className="flex gap-2">
            <div className="inline-flex items-center gap-1 rounded-lg bg-surface-container-lowest p-1">
              {(["header", "footer"] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setSnippetTab(tab)}
                  className={cn(
                    "h-8 rounded-md px-3 text-body-sm font-medium capitalize transition-all",
                    snippetTab === tab
                      ? "bg-surface-container-highest text-on-surface"
                      : "text-text-muted hover:text-on-surface",
                  )}
                >
                  {tab === "header" ? "Header Code" : "Footer Code"}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={copySnippet}
              className="flex items-center gap-1.5 rounded-lg bg-surface-container-lowest px-3 py-2 text-body-sm font-medium text-on-surface hover:bg-surface-container-low transition-colors"
            >
              <Copy className="h-3.5 w-3.5 text-secondary-text" />
              Copia Snippet
            </button>
          </div>
        </div>
        <pre className="mx-4 mb-4 overflow-x-auto rounded-lg bg-[#0a0a14] p-5 font-mono text-label-md leading-6">
          <code className="whitespace-pre">
            {highlight(snippet)}
          </code>
        </pre>
      </section>
    </div>
  );
}

function currentIntegrationHasSeed(
  project: NonNullable<ReturnType<typeof useProjectsStore.getState>["getById"]> extends never
    ? never
    : ReturnType<typeof useProjectsStore.getState>["getById"] extends (
          id: string,
        ) => infer R
      ? R
      : never,
  key: IntegrationKey,
) {
  if (!project) return false;
  switch (key) {
    case "ga4":
      return !!project.integrations.googleAnalytics?.verified;
    case "metaPixel":
      return !!project.integrations.metaPixel?.verified;
    case "adsense":
      return !!project.integrations.googleAdsense?.verified;
    case "googleAds":
      return !!project.integrations.googleAds?.verified;
  }
}

function buildHeaderSnippet(ids: Record<IntegrationKey, string>) {
  const parts: string[] = ["<!-- REZEN Sites — header tracking -->"];
  if (ids.ga4) {
    parts.push(
      `<script async src="https://www.googletagmanager.com/gtag/js?id=${ids.ga4}"></script>`,
      `<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', '${ids.ga4}', { anonymize_ip: true });
</script>`,
    );
  }
  if (ids.metaPixel) {
    parts.push(`<script>
  !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
  n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
  n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
  t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
  document,'script','https://connect.facebook.net/en_US/fbevents.js');
  fbq('init', '${ids.metaPixel}');
  fbq('track', 'PageView');
</script>`);
  }
  if (ids.adsense) {
    parts.push(
      `<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-${ids.adsense}" crossorigin="anonymous"></script>`,
    );
  }
  return parts.join("\n\n") || "<!-- Nessuna integrazione configurata -->";
}

function buildFooterSnippet(ids: Record<IntegrationKey, string>) {
  const parts: string[] = ["<!-- REZEN Sites — footer tracking -->"];
  if (ids.googleAds) {
    parts.push(`<script>
  gtag('event', 'conversion', {
    'send_to': '${ids.googleAds}/CONVERSION_LABEL',
    'event_callback': function(){ console.log('conv fired'); }
  });
</script>`);
  }
  if (ids.metaPixel) {
    parts.push(`<noscript>
  <img height="1" width="1" style="display:none" src="https://www.facebook.com/tr?id=${ids.metaPixel}&ev=PageView&noscript=1"/>
</noscript>`);
  }
  return parts.join("\n\n") || "<!-- Nessuna integrazione configurata -->";
}

function highlight(code: string) {
  // Minimal terminal-style syntax coloring using spans.
  const parts = code.split(/(<!--[\s\S]*?-->|'[^']*'|"[^"]*")/g);
  return parts.map((part, i) => {
    if (part.startsWith("<!--")) {
      return (
        <span key={i} style={{ color: "#4ade80" }}>
          {part}
        </span>
      );
    }
    if (/^['"].*['"]$/.test(part)) {
      return (
        <span key={i} style={{ color: "#ffb599" }}>
          {part}
        </span>
      );
    }
    return (
      <span key={i} style={{ color: "#94a3b8" }}>
        {part}
      </span>
    );
  });
}
