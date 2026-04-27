import { generatePuckPage, type PageBrief } from "@/lib/ai/agents/page-designer";
import { fillSEO } from "@/lib/ai/agents/seo-agent";
import type { Page, PageSEO, PuckData } from "@/types";

/**
 * Build a complete Page entity (puckData + seo) from an imported or generated brief.
 * Used by /api/import/* and /api/ai/generate-page flows.
 */
export async function orchestratePage(args: {
  projectId: string;
  title: string;
  slug: string;
  brief: PageBrief;
  puckDataOverride?: PuckData;
}): Promise<{ page: Page; modes: { design: "ai" | "stub"; seo: "ai" | "stub" } }> {
  const { projectId, title, slug, brief, puckDataOverride } = args;

  const design = puckDataOverride
    ? { data: puckDataOverride, mode: "ai" as const }
    : await generatePuckPage(brief);

  const seoFill = await fillSEO({
    page: design.data,
    pageTitle: title,
  });

  const seo: PageSEO = {
    metaTitle: seoFill.seo.metaTitle,
    metaDescription: seoFill.seo.metaDescription,
    canonicalUrl: `https://example.com/${slug}`,
    indexable: true,
    internalSearch: true,
    og: {
      title: seoFill.seo.og.title,
      description: seoFill.seo.og.description,
    },
  };

  const id = `page-${Date.now()}`;
  const now = new Date();
  const page: Page = {
    id,
    projectId,
    title,
    slug,
    status: "draft",
    puckData: design.data,
    seo,
    analytics: {
      pageviews7d: 0,
      pageviews30d: 0,
      bounceRate: 0,
      avgPosition: 0,
      topKeyword: "",
      seoScore: 60,
    },
    createdAt: now,
    updatedAt: now,
  };

  return { page, modes: { design: design.mode, seo: seoFill.mode } };
}
