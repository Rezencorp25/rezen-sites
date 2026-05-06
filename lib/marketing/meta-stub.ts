import {
  type MetaAdSet,
  type MetaCampaign,
  type MetaCampaignObjective,
  type MetaCampaignStatus,
  type MetaCreative,
  type MetaCreativeFormat,
  type MetaSnapshot,
  type MetaTrendPoint,
} from "./meta-types";

/**
 * S9 — Stub deterministic generator per Meta Ads. Hash da projectId+domain+seedSalt
 * per coerenza tra reload. Cifre realistiche per PMI italiana (€5-50/giorno spend
 * tipico, CTR 1-3%, CPC 0.30-2.00).
 */

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h << 5) - h + s.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

function pseudoRand(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) | 0;
    return ((s >>> 0) % 100000) / 100000;
  };
}

const CAMPAIGN_TEMPLATES: {
  base: string;
  objective: MetaCampaignObjective;
  status: MetaCampaignStatus;
}[] = [
  { base: "Lead Gen — Modulo Contatti", objective: "OUTCOME_LEADS", status: "ACTIVE" },
  { base: "Awareness Q2", objective: "OUTCOME_AWARENESS", status: "ACTIVE" },
  { base: "Traffic Blog Hub", objective: "OUTCOME_TRAFFIC", status: "ACTIVE" },
  { base: "Retargeting Visitatori 30gg", objective: "OUTCOME_LEADS", status: "ACTIVE" },
  { base: "Conversion Servizi Premium", objective: "OUTCOME_SALES", status: "PAUSED" },
  { base: "Engagement Post Q1", objective: "OUTCOME_ENGAGEMENT", status: "COMPLETED" },
];

const ADSET_NAMES = [
  "Lookalike 1% IT",
  "Custom Audience Email",
  "Interesse Settore",
  "Età 25-44 Geo Lombardia",
  "Mobile Only Stories",
  "Desktop Feed",
];

const CREATIVE_NAMES = [
  "Hero Video 15s",
  "Carosello 3 servizi",
  "Image Quote Cliente",
  "Static CTA Brand",
  "Reel Behind The Scenes",
  "Motion Logo Animation",
];

const FORMATS: MetaCreativeFormat[] = ["image", "video", "carousel", "collection"];

function genCreative(idx: number, rand: () => number): MetaCreative {
  const fmt = FORMATS[idx % FORMATS.length];
  return {
    id: `cr_${idx}_${Math.floor(rand() * 9999)}`,
    name: CREATIVE_NAMES[idx % CREATIVE_NAMES.length] ?? `Creative ${idx + 1}`,
    format: fmt,
    thumbnailUrl: null,
    ctr: round(0.5 + rand() * 3.5, 2),
    spend30d: round(100 + rand() * 600, 2),
  };
}

function genAdSet(idx: number, rand: () => number, parentLeads: number): MetaAdSet {
  const creativesCount = 1 + Math.floor(rand() * 3);
  const creatives: MetaCreative[] = [];
  for (let i = 0; i < creativesCount; i++) {
    creatives.push(genCreative(idx * 10 + i, rand));
  }
  const spend = creatives.reduce((s, c) => s + c.spend30d, 0);
  return {
    id: `as_${idx}_${Math.floor(rand() * 9999)}`,
    name: ADSET_NAMES[idx % ADSET_NAMES.length] ?? `AdSet ${idx + 1}`,
    dailyBudget: round(15 + rand() * 50, 2),
    spend30d: round(spend, 2),
    frequency: round(1.2 + rand() * 3, 2),
    leads30d: Math.floor(parentLeads * (0.2 + rand() * 0.6)),
    creatives,
  };
}

function round(n: number, decimals = 2): number {
  const m = Math.pow(10, decimals);
  return Math.round(n * m) / m;
}

function genCampaign(
  idx: number,
  template: (typeof CAMPAIGN_TEMPLATES)[number],
  rand: () => number,
  domain: string,
): MetaCampaign {
  const adSetsCount = 1 + Math.floor(rand() * 2);

  // Spend tier per status
  const baseSpend =
    template.status === "ACTIVE"
      ? 800 + rand() * 2200
      : template.status === "PAUSED"
        ? 200 + rand() * 600
        : 1500 + rand() * 1500;

  const ctr = round(0.8 + rand() * 2.5, 2);
  const impressions = Math.floor(baseSpend / (0.5 + rand() * 1.5) * 1000);
  const clicks = Math.floor((impressions * ctr) / 100);
  const cpc = round(baseSpend / Math.max(clicks, 1), 2);

  // Conversion logic per objective
  const isLeadObjective =
    template.objective === "OUTCOME_LEADS" ||
    template.objective === "OUTCOME_SALES";
  const conversionRate = isLeadObjective ? 0.02 + rand() * 0.06 : 0;
  const conversions = Math.floor(clicks * conversionRate);
  const cpl = isLeadObjective && conversions > 0 ? round(baseSpend / conversions, 2) : 0;

  // ROAS solo per OUTCOME_SALES (spend → revenue 2-5x)
  const roas =
    template.objective === "OUTCOME_SALES" ? round(1.5 + rand() * 3.5, 2) : 0;

  const adSets: MetaAdSet[] = [];
  for (let i = 0; i < adSetsCount; i++) {
    adSets.push(genAdSet(idx * 10 + i, rand, conversions));
  }

  // Date: la campagna è iniziata 30-180gg fa, attive non hanno endedAt
  const startDaysAgo = 30 + Math.floor(rand() * 150);
  const startDate = new Date(Date.now() - startDaysAgo * 86400_000);
  const endedAt =
    template.status === "COMPLETED"
      ? new Date(Date.now() - Math.floor(rand() * 14) * 86400_000)
          .toISOString()
          .slice(0, 10)
      : null;

  return {
    id: `cam_${idx}_${Math.floor(rand() * 9999)}`,
    name: `${template.base} · ${domain.split(".")[0]}`,
    objective: template.objective,
    status: template.status,
    startedAt: startDate.toISOString().slice(0, 10),
    endedAt,
    lifetimeBudget: template.status === "COMPLETED" ? round(baseSpend * 1.2, 2) : null,
    spend30d: round(baseSpend, 2),
    impressions30d: impressions,
    clicks30d: clicks,
    conversions30d: conversions,
    roas30d: roas,
    cpc30d: cpc,
    ctr30d: ctr,
    cpl30d: cpl,
    adSets,
  };
}

export function generateMetaStubSnapshot(input: {
  projectId: string;
  domain: string;
  seedSalt?: string;
}): MetaSnapshot {
  const seed = hash(`${input.projectId}|${input.domain}|${input.seedSalt ?? "v1"}`);
  const rand = pseudoRand(seed);

  // Pick 4-6 campaign templates (sempre includendo le prime 4 attive)
  const templatesCount = 4 + Math.floor(rand() * 3);
  const templates = CAMPAIGN_TEMPLATES.slice(0, templatesCount);

  const campaigns: MetaCampaign[] = templates.map((t, i) =>
    genCampaign(i, t, rand, input.domain),
  );

  // Aggregati cross-campagna
  const spend = campaigns.reduce((s, c) => s + c.spend30d, 0);
  const impressions = campaigns.reduce((s, c) => s + c.impressions30d, 0);
  const clicks = campaigns.reduce((s, c) => s + c.clicks30d, 0);
  const conversions = campaigns.reduce((s, c) => s + c.conversions30d, 0);
  const leadsCampaigns = campaigns.filter((c) => c.cpl30d > 0);
  const leads = leadsCampaigns.reduce((s, c) => s + c.conversions30d, 0);

  const totals = {
    spend30d: round(spend, 2),
    impressions30d: impressions,
    clicks30d: clicks,
    conversions30d: conversions,
    leads30d: leads,
    ctr30d: clicks > 0 ? round((clicks / impressions) * 100, 2) : 0,
    cpc30d: clicks > 0 ? round(spend / clicks, 2) : 0,
    cpl30d:
      leads > 0
        ? round(
            leadsCampaigns.reduce((s, c) => s + c.spend30d, 0) / leads,
            2,
          )
        : 0,
    roas30d: round(
      campaigns.reduce((s, c) => s + c.roas30d * c.spend30d, 0) /
        Math.max(spend, 1),
      2,
    ),
    activeCampaigns: campaigns.filter((c) => c.status === "ACTIVE").length,
  };

  return {
    id: `meta_${input.projectId}_${seed.toString(36).slice(0, 6)}`,
    projectId: input.projectId,
    domain: input.domain,
    createdAt: new Date(),
    source: "stub",
    metaBusinessAccountId: null,
    currency: "EUR",
    totals,
    campaigns,
  };
}

/**
 * Genera trend 30 giorni con seasonal pattern + noise. Spend stabile vs giorni
 * settimana, lieve flessione weekend, leads correlati a spend.
 */
export function generateMetaStubTrend(input: {
  projectId: string;
  domain: string;
}): MetaTrendPoint[] {
  const seed = hash(`${input.projectId}|${input.domain}|trend`);
  const rand = pseudoRand(seed);
  const out: MetaTrendPoint[] = [];

  const baseSpend = 80 + rand() * 120; // €/day baseline
  const baseCtr = 1.5 + rand() * 1.5;
  const baseCpc = 0.6 + rand() * 0.8;

  for (let i = 29; i >= 0; i--) {
    const date = new Date(Date.now() - i * 86400_000);
    const dow = date.getDay();
    const isWeekend = dow === 0 || dow === 6;

    const spendNoise = 0.85 + rand() * 0.3;
    const spend = round(baseSpend * (isWeekend ? 0.7 : 1) * spendNoise, 2);
    const impressions = Math.floor((spend / baseCpc) * 100);
    const clicks = Math.floor((impressions * baseCtr) / 100);
    const leads = Math.floor(clicks * (0.025 + rand() * 0.04));
    const cpl = leads > 0 ? round(spend / leads, 2) : 0;

    out.push({
      date: date.toISOString().slice(0, 10),
      spend,
      impressions,
      clicks,
      leads,
      cpl,
    });
  }

  return out;
}

export function simulatedMetaFetchDelayMs(): number {
  return 800 + Math.floor(Math.random() * 1200);
}
