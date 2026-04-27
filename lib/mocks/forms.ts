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

export function generateFormSubmissions(
  projectId: string,
  count: number,
  daysBack = 30,
): FormSubmission[] {
  const out: FormSubmission[] = [];
  for (let i = 0; i < count; i++) {
    const daysAgo = Math.floor(Math.random() * daysBack);
    const hoursAgo = Math.floor(Math.random() * 24);
    const createdAt = new Date();
    createdAt.setDate(createdAt.getDate() - daysAgo);
    createdAt.setHours(createdAt.getHours() - hoursAgo);
    const hasUtm = Math.random() > 0.35;
    const hasGclid = Math.random() > 0.7;
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
        ? `CjwKCAiA${Math.random().toString(36).slice(2, 14)}`
        : undefined,
      createdAt,
    });
  }
  return out.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}
