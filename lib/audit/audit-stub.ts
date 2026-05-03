import type {
  SiteAuditDoc,
  AuditCategoryScore,
  CoreWebVitals,
  AuditOpportunity,
  AuditStrategy,
} from "./audit-types";

/**
 * Port client-side della stub-logic in `functions/src/audit/psi-client.ts`.
 *
 * Usato finché il prototipo non ha auth Firebase reale: la Cloud Function
 * `runSiteAudit` esiste ed è pronta per la versione prod, ma in locale
 * simuliamo qui con identica forma del payload.
 */

function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) >>> 0;
  }
  return h;
}

function computeHealthScore(scores: AuditCategoryScore): number {
  const weighted =
    scores.performance * 0.4 +
    scores.seo * 0.3 +
    scores.accessibility * 0.15 +
    scores.bestPractices * 0.15;
  return Math.round(weighted);
}

const STUB_OPPS_TEMPLATE: Omit<AuditOpportunity, "estimatedSavingsMs">[] = [
  {
    id: "render-blocking-resources",
    title: "Eliminare le risorse che bloccano il rendering",
    description:
      "Risorse CSS/JS bloccano il primo paint. Differire o inline il critico.",
    severity: "critical",
  },
  {
    id: "unused-javascript",
    title: "Ridurre il JavaScript inutilizzato",
    description:
      "Bundle contiene codice mai eseguito. Code-splitting o tree-shaking.",
    severity: "warning",
  },
  {
    id: "uses-optimized-images",
    title: "Servire immagini in formati next-gen",
    description:
      "Convertire JPG/PNG in WebP/AVIF riduce il peso fino al 50%.",
    severity: "warning",
  },
  {
    id: "meta-description",
    title: "Documenti senza meta description",
    description:
      "Una meta description ben scritta migliora il CTR organico nei risultati di ricerca.",
    severity: "info",
  },
  {
    id: "color-contrast",
    title: "Contrasto colore insufficiente",
    description:
      "Alcuni testi non rispettano il rapporto WCAG AA (4.5:1 per body).",
    severity: "warning",
  },
  {
    id: "image-alt",
    title: "Immagini senza attributo alt",
    description:
      "Aggiungere alt-text descrittivi per accessibilità e SEO immagini.",
    severity: "info",
  },
];

export type StubAuditInput = {
  url: string;
  strategy?: AuditStrategy;
  /** Bias applicato al seed; usalo per simulare miglioramenti tra audit. */
  drift?: number;
};

export function runStubAudit(
  input: StubAuditInput,
): Omit<SiteAuditDoc, "id" | "createdAt" | "triggeredBy"> {
  const startedAt = Date.now();
  const strategy = input.strategy ?? "mobile";
  const seed = hashStr(`${input.url}:${strategy}:${input.drift ?? 0}`);

  const rand = (offset: number, min: number, max: number) =>
    min + ((seed >> offset) & 0xff) * ((max - min) / 255);

  const scores: AuditCategoryScore = {
    performance: Math.round(rand(0, 55, 95)),
    accessibility: Math.round(rand(8, 70, 99)),
    bestPractices: Math.round(rand(16, 70, 95)),
    seo: Math.round(rand(24, 65, 100)),
  };

  const cwv: CoreWebVitals = {
    lcp: Math.round(rand(0, 1500, 4500)),
    cls: Number(rand(8, 0.05, 0.25).toFixed(2)),
    inp: Math.round(rand(16, 80, 350)),
    ttfb: Math.round(rand(24, 200, 900)),
    fcp: Math.round(rand(2, 800, 2800)),
  };

  const opportunities: AuditOpportunity[] = STUB_OPPS_TEMPLATE.slice(
    0,
    4 + (seed & 0x3),
  ).map((o, idx) => ({
    ...o,
    estimatedSavingsMs:
      o.severity === "info"
        ? undefined
        : Math.round(rand((idx + 1) * 4, 200, 2400)),
  }));

  return {
    url: input.url,
    strategy,
    scores,
    cwv,
    opportunities,
    source: "psi-stub",
    durationMs: 1200 + (seed & 0x3ff),
    healthScore: computeHealthScore(scores),
  };
}

/** Simula la latenza di una vera chiamata PSI (~6-12s in produzione). */
export function simulatedAuditDelayMs(): number {
  return 1800 + Math.random() * 1400;
}
