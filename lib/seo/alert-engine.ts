import type { Alert, Page, Project, AlertSeverity } from "@/types";
import { validateRedirects } from "./redirect-validator";
import type { Redirect } from "@/types";
import type { LocalBusinessSettings } from "@/lib/stores/settings-store";
import { detectOrphanPages } from "./internal-linking";
import { auditProject } from "./a11y-audit";
import { generatePageviews } from "@/lib/mocks/pageviews";

/**
 * Rule-based alert engine. Computes live alerts from the actual project
 * state (pages SEO + redirects). Replaces MOCK_ALERTS for any project that
 * has real Page data in the store.
 *
 * Each rule produces 0..N alerts. Severity:
 *   - critical: blocking issues (missing required tags, broken redirects)
 *   - warning: SEO issues (length, schema gaps)
 *   - info: opportunities (content depth, internal linking)
 *   - ok: positive confirmations (configuration verified)
 */

const TITLE_MIN = 30;
const TITLE_MAX = 60;
const DESC_MIN = 110;
const DESC_MAX = 160;

export type AlertContext = {
  project: Project;
  pages: Page[];
  redirects: Redirect[];
  localBusiness?: LocalBusinessSettings;
};

type Rule = (ctx: AlertContext) => Alert[];

const ruleMissingMetaDescription: Rule = ({ project, pages }) => {
  return pages
    .filter((p) => p.status === "published" && !p.seo.metaDescription?.trim())
    .map((p) =>
      mkAlert({
        id: `meta-desc-${p.id}`,
        projectId: project.id,
        severity: "critical",
        title: `Meta description mancante su ${p.slug || "/"}`,
        description: `La pagina "${p.title}" non ha una meta description. Google genererà uno snippet automatico, perdendo controllo sul CTR.`,
        page: p.slug,
      }),
    );
};

const ruleTitleLength: Rule = ({ project, pages }) => {
  const out: Alert[] = [];
  for (const p of pages.filter((x) => x.status === "published")) {
    const t = p.seo.metaTitle?.trim() ?? "";
    if (!t) {
      out.push(
        mkAlert({
          id: `title-missing-${p.id}`,
          projectId: project.id,
          severity: "critical",
          title: `Meta title mancante su ${p.slug || "/"}`,
          description: `La pagina "${p.title}" non ha un meta title custom. Google userà il <h1> o il nome del sito.`,
          page: p.slug,
        }),
      );
    } else if (t.length > TITLE_MAX) {
      out.push(
        mkAlert({
          id: `title-long-${p.id}`,
          projectId: project.id,
          severity: "warning",
          title: `Title troppo lungo su ${p.slug || "/"}`,
          description: `${t.length} caratteri (max raccomandato ${TITLE_MAX}). Sarà troncato nei risultati.`,
          page: p.slug,
        }),
      );
    } else if (t.length < TITLE_MIN && t.length > 0) {
      out.push(
        mkAlert({
          id: `title-short-${p.id}`,
          projectId: project.id,
          severity: "warning",
          title: `Title corto su ${p.slug || "/"}`,
          description: `${t.length} caratteri (min raccomandato ${TITLE_MIN}). Aggiungi keyword + brand.`,
          page: p.slug,
        }),
      );
    }
  }
  return out;
};

const ruleDescriptionLength: Rule = ({ project, pages }) => {
  const out: Alert[] = [];
  for (const p of pages.filter((x) => x.status === "published")) {
    const d = p.seo.metaDescription?.trim() ?? "";
    if (!d) continue; // covered by ruleMissingMetaDescription
    if (d.length > DESC_MAX) {
      out.push(
        mkAlert({
          id: `desc-long-${p.id}`,
          projectId: project.id,
          severity: "warning",
          title: `Description troppo lunga su ${p.slug || "/"}`,
          description: `${d.length} caratteri (max ${DESC_MAX}). Verrà troncata.`,
          page: p.slug,
        }),
      );
    } else if (d.length < DESC_MIN) {
      out.push(
        mkAlert({
          id: `desc-short-${p.id}`,
          projectId: project.id,
          severity: "info",
          title: `Description corta su ${p.slug || "/"}`,
          description: `${d.length} caratteri (target ${DESC_MIN}-${DESC_MAX}). Espandi con benefici + CTA.`,
          page: p.slug,
        }),
      );
    }
  }
  return out;
};

const ruleHomeIndexable: Rule = ({ project, pages }) => {
  const home = pages.find((p) => p.slug === "/" || p.slug === "");
  if (!home) return [];
  if (!home.seo.indexable) {
    return [
      mkAlert({
        id: `home-noindex-${project.id}`,
        projectId: project.id,
        severity: "critical",
        title: "Homepage marcata noindex",
        description:
          "La home è marcata indexable=false: Google la escluderà dal sito. Verifica voluto.",
        page: "/",
      }),
    ];
  }
  return [];
};

const ruleMissingOgImage: Rule = ({ project, pages }) => {
  return pages
    .filter((p) => p.status === "published" && !p.seo.og?.image)
    .slice(0, 3) // cap to top 3 to avoid noise
    .map((p) =>
      mkAlert({
        id: `og-image-${p.id}`,
        projectId: project.id,
        severity: "info",
        title: `Open Graph image mancante su ${p.slug || "/"}`,
        description:
          "Senza og:image i social mostreranno fallback generico. Aggiungi 1200×630.",
        page: p.slug,
      }),
    );
};

const ruleAltText: Rule = ({ project, pages }) => {
  let count = 0;
  for (const p of pages) {
    for (const item of p.puckData.content ?? []) {
      if (item.type === "Image") {
        const alt = (item.props as Record<string, unknown>).alt;
        if (typeof alt !== "string" || !alt.trim()) count++;
      }
    }
  }
  if (count === 0) return [];
  return [
    mkAlert({
      id: `alt-text-${project.id}`,
      projectId: project.id,
      severity: count > 5 ? "warning" : "info",
      title: `${count} immagine/i senza alt text`,
      description:
        "Le immagini senza alt sono bloccanti per accessibilità (WCAG 2.2) e per SEO immagini. Risolvi nel SEO editor.",
    }),
  ];
};

const ruleRedirectIssues: Rule = ({ project, redirects }) => {
  const validation = validateRedirects(redirects);
  if (validation.issues.length === 0) return [];
  const critical = validation.issues.filter((i) => i.kind === "loop").length;
  return [
    mkAlert({
      id: `redirects-${project.id}`,
      projectId: project.id,
      severity: critical > 0 ? "critical" : "warning",
      title: `${validation.issues.length} problema/i nei redirect`,
      description: `Trovati: ${validation.issues
        .map((i) => i.kind)
        .join(", ")}. Apri Settings → Redirects per dettaglio.`,
    }),
  ];
};

const ruleNoSchema: Rule = ({ project, pages }) => {
  const hasFaqAnywhere = pages.some((p) =>
    p.puckData.content?.some((c) => c.type === "FAQ"),
  );
  if (hasFaqAnywhere) return [];
  // Suggest adding FAQ blocks for AEO
  if (pages.length >= 3) {
    return [
      mkAlert({
        id: `aeo-faq-${project.id}`,
        projectId: project.id,
        severity: "info",
        title: "Nessun blocco FAQ rilevato",
        description:
          "Aggiungi un blocco FAQ ad almeno una pagina chiave: triggera FAQPage schema → eligible per AI Overviews & rich results.",
      }),
    ];
  }
  return [];
};

/**
 * NAP audit: scan Puck content for hard-coded phone/email/address strings
 * that DIFFER from the LocalBusiness settings.
 */
const ruleNapConsistency: Rule = ({ project, pages, localBusiness }) => {
  if (!localBusiness?.enabled) return [];
  const lb = localBusiness;
  const inconsistencies: string[] = [];

  // Build canonical NAP fragments to look for
  const phoneCanon = lb.telephone.replace(/[\s\-().]/g, "");
  const emailCanon = lb.email.toLowerCase();
  const addressCanon = `${lb.streetAddress} ${lb.postalCode} ${lb.addressLocality}`
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();

  // Regex for phone-like strings (international + local)
  const phoneRegex = /\+?\d[\d\s\-().]{6,}\d/g;
  const emailRegex = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi;

  for (const p of pages) {
    const flat = JSON.stringify(p.puckData?.content ?? "");
    if (lb.telephone && phoneCanon) {
      const phones = flat.match(phoneRegex) ?? [];
      for (const ph of phones) {
        const norm = ph.replace(/[\s\-().]/g, "");
        if (norm.length >= 7 && norm !== phoneCanon) {
          inconsistencies.push(`${p.slug}: telefono ${ph} ≠ canonico`);
          break; // one per page is enough
        }
      }
    }
    if (lb.email && emailCanon) {
      const emails = flat.match(emailRegex) ?? [];
      for (const em of emails) {
        if (em.toLowerCase() !== emailCanon) {
          inconsistencies.push(`${p.slug}: email ${em} ≠ canonica`);
          break;
        }
      }
    }
    if (addressCanon.length > 5 && !flat.toLowerCase().includes(lb.addressLocality.toLowerCase())) {
      // address mention check is loose: just verify city appears at least once
      // skip — only flag if explicit mismatch found via stricter regex; keep audit
      // light to avoid false positives
    }
  }

  if (inconsistencies.length === 0) return [];
  return [
    mkAlert({
      id: `nap-${project.id}`,
      projectId: project.id,
      severity: "warning",
      title: `${inconsistencies.length} possibili NAP incoerenti`,
      description:
        "Trovati telefono/email diversi dal canonico LocalBusiness: " +
        inconsistencies.slice(0, 5).join(" · ") +
        (inconsistencies.length > 5
          ? ` (+${inconsistencies.length - 5} altri)`
          : ""),
    }),
  ];
};

const ruleOrphanPages: Rule = ({ project, pages }) => {
  if (pages.length < 3) return [];
  const orphans = detectOrphanPages(pages);
  // Don't flag the homepage as orphan
  const real = orphans.filter((p) => p.slug !== "/" && p.slug !== "");
  if (real.length === 0) return [];
  return [
    mkAlert({
      id: `orphan-${project.id}`,
      projectId: project.id,
      severity: "info",
      title: `${real.length} pagina/e orfana/e (no inbound link)`,
      description:
        "Pagine non linkate da nessun'altra: " +
        real
          .slice(0, 5)
          .map((p) => p.slug || `"${p.title}"`)
          .join(", ") +
        (real.length > 5 ? ` (+${real.length - 5})` : "") +
        ". Aggiungi link interni per topic cluster.",
    }),
  ];
};

const ruleA11y: Rule = ({ project, pages }) => {
  const issues = auditProject(pages);
  if (issues.length === 0) return [];
  const critical = issues.filter((i) => i.severity === "critical").length;
  const warnings = issues.filter((i) => i.severity === "warning").length;
  return [
    mkAlert({
      id: `a11y-${project.id}`,
      projectId: project.id,
      severity: critical > 0 ? "critical" : warnings > 0 ? "warning" : "info",
      title: `${issues.length} problema/i di accessibilità (WCAG 2.2)`,
      description: `${critical} critici, ${warnings} warning. Heading hierarchy, alt text, link descriptivi, struttura semantica.`,
    }),
  ];
};

/**
 * External link rel audit (A.7): scans Puck Button/CTA hrefs and flags
 * external links that should carry rel attributes.
 */
const ruleExternalLinkRel: Rule = ({ project, pages }) => {
  const projectDomain = project.domain;
  const externalLinks: string[] = [];
  for (const p of pages) {
    for (const item of p.puckData.content ?? []) {
      const props = item.props as Record<string, unknown>;
      const href = (props.href ?? props.buttonHref) as string | undefined;
      if (!href) continue;
      try {
        const url = new URL(href);
        if (
          url.hostname &&
          !url.hostname.includes(projectDomain) &&
          !url.hostname.includes("rezen.sites")
        ) {
          externalLinks.push(`${p.slug || "/"} → ${url.hostname}`);
        }
      } catch {
        // ignore relative URLs
      }
    }
  }
  if (externalLinks.length === 0) return [];
  return [
    mkAlert({
      id: `ext-rel-${project.id}`,
      projectId: project.id,
      severity: "info",
      title: `${externalLinks.length} link esterno/i senza rel review`,
      description:
        "Verifica rel=nofollow per link sponsorizzati, rel=ugc per UGC, " +
        "rel=noopener target=_blank sempre. Esempi: " +
        externalLinks.slice(0, 3).join(", ") +
        (externalLinks.length > 3 ? ` (+${externalLinks.length - 3})` : ""),
    }),
  ];
};

/**
 * Cookie inventory audit (H.80): controls that consent banner is enabled
 * if any tracking IDs are configured (GA4, Meta, Ads, AdSense).
 */
const ruleCookieInventory: Rule = ({ project }) => {
  // Without access to tracking settings here we use a coarse heuristic:
  // if the project has googleAnalytics/meta/etc verified, it should have
  // consent enabled. We can't access settings store from here without
  // making this a hook, so we use project.integrations as proxy.
  const integrations = project.integrations ?? {};
  const trackers: string[] = [];
  if (integrations.googleAnalytics?.verified) trackers.push("GA4");
  if (integrations.metaPixel?.verified) trackers.push("Meta Pixel");
  if (integrations.googleAdsense?.verified) trackers.push("AdSense");
  if (integrations.googleAds?.verified) trackers.push("Google Ads");
  if (trackers.length === 0) return [];
  return [
    mkAlert({
      id: `cookie-inv-${project.id}`,
      projectId: project.id,
      severity: "info",
      title: `${trackers.length} tracker attivo/i — verifica consent gating`,
      description: `Trovati: ${trackers.join(", ")}. Verifica che il banner consent sia attivo (Settings → Cookie banner) e che gli script siano caricati solo dopo grant.`,
    }),
  ];
};

/**
 * Anomaly detection: z-score based on rolling 7-day vs 28-day baseline.
 * Flags pageview spike or drop > 2σ.
 */
const ruleAnomalyDetection: Rule = ({ project }) => {
  // MOCK: read pageviews from the same generators the dashboards use
  const points = generatePageviews(project.id, 30);
  if (points.length < 14) return [];

  const recent = points.slice(-7).map((p) => p.pageviews);
  const baseline = points.slice(0, -7).map((p) => p.pageviews);
  if (baseline.length === 0) return [];

  const recentAvg = recent.reduce((s, n) => s + n, 0) / recent.length;
  const baselineAvg =
    baseline.reduce((s, n) => s + n, 0) / baseline.length;
  const baselineStd = Math.sqrt(
    baseline.reduce((s, n) => s + Math.pow(n - baselineAvg, 2), 0) /
      baseline.length,
  );

  if (baselineStd === 0 || baselineAvg === 0) return [];
  const zScore = (recentAvg - baselineAvg) / baselineStd;
  const pctChange = ((recentAvg - baselineAvg) / baselineAvg) * 100;

  if (Math.abs(zScore) < 2 || Math.abs(pctChange) < 25) return [];

  const isSpike = zScore > 0;
  return [
    mkAlert({
      id: `anomaly-${project.id}`,
      projectId: project.id,
      severity: isSpike ? "info" : "warning",
      title: isSpike
        ? `Spike traffico organico (+${pctChange.toFixed(0)}%)`
        : `Drop traffico organico (${pctChange.toFixed(0)}%)`,
      description: `Pageviews ultimi 7gg = ${recentAvg.toFixed(0)}, baseline 23gg = ${baselineAvg.toFixed(0)} (z-score ${zScore.toFixed(2)}). ${
        isSpike
          ? "Identifica fonte (referrer, social, news mention) per amplificare."
          : "Verifica Search Console per crawl errors o keyword cannibalization."
      }`,
    }),
  ];
};

const RULES: Rule[] = [
  ruleMissingMetaDescription,
  ruleTitleLength,
  ruleDescriptionLength,
  ruleHomeIndexable,
  ruleMissingOgImage,
  ruleAltText,
  ruleRedirectIssues,
  ruleNoSchema,
  ruleNapConsistency,
  ruleOrphanPages,
  ruleA11y,
  ruleAnomalyDetection,
  ruleExternalLinkRel,
  ruleCookieInventory,
];

export function computeAlerts(ctx: AlertContext): Alert[] {
  const all: Alert[] = [];
  for (const rule of RULES) {
    try {
      all.push(...rule(ctx));
    } catch {
      // never let a single rule break the page; skip
    }
  }
  // Sort by severity (critical → warning → info → ok)
  const order: Record<AlertSeverity, number> = {
    critical: 0,
    warning: 1,
    info: 2,
    ok: 3,
  };
  return all.sort((a, b) => order[a.severity] - order[b.severity]);
}

function mkAlert(input: Omit<Alert, "createdAt" | "acknowledged">): Alert {
  return {
    ...input,
    createdAt: new Date(),
    acknowledged: false,
  };
}
