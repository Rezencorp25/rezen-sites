/**
 * S10 — CPL & Conversion Rate calculator.
 *
 * Joina lead pipeline (S3) + Meta Ads spend (S9) per derivare:
 *  - funnel impressions → clicks → leads → qualified → won
 *  - per-source attribution: leads, spend, CPL, CPA, lifetimeValue, ROAS
 *
 * Channel attribution stub-mode: i Lead non hanno (ancora) un campo
 * marketingChannel, quindi derivo deterministicamente via tag `channel:X`
 * oppure hash(lead.id) → distribuzione realistica PMI italiana:
 *  organic 35% · meta 30% · google 15% · direct 10% · referral 10%
 *
 * Live mode (S5.3-bis): popolare lead.marketingChannel da UTM params
 * (`utm_source` → channel) al form submission e leggere quello senza hash.
 */

import type { Lead, LeadStatus } from "@/lib/leads/types";
import type { MetaSnapshot } from "@/lib/marketing/meta-types";
import { cplBand, type CplBand } from "@/lib/marketing/meta-types";

export type MarketingChannel =
  | "organic"
  | "meta"
  | "google"
  | "direct"
  | "referral";

export const MARKETING_CHANNEL_LABEL: Record<MarketingChannel, string> = {
  organic: "Organic / SEO",
  meta: "Meta Ads",
  google: "Google Ads",
  direct: "Direct",
  referral: "Referral",
};

export const MARKETING_CHANNEL_ORDER: MarketingChannel[] = [
  "organic",
  "meta",
  "google",
  "direct",
  "referral",
];

export type FunnelStage = {
  key: "impressions" | "clicks" | "leads" | "qualified" | "won";
  label: string;
  value: number;
  /** Drop-off % vs stage precedente (0 per primo stage). */
  dropoffPct: number;
  /** Conversion rate % vs primo stage (impressions). */
  conversionPct: number;
};

export type SourceAttribution = {
  channel: MarketingChannel;
  label: string;
  /** Lead totali attribuiti al channel. */
  leads: number;
  /** Lead in stato contacted/qualified/won. */
  qualified: number;
  /** Lead in stato won. */
  won: number;
  /** Lead in stato lost. */
  lost: number;
  /** Spend totale attribuito (€). 0 per organic/direct/referral. */
  spend: number;
  /** Currency code (EUR/USD/CHF). */
  currency: string;
  /** Cost Per Lead = spend / leads (Infinity se leads = 0 e spend > 0). */
  cpl: number;
  /** Cost Per Acquisition = spend / won. */
  cpa: number;
  /** Lifetime value totale (sum lead.value per status=won). */
  lifetimeValue: number;
  /** ROAS = lifetimeValue / spend. ∞ se spend=0 e lifetime>0. */
  roas: number;
  /** Qualified rate % = qualified / leads. */
  qualifiedRate: number;
  /** Win rate % = won / leads. */
  winRate: number;
  cplBand: CplBand;
};

export type CplSummary = {
  totals: {
    leads: number;
    qualified: number;
    won: number;
    spend: number;
    lifetimeValue: number;
    cpl: number;
    cpa: number;
    roas: number;
    winRate: number;
  };
  funnel: FunnelStage[];
  bySource: SourceAttribution[];
  /** Currency derivata da Meta snapshot. */
  currency: string;
  /** Channel con ROAS più alto (escluso ∞ da spend=0). */
  topRoasChannel: SourceAttribution | null;
  /** Warning se Meta CPL > soglia (default 30 = band ≥ average alto). */
  metaCplWarning: boolean;
};

const DEFAULT_CPL_TARGET = 30;
const QUALIFIED_STATUSES: LeadStatus[] = ["contacted", "qualified", "won"];

/**
 * Hash deterministic 32-bit (FNV-1a). Stesso pattern di stub-mode S5/S6/S9.
 */
function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

/**
 * Distribuzione channel da hash (PMI italiana):
 *  organic 35% · meta 30% · google 15% · direct 10% · referral 10%
 */
function channelFromHash(leadId: string): MarketingChannel {
  const bucket = hash(leadId) % 100;
  if (bucket < 35) return "organic";
  if (bucket < 65) return "meta";
  if (bucket < 80) return "google";
  if (bucket < 90) return "direct";
  return "referral";
}

/**
 * Risolve channel di un lead: prima cerca tag `channel:X`, poi fallback hash.
 */
export function resolveLeadChannel(lead: Lead): MarketingChannel {
  for (const tag of lead.tags) {
    if (tag.startsWith("channel:")) {
      const c = tag.slice(8) as MarketingChannel;
      if (MARKETING_CHANNEL_ORDER.includes(c)) return c;
    }
  }
  return channelFromHash(lead.id);
}

/**
 * Stub-mode: Google Ads spend = 60% del Meta spend × scale (PMI italiana
 * tipicamente spende meno su Google Ads search vs Meta paid social). Ritorna 0
 * se non c'è snapshot Meta (zero anchor).
 */
function stubGoogleSpend(metaSpend: number): number {
  return Math.round(metaSpend * 0.6);
}

function safeDiv(num: number, den: number): number {
  if (den === 0) return num === 0 ? 0 : Number.POSITIVE_INFINITY;
  return num / den;
}

function pct(part: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((part / total) * 1000) / 10;
}

/**
 * Calcola riepilogo CPL+ROAS per un progetto data leads + Meta snapshot.
 *
 * Edge cases:
 *  - leads = [] → returna struttura zero (non null)
 *  - metaSnapshot = undefined → spend Meta=0, channel meta resta visibile
 *    con CPL ∞ se ha lead (warning utente)
 *  - lead.value = null → escluso da lifetimeValue (no NaN)
 *  - lead.deleted = true → escluso (GDPR soft delete)
 */
export function computeCplSummary(input: {
  leads: Lead[];
  metaSnapshot?: MetaSnapshot;
  cplTarget?: number;
}): CplSummary {
  const { leads, metaSnapshot } = input;
  const cplTarget = input.cplTarget ?? DEFAULT_CPL_TARGET;
  const currency = metaSnapshot?.currency ?? "EUR";

  const activeLeads = leads.filter((l) => !l.deleted);

  const metaSpend = metaSnapshot?.totals.spend30d ?? 0;
  const googleSpend = stubGoogleSpend(metaSpend);
  const spendByChannel: Record<MarketingChannel, number> = {
    organic: 0,
    meta: metaSpend,
    google: googleSpend,
    direct: 0,
    referral: 0,
  };

  const grouped: Record<MarketingChannel, Lead[]> = {
    organic: [],
    meta: [],
    google: [],
    direct: [],
    referral: [],
  };
  for (const lead of activeLeads) {
    const ch = resolveLeadChannel(lead);
    grouped[ch].push(lead);
  }

  const bySource: SourceAttribution[] = MARKETING_CHANNEL_ORDER.map((ch) => {
    const list = grouped[ch];
    const leadsCount = list.length;
    const qualified = list.filter((l) =>
      QUALIFIED_STATUSES.includes(l.status),
    ).length;
    const won = list.filter((l) => l.status === "won").length;
    const lost = list.filter((l) => l.status === "lost").length;
    const lifetimeValue = list
      .filter((l) => l.status === "won")
      .reduce((sum, l) => sum + (l.value ?? 0), 0);
    const spend = spendByChannel[ch];
    const cpl = safeDiv(spend, leadsCount);
    const cpa = safeDiv(spend, won);
    const roas = safeDiv(lifetimeValue, spend);

    return {
      channel: ch,
      label: MARKETING_CHANNEL_LABEL[ch],
      leads: leadsCount,
      qualified,
      won,
      lost,
      spend,
      currency,
      cpl,
      cpa,
      lifetimeValue,
      roas,
      qualifiedRate: pct(qualified, leadsCount),
      winRate: pct(won, leadsCount),
      cplBand: cplBand(Number.isFinite(cpl) ? cpl : 0),
    };
  });

  const totalLeads = activeLeads.length;
  const totalQualified = activeLeads.filter((l) =>
    QUALIFIED_STATUSES.includes(l.status),
  ).length;
  const totalWon = activeLeads.filter((l) => l.status === "won").length;
  const totalSpend = metaSpend + googleSpend;
  const totalLtv = activeLeads
    .filter((l) => l.status === "won")
    .reduce((sum, l) => sum + (l.value ?? 0), 0);

  const totalCpl = safeDiv(totalSpend, totalLeads);
  const totalCpa = safeDiv(totalSpend, totalWon);
  const totalRoas = safeDiv(totalLtv, totalSpend);

  const impressions = metaSnapshot?.totals.impressions30d ?? 0;
  const clicks = metaSnapshot?.totals.clicks30d ?? 0;

  const funnel: FunnelStage[] = [
    {
      key: "impressions",
      label: "Impressions",
      value: impressions,
      dropoffPct: 0,
      conversionPct: 100,
    },
    {
      key: "clicks",
      label: "Clicks",
      value: clicks,
      dropoffPct: impressions > 0 ? Math.round((1 - clicks / impressions) * 1000) / 10 : 0,
      conversionPct: pct(clicks, impressions),
    },
    {
      key: "leads",
      label: "Leads",
      value: totalLeads,
      dropoffPct:
        clicks > 0 ? Math.round((1 - totalLeads / clicks) * 1000) / 10 : 0,
      conversionPct: pct(totalLeads, impressions),
    },
    {
      key: "qualified",
      label: "Qualified",
      value: totalQualified,
      dropoffPct:
        totalLeads > 0
          ? Math.round((1 - totalQualified / totalLeads) * 1000) / 10
          : 0,
      conversionPct: pct(totalQualified, impressions),
    },
    {
      key: "won",
      label: "Won",
      value: totalWon,
      dropoffPct:
        totalQualified > 0
          ? Math.round((1 - totalWon / totalQualified) * 1000) / 10
          : 0,
      conversionPct: pct(totalWon, impressions),
    },
  ];

  const topRoasChannel =
    bySource
      .filter((s) => s.spend > 0 && Number.isFinite(s.roas))
      .sort((a, b) => b.roas - a.roas)[0] ?? null;

  const metaSource = bySource.find((s) => s.channel === "meta");
  const metaCplWarning =
    !!metaSource &&
    metaSource.spend > 0 &&
    Number.isFinite(metaSource.cpl) &&
    metaSource.cpl > cplTarget;

  return {
    totals: {
      leads: totalLeads,
      qualified: totalQualified,
      won: totalWon,
      spend: totalSpend,
      lifetimeValue: totalLtv,
      cpl: totalCpl,
      cpa: totalCpa,
      roas: totalRoas,
      winRate: pct(totalWon, totalLeads),
    },
    funnel,
    bySource,
    currency,
    topRoasChannel,
    metaCplWarning,
  };
}

/**
 * Format CPL/CPA/spend con currency (gestisce Infinity → "—").
 */
export function fmtCplMoney(n: number, currency: string): string {
  if (!Number.isFinite(n) || n <= 0) return "—";
  return `${currency} ${n.toLocaleString("it-IT", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function fmtRoas(n: number): string {
  if (!Number.isFinite(n)) return "∞";
  if (n <= 0) return "—";
  return `${n.toFixed(2)}×`;
}
