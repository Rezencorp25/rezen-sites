import type {
  SeoDataService,
  SeoPageSnapshot,
  SeoIssue,
  CWVResult,
} from "./types";

function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

function hashString(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

function generateCWV(seed: number): CWVResult {
  const rnd = seeded(seed);
  // Mobile baseline (slightly worse than desktop, as in real life)
  const lcpMobile = Math.round((1.4 + rnd() * 2.4) * 10) / 10;
  const clsMobile = Math.round(rnd() * 0.18 * 1000) / 1000;
  const inpMobile = Math.round(80 + rnd() * 220);
  const fcpMobile = Math.round((0.9 + rnd() * 1.4) * 10) / 10;
  const ttfbMobile = Math.round(120 + rnd() * 380);

  const lcpDesktop = Math.round(lcpMobile * 0.65 * 10) / 10;
  const clsDesktop = Math.round(clsMobile * 0.7 * 1000) / 1000;
  const inpDesktop = Math.round(inpMobile * 0.7);
  const fcpDesktop = Math.round(fcpMobile * 0.7 * 10) / 10;
  const ttfbDesktop = Math.round(ttfbMobile * 0.85);

  // Score = weighted CWV pass-rate-like
  const lcpOK = lcpMobile < 2.5 ? 1 : lcpMobile < 4 ? 0.5 : 0;
  const clsOK = clsMobile < 0.1 ? 1 : clsMobile < 0.25 ? 0.5 : 0;
  const inpOK = inpMobile < 200 ? 1 : inpMobile < 500 ? 0.5 : 0;
  const score = Math.round(((lcpOK + clsOK + inpOK) / 3) * 100);
  const rating: CWVResult["rating"] =
    score >= 80 ? "good" : score >= 50 ? "needs-improvement" : "poor";

  return {
    url: "",
    mobile: {
      lcp: lcpMobile,
      cls: clsMobile,
      inp: inpMobile,
      fcp: fcpMobile,
      ttfb: ttfbMobile,
    },
    desktop: {
      lcp: lcpDesktop,
      cls: clsDesktop,
      inp: inpDesktop,
      fcp: fcpDesktop,
      ttfb: ttfbDesktop,
    },
    score,
    rating,
    fetchedAt: new Date(),
  };
}

const ISSUE_LIBRARY: Omit<SeoIssue, "id" | "affectedUrl">[] = [
  {
    severity: "critical",
    category: "meta",
    title: "Meta description mancante",
    description:
      "La pagina non ha una meta description. Google genererà uno snippet automatico, perdendo controllo sul CTR.",
  },
  {
    severity: "warning",
    category: "meta",
    title: "Title troppo lungo",
    description:
      "Il <title> supera 60 caratteri e verrà troncato nei risultati di ricerca.",
  },
  {
    severity: "warning",
    category: "schema",
    title: "Schema.org assente",
    description:
      "Nessun JSON-LD rilevato. Aggiungere markup Article/Organization/LocalBusiness aiuta i rich result.",
  },
  {
    severity: "info",
    category: "performance",
    title: "LCP sopra soglia su mobile",
    description:
      "LCP > 2.5s su mobile. Considerare image optimization e font preload.",
  },
  {
    severity: "warning",
    category: "accessibility",
    title: "Immagini senza alt",
    description:
      "Trovate immagini senza attributo alt — bloccante per accessibilità (WCAG) e SEO immagini.",
  },
  {
    severity: "info",
    category: "links",
    title: "Internal linking debole",
    description:
      "La pagina ha meno di 3 link interni outbound — opportunità di topic cluster.",
  },
  {
    severity: "warning",
    category: "indexability",
    title: "Canonical non self-referential",
    description:
      "L'URL canonical punta a una pagina diversa — verifica volontarietà.",
  },
];

/**
 * MOCK: Mock SEO/CWV service.
 * Replace with PageSpeedSeoService at go-live.
 */
export class MockSeoService implements SeoDataService {
  async getPageSnapshot(projectId: string, pageUrl: string): Promise<SeoPageSnapshot> {
    // MOCK:
    const seed = hashString(`${projectId}::${pageUrl}`);
    const cwv = generateCWV(seed);
    cwv.url = pageUrl;
    const rnd = seeded(seed + 1);

    // pick 0-3 issues deterministically
    const numIssues = Math.floor(rnd() * 4);
    const issues: SeoIssue[] = [];
    for (let i = 0; i < numIssues; i++) {
      const tpl = ISSUE_LIBRARY[Math.floor(rnd() * ISSUE_LIBRARY.length)]!;
      issues.push({
        id: `issue-${seed}-${i}`,
        affectedUrl: pageUrl,
        ...tpl,
      });
    }

    // Final score: penalize CWV bad rating + issues
    const scorePenalty =
      issues.filter((i) => i.severity === "critical").length * 18 +
      issues.filter((i) => i.severity === "warning").length * 8 +
      issues.filter((i) => i.severity === "info").length * 3;
    const score = Math.max(0, Math.min(100, cwv.score - scorePenalty));

    return { url: pageUrl, score, cwv, issues };
  }

  async getProjectScore(projectId: string): Promise<number> {
    // MOCK: Aggregate score per project — coherent with kpis seed
    const baseByProject: Record<string, number> = {
      "verumflow-ch": 82,
      "impresa-edile-carfi": 71,
      "consulting-bio": 64,
    };
    return baseByProject[projectId] ?? 70;
  }

  async getProjectIssues(projectId: string): Promise<SeoIssue[]> {
    // MOCK: 5-12 issues depending on project
    const seed = hashString(`issues::${projectId}`);
    const rnd = seeded(seed);
    const count =
      projectId === "verumflow-ch" ? 5 : projectId === "impresa-edile-carfi" ? 9 : 12;
    const issues: SeoIssue[] = [];
    for (let i = 0; i < count; i++) {
      const tpl = ISSUE_LIBRARY[Math.floor(rnd() * ISSUE_LIBRARY.length)]!;
      issues.push({
        id: `issue-${projectId}-${i}`,
        ...tpl,
      });
    }
    return issues;
  }
}
