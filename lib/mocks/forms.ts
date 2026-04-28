import type { FormSubmission } from "@/types";

const UTM_SOURCES = ["google", "linkedin", "meta", "newsletter", "direct"];
const UTM_MEDIUMS = ["cpc", "social", "email", "organic"];
const UTM_CAMPAIGNS = [
  "brand_search",
  "audit_lp",
  "q2_retarget",
  "newsletter_apr",
];

const FORM_NAMES = ["Contact Main", "Newsletter", "Demo Request", "Audit"];
const PAGES = ["/audit", "/contact", "/pricing-plans", "/", "/blog"];

const ITALIAN_NAMES = [
  "Marco Bianchi",
  "Giulia Rossi",
  "Andrea Conti",
  "Sofia Esposito",
  "Luca Romano",
  "Elena Ferrari",
  "Davide Ricci",
  "Martina Gallo",
  "Francesco Russo",
  "Chiara Greco",
];

const COMPANIES = [
  "Edilizia Alpina SA",
  "Ticino Tax",
  "Arte Verde",
  "OpenFood",
  "Solaris Energy",
  "Atrium Wellness",
  "Café Luna",
  "Norte Logistics",
];

function rnd<T>(arr: T[], seed: number): T {
  return arr[seed % arr.length]!;
}

/**
 * Deterministic submission generator. Anchors `now` to a fixed date so
 * SSR and CSR produce identical output (no hydration mismatches).
 *
 * NOTE: also avoids Math.random everywhere — uses index-derived seeds.
 */
const NOW_ANCHOR = new Date("2026-04-28T12:00:00Z").getTime();

export function generateFormSubmissions(
  projectId: string,
  count: number,
  daysBack = 30,
): FormSubmission[] {
  const out: FormSubmission[] = [];
  const projectSeed = projectId.length * 17;
  for (let i = 0; i < count; i++) {
    const daysAgo = (i * 7 + projectSeed) % daysBack;
    const hoursAgo = (i * 13 + projectSeed) % 24;
    const minutesAgo = (i * 31 + projectSeed) % 60;
    const createdAt = new Date(
      NOW_ANCHOR -
        daysAgo * 86400000 -
        hoursAgo * 3600000 -
        minutesAgo * 60000,
    );
    const hasUtm = (i * 11 + projectSeed) % 3 !== 0;
    const hasGclid = (i * 7 + projectSeed) % 4 === 0;
    const name = rnd(ITALIAN_NAMES, i * 3 + 1);
    out.push({
      id: `${projectId}-sub-${i.toString().padStart(3, "0")}`,
      projectId,
      formName: rnd(FORM_NAMES, i + 7),
      page: rnd(PAGES, i * 5 + 2),
      fields: {
        name,
        email: name
          .toLowerCase()
          .replace(" ", ".")
          .replace(/[^a-z.]/g, "") +
          "@" +
          rnd(
            ["gmail.com", "outlook.com", "pec.it", "libero.it"],
            i * 2,
          ),
        company: rnd(COMPANIES, i * 11 + 3),
        message: "Vorrei ricevere maggiori informazioni sui vostri servizi.",
      },
      utm: hasUtm
        ? {
            source: rnd(UTM_SOURCES, i * 7 + 5),
            medium: rnd(UTM_MEDIUMS, i * 3 + 9),
            campaign: rnd(UTM_CAMPAIGNS, i * 13 + 11),
          }
        : undefined,
      gclid: hasGclid
        ? `CjwKCAiA${(i * 9999 + projectSeed).toString(36).padEnd(12, "x").slice(0, 12)}`
        : undefined,
      createdAt,
    });
  }
  return out.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}
