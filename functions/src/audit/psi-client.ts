import {
  SiteAuditRecord,
  AuditStrategy,
  AuditOpportunity,
  CoreWebVitals,
} from "./psi-types";

/**
 * Wrapper per Google PageSpeed Insights API v5.
 * Endpoint: https://www.googleapis.com/pagespeedonline/v5/runPagespeed
 *
 * Fallback stub-mode quando la PSI_API_KEY non è disponibile (ambiente locale
 * o secret non ancora configurato). Mock deterministici hash-based per consentire
 * sviluppo UI realistico senza consumare quota.
 */

const PSI_ENDPOINT =
  "https://www.googleapis.com/pagespeedonline/v5/runPagespeed";

export type PsiOptions = {
  url: string;
  strategy?: AuditStrategy;
  apiKey?: string;
};

export async function runPsiAudit(
  opts: PsiOptions,
): Promise<SiteAuditRecord> {
  const startedAt = Date.now();
  const strategy = opts.strategy ?? "mobile";

  if (!opts.apiKey) {
    return {
      ...buildStubAudit(opts.url, strategy),
      durationMs: Date.now() - startedAt,
    };
  }

  const params = new URLSearchParams({
    url: opts.url,
    strategy,
    key: opts.apiKey,
  });
  for (const cat of ["performance", "accessibility", "best-practices", "seo"]) {
    params.append("category", cat);
  }

  const res = await fetch(`${PSI_ENDPOINT}?${params}`, {
    method: "GET",
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`PSI ${res.status}: ${body.slice(0, 300)}`);
  }
  const json = (await res.json()) as PsiRawResponse;
  return {
    ...parsePsiResponse(json, opts.url, strategy),
    durationMs: Date.now() - startedAt,
  };
}

// ─── Live-mode parser ─────────────────────────────────────────────────────

type PsiRawResponse = {
  lighthouseResult?: {
    categories?: Record<string, { score?: number | null }>;
    audits?: Record<
      string,
      {
        title?: string;
        description?: string;
        score?: number | null;
        numericValue?: number;
        details?: { overallSavingsMs?: number };
      }
    >;
  };
};

function parsePsiResponse(
  raw: PsiRawResponse,
  url: string,
  strategy: AuditStrategy,
): Omit<SiteAuditRecord, "durationMs"> {
  const lh = raw.lighthouseResult;
  const cats = lh?.categories ?? {};
  const audits = lh?.audits ?? {};

  const score = (k: string): number =>
    Math.round((cats[k]?.score ?? 0) * 100);

  const audit = (k: string): number | null => {
    const v = audits[k]?.numericValue;
    return typeof v === "number" ? v : null;
  };

  const cwv: CoreWebVitals = {
    lcp: audit("largest-contentful-paint"),
    cls: audit("cumulative-layout-shift"),
    inp: audit("interaction-to-next-paint") ?? audit("interactive"),
    ttfb: audit("server-response-time"),
    fcp: audit("first-contentful-paint"),
  };

  const opportunities: AuditOpportunity[] = Object.entries(audits)
    .filter(
      ([, a]) =>
        typeof a.score === "number" && a.score < 0.9 && a.title,
    )
    .map(([id, a]): AuditOpportunity => {
      const s = a.score ?? 1;
      const severity: AuditOpportunity["severity"] =
        s < 0.5 ? "critical" : s < 0.75 ? "warning" : "info";
      return {
        id,
        title: a.title ?? id,
        description: (a.description ?? "").slice(0, 240),
        severity,
        estimatedSavingsMs: a.details?.overallSavingsMs,
      };
    })
    .sort(
      (a, b) =>
        (b.estimatedSavingsMs ?? 0) - (a.estimatedSavingsMs ?? 0),
    )
    .slice(0, 10);

  return {
    url,
    strategy,
    scores: {
      performance: score("performance"),
      accessibility: score("accessibility"),
      bestPractices: score("best-practices"),
      seo: score("seo"),
    },
    cwv,
    opportunities,
    source: "psi-live",
  };
}

// ─── Stub-mode (deterministic from URL hash) ──────────────────────────────

function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) >>> 0;
  }
  return h;
}

function buildStubAudit(
  url: string,
  strategy: AuditStrategy,
): Omit<SiteAuditRecord, "durationMs"> {
  const h = hashStr(`${url}:${strategy}`);
  const rand = (offset: number, min: number, max: number) =>
    min + ((h >> offset) & 0xff) * ((max - min) / 255);

  const perf = Math.round(rand(0, 55, 95));
  const a11y = Math.round(rand(8, 70, 99));
  const bp = Math.round(rand(16, 70, 95));
  const seo = Math.round(rand(24, 65, 100));

  const STUB_OPPS: AuditOpportunity[] = [
    {
      id: "render-blocking-resources",
      title: "Eliminare le risorse che bloccano il rendering",
      description:
        "Risorse CSS/JS bloccano il primo paint. Differire o inline il critico.",
      severity: "critical",
      estimatedSavingsMs: Math.round(rand(0, 800, 2400)),
    },
    {
      id: "unused-javascript",
      title: "Ridurre il JavaScript inutilizzato",
      description:
        "Bundle contiene codice mai eseguito. Code-splitting o tree-shaking.",
      severity: "warning",
      estimatedSavingsMs: Math.round(rand(8, 400, 1500)),
    },
    {
      id: "uses-optimized-images",
      title: "Servire immagini in formati next-gen",
      description:
        "Convertire JPG/PNG in WebP/AVIF riduce il peso fino al 50%.",
      severity: "warning",
      estimatedSavingsMs: Math.round(rand(16, 200, 900)),
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

  return {
    url,
    strategy,
    scores: {
      performance: perf,
      accessibility: a11y,
      bestPractices: bp,
      seo,
    },
    cwv: {
      lcp: Math.round(rand(0, 1500, 4500)),
      cls: Number(rand(8, 0.05, 0.25).toFixed(2)),
      inp: Math.round(rand(16, 80, 350)),
      ttfb: Math.round(rand(24, 200, 900)),
      fcp: Math.round(rand(2, 800, 2800)),
    },
    opportunities: STUB_OPPS.slice(
      0,
      4 + (h & 0x3),
    ),
    source: "psi-stub",
  };
}
