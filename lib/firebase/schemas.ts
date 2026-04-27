import { z } from "zod";

/**
 * Zod schemas mirroring types/index.ts.
 * Used for: API route validation + AI agent output parsing.
 */

export const projectSchema = z.object({
  id: z.string(),
  name: z.string(),
  domain: z.string(),
  stagingDomain: z.string(),
  baseDomain: z.string(),
  thumbnail: z.string(),
  status: z.enum(["draft", "staging", "production"]),
  createdAt: z.date(),
  updatedAt: z.date(),
  kpis: z.object({
    pagesPublished: z.number(),
    organicTraffic30d: z.number(),
    adsenseRevenue30d: z.number(),
    seoScore: z.number().min(0).max(100),
  }),
  integrations: z.object({
    googleAnalytics: z
      .object({ measurementId: z.string(), verified: z.boolean() })
      .optional(),
    metaPixel: z
      .object({ pixelId: z.string(), verified: z.boolean() })
      .optional(),
    googleAdsense: z
      .object({ publisherId: z.string(), verified: z.boolean() })
      .optional(),
    googleAds: z
      .object({
        conversionId: z.string(),
        label: z.string(),
        verified: z.boolean(),
      })
      .optional(),
  }),
});

export const pageSeoSchema = z.object({
  metaTitle: z.string(),
  metaDescription: z.string(),
  canonicalUrl: z.string(),
  indexable: z.boolean(),
  internalSearch: z.boolean(),
  og: z.object({
    title: z.string().optional(),
    description: z.string().optional(),
    image: z.string().optional(),
  }),
  schema: z.record(z.string(), z.unknown()).optional(),
});

export const pageAnalyticsSchema = z.object({
  pageviews7d: z.number(),
  pageviews30d: z.number(),
  bounceRate: z.number(),
  avgPosition: z.number(),
  topKeyword: z.string(),
  seoScore: z.number().min(0).max(100),
});

export const pageSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  title: z.string(),
  slug: z.string(),
  status: z.enum(["draft", "published"]),
  puckData: z.any(),
  seo: pageSeoSchema,
  analytics: pageAnalyticsSchema,
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const cmsFieldSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum([
    "text",
    "richtext",
    "image",
    "date",
    "number",
    "boolean",
    "reference",
  ]),
  required: z.boolean(),
  referenceCollectionId: z.string().optional(),
});

export const cmsCollectionSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  name: z.string(),
  slug: z.string(),
  fields: z.array(cmsFieldSchema),
  createdAt: z.date(),
});

export const alertSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  severity: z.enum(["critical", "warning", "info", "ok"]),
  title: z.string(),
  description: z.string(),
  page: z.string().optional(),
  createdAt: z.date(),
  acknowledged: z.boolean(),
});

export const redirectSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  oldPath: z.string(),
  newPath: z.string(),
  type: z.union([z.literal(301), z.literal(302)]),
  active: z.boolean(),
  createdAt: z.date(),
});

export const formSubmissionSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  formName: z.string(),
  fields: z.record(z.string(), z.string()),
  page: z.string(),
  utm: z
    .object({
      source: z.string().optional(),
      medium: z.string().optional(),
      campaign: z.string().optional(),
    })
    .optional(),
  gclid: z.string().optional(),
  createdAt: z.date(),
});

/** AI agent output schemas */
export const aiEditSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("insert"),
    afterId: z.string().nullable(),
    components: z.array(z.any()),
  }),
  z.object({
    type: z.literal("replace"),
    targetId: z.string(),
    component: z.any(),
  }),
  z.object({
    type: z.literal("modify"),
    targetId: z.string(),
    newProps: z.record(z.string(), z.unknown()),
  }),
  z.object({ type: z.literal("delete"), targetId: z.string() }),
  z.object({ type: z.literal("full_replace"), root: z.any() }),
]);
