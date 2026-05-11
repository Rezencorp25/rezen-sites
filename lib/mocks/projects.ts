import type { Project } from "@/types";

export const MOCK_PROJECTS: Project[] = [
  {
    id: "verumflow-ch",
    name: "VerumFlow.ch",
    domain: "verumflow.ch",
    stagingDomain: "verumflow-staging.rezen.sites",
    baseDomain: "vflow-a12.rezen.sites",
    thumbnail: "/mock-images/thumb-verumflow.svg",
    status: "production",
    createdAt: new Date("2026-05-10T14:00:00Z"),
    updatedAt: new Date("2026-05-10T14:00:00Z"),
    kpis: {
      pagesPublished: 1,
      organicTraffic30d: 0,
      adsenseRevenue30d: 0,
      seoScore: 0,
    },
    integrations: {},
  },
  {
    id: "impresa-edile-carfi",
    name: "Impresa Edile Carfi",
    domain: "impresaedilecarfi.ch",
    stagingDomain: "carfi-staging.rezen.sites",
    baseDomain: "carfi-b34.rezen.sites",
    thumbnail: "/mock-images/thumb-carfi.svg",
    status: "production",
    createdAt: new Date("2026-01-08T09:00:00Z"),
    updatedAt: new Date("2026-04-15T11:20:00Z"),
    kpis: {
      pagesPublished: 5,
      organicTraffic30d: 1204,
      adsenseRevenue30d: 0,
      seoScore: 71,
    },
    integrations: {
      googleAnalytics: {
        measurementId: "G-CARFI0000",
        verified: true,
      },
      metaPixel: { pixelId: "123456789012345", verified: false },
    },
  },
  {
    id: "consulting-bio",
    name: "Consulting Bio",
    domain: "consulting-bio.eu",
    stagingDomain: "bio-staging.rezen.sites",
    baseDomain: "bio-c78.rezen.sites",
    thumbnail: "/mock-images/thumb-bio.svg",
    status: "draft",
    createdAt: new Date("2026-04-10T15:00:00Z"),
    updatedAt: new Date("2026-04-19T16:45:00Z"),
    kpis: {
      pagesPublished: 0,
      organicTraffic30d: 0,
      adsenseRevenue30d: 0,
      seoScore: 42,
    },
    integrations: {},
  },
  {
    // Pure-HTML test project for the inline editor. No SPA, no Babel, no
    // React in the iframe — just static HTML/CSS so patch-based saves
    // actually mutate the file. Used to develop and demo the Webflow-style
    // edit experience (text/image/color/font) without the SPA limitation.
    id: "static-test",
    name: "Static Test Site",
    domain: "static-test.rezen.sites",
    stagingDomain: "static-test-staging.rezen.sites",
    baseDomain: "static-test-z01.rezen.sites",
    thumbnail: "/mock-images/thumb-bio.svg",
    status: "draft",
    createdAt: new Date("2026-05-11T10:00:00Z"),
    updatedAt: new Date("2026-05-11T10:00:00Z"),
    kpis: {
      pagesPublished: 1,
      organicTraffic30d: 0,
      adsenseRevenue30d: 0,
      seoScore: 0,
    },
    integrations: {},
  },
];
