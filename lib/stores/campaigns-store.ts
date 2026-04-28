"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { NOW_ANCHOR } from "@/lib/mocks/now-anchor";

export type CampaignPlatform =
  | "google-ads"
  | "meta-ads"
  | "linkedin-ads"
  | "tiktok-ads"
  | "microsoft-ads";

export type CampaignStatus = "draft" | "active" | "paused" | "ended";

export type CampaignObjective =
  | "awareness"
  | "traffic"
  | "leads"
  | "sales"
  | "brand";

export type BidStrategy =
  | "manual_cpc"
  | "max_clicks"
  | "max_conversions"
  | "target_cpa"
  | "target_roas"
  | "max_conversion_value";

export type AdVariant = {
  id: string;
  /** Headline 1 (≤30 char Google Ads RSA) */
  headline: string;
  /** Description 1 (≤90 char) */
  description: string;
  /** Performance hint — variant winner status */
  status: "active" | "paused" | "winner" | "loser";
  /** Mock conversion rate in % */
  conversionRate: number;
};

export type Campaign = {
  id: string;
  projectId: string;
  name: string;
  platform: CampaignPlatform;
  objective: CampaignObjective;
  status: CampaignStatus;
  /** CHF daily budget */
  dailyBudget: number;
  /** CHF total spent (mock for now) */
  totalSpent: number;
  startDate: string;
  endDate?: string;
  landingUrl: string;
  audienceNotes?: string;
  /** Bid strategy (Google Ads native) */
  bidStrategy: BidStrategy;
  /** Target CPA / ROAS (depending on strategy) */
  bidTarget?: number;
  /** Ad copy A/B variants */
  variants: AdVariant[];
  /** Audience exported as Custom Audience / lookalike (D.32) */
  audienceExport?: {
    sourceType: "form_submissions" | "high_intent_visitors" | "past_buyers";
    audienceSize: number;
    lookalikePct?: number;
  };
  /** Pacing — auto-pause threshold % over budget (D.35) */
  pacingThresholdPct?: number;
  /** Mock landing page quality score 0-100 (D.34) */
  landingScore?: number;
  createdAt: string;
};

const SEED: Campaign[] = [
  {
    id: "camp-1",
    projectId: "verumflow-ch",
    name: "Brand search — VerumFlow",
    platform: "google-ads",
    objective: "leads",
    status: "active",
    dailyBudget: 35,
    totalSpent: 412.5,
    startDate: new Date(NOW_ANCHOR - 30 * 86400000).toISOString().slice(0, 10),
    landingUrl: "https://verumflow.ch/contatti",
    audienceNotes: "Search brand keyword + competitor protect",
    bidStrategy: "max_conversions",
    bidTarget: 25,
    variants: [
      {
        id: "v-1a",
        headline: "REZEN Sites — SEO Studio Svizzero",
        description: "Pacchetti chiavi-in-mano da 2.500 CHF. Audit gratuito. Prenota oggi.",
        status: "winner",
        conversionRate: 4.8,
      },
      {
        id: "v-1b",
        headline: "Sito + SEO in 2 settimane",
        description: "Tecnologia AI-first. Risultati misurabili. Verifica online.",
        status: "active",
        conversionRate: 3.2,
      },
    ],
    createdAt: new Date(NOW_ANCHOR - 30 * 86400000).toISOString(),
  },
  {
    id: "camp-2",
    projectId: "verumflow-ch",
    name: "Lead gen — Audit SEO",
    platform: "meta-ads",
    objective: "leads",
    status: "active",
    dailyBudget: 50,
    totalSpent: 612.0,
    startDate: new Date(NOW_ANCHOR - 21 * 86400000).toISOString().slice(0, 10),
    landingUrl: "https://verumflow.ch/audit",
    audienceNotes: "CMO/CEO 30-55 IT/CH, lookalike clienti past",
    bidStrategy: "target_cpa",
    bidTarget: 35,
    variants: [],
    createdAt: new Date(NOW_ANCHOR - 21 * 86400000).toISOString(),
  },
  {
    id: "camp-3",
    projectId: "verumflow-ch",
    name: "Retargeting blog readers",
    platform: "google-ads",
    objective: "traffic",
    status: "paused",
    dailyBudget: 12,
    totalSpent: 87.4,
    startDate: new Date(NOW_ANCHOR - 14 * 86400000).toISOString().slice(0, 10),
    landingUrl: "https://verumflow.ch/blog",
    audienceNotes: "Display remarketing list 30d",
    bidStrategy: "max_clicks",
    variants: [],
    createdAt: new Date(NOW_ANCHOR - 14 * 86400000).toISOString(),
  },
];

type State = {
  campaigns: Campaign[];
};

type Actions = {
  list: (projectId: string) => Campaign[];
  add: (c: Omit<Campaign, "id" | "createdAt" | "totalSpent">) => string;
  update: (id: string, patch: Partial<Campaign>) => void;
  remove: (id: string) => void;
  resetSeed: () => void;
};

export const useCampaignsStore = create<State & Actions>()(
  persist(
    (set, get) => ({
      campaigns: SEED,
      list: (projectId) =>
        get().campaigns.filter((c) => c.projectId === projectId),
      add: (c) => {
        const id = `camp-${Date.now()}`;
        set((s) => ({
          campaigns: [
            ...s.campaigns,
            {
              ...c,
              id,
              totalSpent: 0,
              createdAt: new Date().toISOString(),
            },
          ],
        }));
        return id;
      },
      update: (id, patch) =>
        set((s) => ({
          campaigns: s.campaigns.map((c) =>
            c.id === id ? { ...c, ...patch } : c,
          ),
        })),
      remove: (id) =>
        set((s) => ({ campaigns: s.campaigns.filter((c) => c.id !== id) })),
      resetSeed: () => set({ campaigns: SEED }),
    }),
    {
      name: "rezen-campaigns-store",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);

export const PLATFORM_META: Record<
  CampaignPlatform,
  { label: string; color: string }
> = {
  "google-ads": { label: "Google Ads", color: "#4285F4" },
  "meta-ads": { label: "Meta Ads", color: "#1877F2" },
  "linkedin-ads": { label: "LinkedIn", color: "#0A66C2" },
  "tiktok-ads": { label: "TikTok", color: "#000000" },
  "microsoft-ads": { label: "Microsoft Ads", color: "#00A4EF" },
};

export const BID_STRATEGY_META: Record<
  BidStrategy,
  { label: string; needsTarget: boolean; targetLabel?: string }
> = {
  manual_cpc: { label: "Manual CPC", needsTarget: false },
  max_clicks: { label: "Maximize Clicks", needsTarget: false },
  max_conversions: {
    label: "Maximize Conversions",
    needsTarget: true,
    targetLabel: "Target CPA (CHF, opz)",
  },
  target_cpa: {
    label: "Target CPA",
    needsTarget: true,
    targetLabel: "CPA target (CHF)",
  },
  target_roas: {
    label: "Target ROAS",
    needsTarget: true,
    targetLabel: "ROAS target (% es. 400)",
  },
  max_conversion_value: {
    label: "Maximize Conversion Value",
    needsTarget: false,
  },
};
