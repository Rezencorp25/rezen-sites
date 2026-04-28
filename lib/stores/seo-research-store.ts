"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { NOW_ANCHOR } from "@/lib/mocks/now-anchor";

export type Backlink = {
  id: string;
  projectId: string;
  /** Source domain (e.g. forbes.com) */
  sourceDomain: string;
  /** Source URL */
  sourceUrl: string;
  /** Target page on our site */
  targetUrl: string;
  /** Anchor text used */
  anchorText: string;
  /** Domain Authority (estimated) 0-100 */
  domainAuthority: number;
  /** dofollow / nofollow / sponsored / ugc */
  rel: "dofollow" | "nofollow" | "sponsored" | "ugc";
  /** Detected vs disavowed status */
  status: "active" | "disavowed" | "lost";
  firstSeenAt: string;
};

export type Competitor = {
  id: string;
  projectId: string;
  domain: string;
  /** Mock domain authority */
  domainAuthority: number;
  /** Mock organic traffic estimate */
  estTraffic: number;
  /** Top keywords overlap with us (number) */
  keywordOverlap: number;
  /** Mock total backlinks count */
  backlinks: number;
  notes: string;
};

const SEED_BACKLINKS: Backlink[] = [
  {
    id: "bl-1",
    projectId: "verumflow-ch",
    sourceDomain: "swissmarketing.ch",
    sourceUrl: "https://swissmarketing.ch/agenzie-seo-2026",
    targetUrl: "https://verumflow.ch/",
    anchorText: "VerumFlow",
    domainAuthority: 54,
    rel: "dofollow",
    status: "active",
    firstSeenAt: new Date(NOW_ANCHOR - 80 * 86400000).toISOString(),
  },
  {
    id: "bl-2",
    projectId: "verumflow-ch",
    sourceDomain: "ticinonews.ch",
    sourceUrl: "https://ticinonews.ch/economia/startup-ai",
    targetUrl: "https://verumflow.ch/audit",
    anchorText: "audit SEO gratuito",
    domainAuthority: 67,
    rel: "dofollow",
    status: "active",
    firstSeenAt: new Date(NOW_ANCHOR - 45 * 86400000).toISOString(),
  },
  {
    id: "bl-3",
    projectId: "verumflow-ch",
    sourceDomain: "casinos-suspect.tk",
    sourceUrl: "https://casinos-suspect.tk/spam",
    targetUrl: "https://verumflow.ch/",
    anchorText: "click here",
    domainAuthority: 12,
    rel: "dofollow",
    status: "active",
    firstSeenAt: new Date(NOW_ANCHOR - 14 * 86400000).toISOString(),
  },
];

const SEED_COMPETITORS: Competitor[] = [
  {
    id: "cm-1",
    projectId: "verumflow-ch",
    domain: "competitor-a.ch",
    domainAuthority: 62,
    estTraffic: 24500,
    keywordOverlap: 47,
    backlinks: 1280,
    notes: "Stesso target SEO Svizzera. Forte su brand keyword.",
  },
  {
    id: "cm-2",
    projectId: "verumflow-ch",
    domain: "ad-agency-luganobiz.ch",
    domainAuthority: 41,
    estTraffic: 8200,
    keywordOverlap: 18,
    backlinks: 340,
    notes: "Local SEO Lugano molto forte.",
  },
];

export type CitationStatus = "verified" | "pending" | "missing" | "inconsistent";

export type Citation = {
  id: string;
  projectId: string;
  /** Directory name (e.g. "Apple Maps", "Bing Places") */
  directory: string;
  /** Canonical URL of the listing */
  listingUrl: string;
  status: CitationStatus;
  /** Notes about the inconsistency (if any) */
  notes: string;
  lastCheckedAt: string;
};

const SEED_CITATIONS: Citation[] = [
  {
    id: "ct-1",
    projectId: "verumflow-ch",
    directory: "Google Business Profile",
    listingUrl: "https://business.google.com/...",
    status: "verified",
    notes: "",
    lastCheckedAt: new Date(NOW_ANCHOR - 14 * 86400000).toISOString(),
  },
  {
    id: "ct-2",
    projectId: "verumflow-ch",
    directory: "Apple Business Connect",
    listingUrl: "https://businessconnect.apple.com/...",
    status: "verified",
    notes: "",
    lastCheckedAt: new Date(NOW_ANCHOR - 30 * 86400000).toISOString(),
  },
  {
    id: "ct-3",
    projectId: "verumflow-ch",
    directory: "Bing Places",
    listingUrl: "",
    status: "missing",
    notes: "Da creare",
    lastCheckedAt: new Date(NOW_ANCHOR - 30 * 86400000).toISOString(),
  },
  {
    id: "ct-4",
    projectId: "verumflow-ch",
    directory: "TripAdvisor",
    listingUrl: "https://tripadvisor.com/...",
    status: "inconsistent",
    notes: "Numero telefono diverso dal canonico",
    lastCheckedAt: new Date(NOW_ANCHOR - 7 * 86400000).toISOString(),
  },
];

type State = {
  backlinks: Backlink[];
  competitors: Competitor[];
  citations: Citation[];
};

type Actions = {
  addBacklink: (b: Omit<Backlink, "id" | "firstSeenAt">) => string;
  toggleDisavow: (id: string) => void;
  removeBacklink: (id: string) => void;
  addCompetitor: (c: Omit<Competitor, "id">) => string;
  removeCompetitor: (id: string) => void;
  addCitation: (c: Omit<Citation, "id" | "lastCheckedAt">) => string;
  updateCitation: (id: string, patch: Partial<Citation>) => void;
  removeCitation: (id: string) => void;
  resetSeed: () => void;
};

export const useSeoResearchStore = create<State & Actions>()(
  persist(
    (set) => ({
      backlinks: SEED_BACKLINKS,
      competitors: SEED_COMPETITORS,
      citations: SEED_CITATIONS,
      addBacklink: (b) => {
        const id = `bl-${Date.now()}`;
        set((s) => ({
          backlinks: [
            ...s.backlinks,
            { ...b, id, firstSeenAt: new Date().toISOString() },
          ],
        }));
        return id;
      },
      toggleDisavow: (id) =>
        set((s) => ({
          backlinks: s.backlinks.map((b) =>
            b.id === id
              ? {
                  ...b,
                  status: b.status === "disavowed" ? "active" : "disavowed",
                }
              : b,
          ),
        })),
      removeBacklink: (id) =>
        set((s) => ({ backlinks: s.backlinks.filter((b) => b.id !== id) })),
      addCompetitor: (c) => {
        const id = `cm-${Date.now()}`;
        set((s) => ({ competitors: [...s.competitors, { ...c, id }] }));
        return id;
      },
      removeCompetitor: (id) =>
        set((s) => ({
          competitors: s.competitors.filter((c) => c.id !== id),
        })),
      addCitation: (c) => {
        const id = `ct-${Date.now()}`;
        set((s) => ({
          citations: [
            ...s.citations,
            { ...c, id, lastCheckedAt: new Date().toISOString() },
          ],
        }));
        return id;
      },
      updateCitation: (id, patch) =>
        set((s) => ({
          citations: s.citations.map((c) =>
            c.id === id
              ? { ...c, ...patch, lastCheckedAt: new Date().toISOString() }
              : c,
          ),
        })),
      removeCitation: (id) =>
        set((s) => ({ citations: s.citations.filter((c) => c.id !== id) })),
      resetSeed: () =>
        set({
          backlinks: SEED_BACKLINKS,
          competitors: SEED_COMPETITORS,
          citations: SEED_CITATIONS,
        }),
    }),
    {
      name: "rezen-seo-research-store",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
