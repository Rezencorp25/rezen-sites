export type UtmParams = {
  source: string;
  medium: string;
  campaign: string;
  term?: string;
  content?: string;
};

export type UtmValidation = {
  valid: boolean;
  warnings: string[];
};

const ALLOWED_MEDIUMS = new Set([
  "cpc",
  "ppc",
  "paidsocial",
  "email",
  "social",
  "display",
  "referral",
  "organic",
  "affiliate",
  "video",
  "qr",
  "sms",
  "push",
]);

export function buildUtmUrl(baseUrl: string, params: UtmParams): string {
  let url: URL;
  try {
    url = new URL(baseUrl);
  } catch {
    return baseUrl;
  }
  const sp = url.searchParams;
  sp.set("utm_source", params.source);
  sp.set("utm_medium", params.medium);
  sp.set("utm_campaign", params.campaign);
  if (params.term) sp.set("utm_term", params.term);
  if (params.content) sp.set("utm_content", params.content);
  return url.toString();
}

export function validateUtmParams(params: UtmParams): UtmValidation {
  const warnings: string[] = [];

  for (const [k, v] of Object.entries(params)) {
    if (typeof v !== "string") continue;
    if (v && v !== v.toLowerCase()) {
      warnings.push(`utm_${k}: lowercase raccomandato (${v})`);
    }
    if (v && /\s/.test(v)) {
      warnings.push(
        `utm_${k}: spazi non ammessi, usa underscore o hyphen (${v})`,
      );
    }
  }

  if (params.medium && !ALLOWED_MEDIUMS.has(params.medium.toLowerCase())) {
    warnings.push(
      `utm_medium "${params.medium}" non standard. Usa: ${[...ALLOWED_MEDIUMS].slice(0, 6).join(", ")}…`,
    );
  }

  if (!params.source) warnings.push("utm_source obbligatorio");
  if (!params.medium) warnings.push("utm_medium obbligatorio");
  if (!params.campaign) warnings.push("utm_campaign obbligatorio");

  return { valid: warnings.length === 0, warnings };
}

export function normalizeUtm(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_-]/g, "");
}
