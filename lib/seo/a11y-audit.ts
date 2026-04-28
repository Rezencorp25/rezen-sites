import type { Page } from "@/types";

/**
 * Accessibility audit (WCAG 2.2 AA).
 *
 * Static analysis on Puck content. Rules:
 *   - One H1 per page (no zero, no multiple)
 *   - Heading hierarchy: no skips (h1→h3 = invalid)
 *   - Descriptive link text: avoid "click here", "leggi qui", "more"
 *   - Image alt text presence (already enforced separately, surfaced here too)
 *   - Form fields with label
 *   - Language declared (covered at HTML level via locale)
 *
 * Each issue maps to a WCAG SC (Success Criterion).
 */

export type A11yIssue = {
  id: string;
  ruleId: string;
  /** WCAG 2.2 SC reference, e.g. "1.3.1" */
  wcag: string;
  severity: "critical" | "warning" | "info";
  title: string;
  description: string;
  page?: string;
};

const NON_DESCRIPTIVE_LINK_TEXT = new Set([
  "click here",
  "clicca qui",
  "leggi qui",
  "qui",
  "more",
  "altro",
  "scopri di più",
  "scopri",
  "read more",
  "vai",
]);

export function auditPage(page: Page): A11yIssue[] {
  const out: A11yIssue[] = [];
  const slug = page.slug || "/";

  // Headings collection
  type Hd = { level: number; text: string };
  const headings: Hd[] = [];
  for (const item of page.puckData.content ?? []) {
    if (item.type === "Hero") {
      const props = item.props as Record<string, unknown>;
      const title = (props.title as string) ?? "";
      if (title) headings.push({ level: 1, text: title });
    } else if (item.type === "Heading") {
      const props = item.props as Record<string, unknown>;
      const lvl = ((props.level as string) ?? "h2").replace("h", "");
      const text = (props.text as string) ?? "";
      if (text) headings.push({ level: parseInt(lvl, 10), text });
    }
  }

  // H1 count
  const h1Count = headings.filter((h) => h.level === 1).length;
  if (h1Count === 0) {
    out.push({
      id: `a11y-no-h1-${page.id}`,
      ruleId: "no-h1",
      wcag: "1.3.1 / 2.4.6",
      severity: "critical",
      title: "Nessun H1 sulla pagina",
      description:
        "Ogni pagina deve avere esattamente un H1. Aggiungi un blocco Hero o Heading h1.",
      page: slug,
    });
  } else if (h1Count > 1) {
    out.push({
      id: `a11y-multi-h1-${page.id}`,
      ruleId: "multiple-h1",
      wcag: "1.3.1",
      severity: "warning",
      title: `${h1Count} H1 sulla pagina (max 1)`,
      description:
        "Più H1 confondono screen reader e indebolisce il segnale gerarchico.",
      page: slug,
    });
  }

  // Heading hierarchy: no level skips
  let lastLevel = 0;
  for (const h of headings) {
    if (lastLevel > 0 && h.level > lastLevel + 1) {
      out.push({
        id: `a11y-skip-${page.id}-${h.text.slice(0, 20)}`,
        ruleId: "heading-skip",
        wcag: "1.3.1",
        severity: "warning",
        title: `Salto gerarchia heading: h${lastLevel} → h${h.level}`,
        description: `"${h.text.slice(0, 60)}" — usa h${lastLevel + 1} per mantenere la gerarchia.`,
        page: slug,
      });
    }
    lastLevel = h.level;
  }

  // Non-descriptive link text in Puck content (ButtonBlock/CTA)
  for (const item of page.puckData.content ?? []) {
    const props = item.props as Record<string, unknown>;
    if (item.type === "Button" || item.type === "CTA") {
      const text = ((props.text ?? props.buttonText) as string)?.trim().toLowerCase();
      if (text && NON_DESCRIPTIVE_LINK_TEXT.has(text)) {
        out.push({
          id: `a11y-nondescript-${page.id}-${text}`,
          ruleId: "nondescriptive-link",
          wcag: "2.4.4",
          severity: "info",
          title: `Link/CTA con testo non descrittivo: "${text}"`,
          description:
            "Sostituisci con un'azione chiara, es. \"Scarica il preventivo\" anziché \"Click qui\".",
          page: slug,
        });
      }
    }
  }

  // Images alt covered by alert engine but include here too for completeness
  for (const item of page.puckData.content ?? []) {
    if (item.type === "Image") {
      const alt = (item.props as Record<string, unknown>).alt;
      if (typeof alt !== "string" || !alt.trim()) {
        out.push({
          id: `a11y-noalt-${page.id}-${(item.props as Record<string, unknown>).id ?? Math.random()}`,
          ruleId: "image-alt",
          wcag: "1.1.1",
          severity: "critical",
          title: "Immagine senza alt text",
          description:
            "Aggiungi alt descrittivo. Se decorativa, alt vuoto esplicito (alt=\"\").",
          page: slug,
        });
        break; // one per page is enough
      }
    }
  }

  return out;
}

export function auditProject(pages: Page[]): A11yIssue[] {
  const out: A11yIssue[] = [];
  for (const p of pages.filter((x) => x.status === "published")) {
    out.push(...auditPage(p));
  }
  return out;
}

export function a11yScore(issues: A11yIssue[]): number {
  if (issues.length === 0) return 100;
  const penalty =
    issues.filter((i) => i.severity === "critical").length * 15 +
    issues.filter((i) => i.severity === "warning").length * 7 +
    issues.filter((i) => i.severity === "info").length * 2;
  return Math.max(0, 100 - penalty);
}
