import type { FormSubmission } from "@/types";

/**
 * Rule-based lead scorer (0-100).
 * Combines: source quality, email quality, form completeness, behavior signals.
 *
 * Higher score = warmer lead. Top tier (>70) gets routed to sales pronto;
 * mid (40-70) goes to nurture sequence; cold (<40) gets newsletter only.
 */

const HIGH_VALUE_SOURCES = new Set(["google", "linkedin", "newsletter"]);
const HIGH_VALUE_MEDIUMS = new Set(["cpc", "email", "organic"]);

const FREE_EMAIL_DOMAINS = new Set([
  "gmail.com",
  "yahoo.com",
  "hotmail.com",
  "outlook.com",
  "libero.it",
  "yahoo.it",
]);

export type LeadScore = {
  score: number;
  /** Tier: hot (>70), warm (40-70), cold (<40) */
  tier: "hot" | "warm" | "cold";
  signals: { label: string; weight: number; positive: boolean }[];
};

export function scoreLead(s: FormSubmission): LeadScore {
  const signals: { label: string; weight: number; positive: boolean }[] = [];
  let score = 30; // baseline

  // Source quality
  const utmSource = s.utm?.source?.toLowerCase();
  if (utmSource && HIGH_VALUE_SOURCES.has(utmSource)) {
    score += 10;
    signals.push({ label: `Source ${utmSource}`, weight: 10, positive: true });
  }

  // Medium quality (cpc/email/organic = intent signal)
  const utmMedium = s.utm?.medium?.toLowerCase();
  if (utmMedium && HIGH_VALUE_MEDIUMS.has(utmMedium)) {
    score += 8;
    signals.push({ label: `Medium ${utmMedium}`, weight: 8, positive: true });
  }

  // GCLID (Google Ads conversion = paid intent)
  if (s.gclid) {
    score += 12;
    signals.push({ label: "GCLID (paid click)", weight: 12, positive: true });
  }

  // Email quality
  const email = s.fields.email?.toLowerCase() ?? "";
  if (email) {
    const domain = email.split("@")[1] ?? "";
    if (domain && !FREE_EMAIL_DOMAINS.has(domain)) {
      score += 15;
      signals.push({ label: "Business email", weight: 15, positive: true });
    } else if (domain) {
      score -= 5;
      signals.push({ label: "Free email provider", weight: 5, positive: false });
    }
  }

  // Company present
  if (s.fields.company?.trim()) {
    score += 8;
    signals.push({ label: "Company filled", weight: 8, positive: true });
  }

  // Phone present
  if (s.fields.phone?.trim() || s.fields.tel?.trim()) {
    score += 6;
    signals.push({ label: "Phone provided", weight: 6, positive: true });
  }

  // Message length (engagement signal)
  const msgLen = (s.fields.message ?? "").trim().length;
  if (msgLen > 100) {
    score += 8;
    signals.push({ label: `Message ${msgLen} char (engaged)`, weight: 8, positive: true });
  } else if (msgLen < 20 && msgLen > 0) {
    score -= 4;
    signals.push({ label: "Short message", weight: 4, positive: false });
  }

  // Page context — high-intent landings boost
  const page = s.page?.toLowerCase() ?? "";
  if (page.includes("audit") || page.includes("preventivo") || page.includes("demo")) {
    score += 8;
    signals.push({ label: `Bottom-funnel page (${page})`, weight: 8, positive: true });
  }

  score = Math.max(0, Math.min(100, score));
  const tier: LeadScore["tier"] = score > 70 ? "hot" : score >= 40 ? "warm" : "cold";

  return { score, tier, signals };
}

export const TIER_META: Record<
  LeadScore["tier"],
  { label: string; color: string; routing: string }
> = {
  hot: {
    label: "Hot",
    color: "#e66b6b",
    routing: "Notifica immediata sales · email auto",
  },
  warm: {
    label: "Warm",
    color: "#e6b340",
    routing: "Nurture sequence 5 email",
  },
  cold: {
    label: "Cold",
    color: "#6ea8ff",
    routing: "Newsletter mensile",
  },
};
