import type { Page, Project } from "@/types";

export type RobotsConfig = {
  /** Whether the entire site is allowed to be crawled */
  allowAll: boolean;
  /** Per-rule path Disallow entries (applied after allowAll) */
  disallow: string[];
  /** User-Agent specific overrides */
  userAgents?: Array<{ userAgent: string; disallow: string[] }>;
  /** Crawl-delay seconds (rare, mainly for Bing/Yandex) */
  crawlDelay?: number;
  /** Include sitemap directive (auto-set to baseUrl + /sitemap.xml) */
  includeSitemap: boolean;
};

export const DEFAULT_ROBOTS_CONFIG: RobotsConfig = {
  allowAll: true,
  disallow: ["/admin", "/api", "/_next"],
  includeSitemap: true,
};

/**
 * Generate a robots.txt body from configuration + project base URL.
 */
export function buildRobotsTxt(config: RobotsConfig, baseUrl: string): string {
  const lines: string[] = [];

  // Default User-agent rule
  lines.push("User-agent: *");
  if (!config.allowAll) {
    lines.push("Disallow: /");
  } else {
    for (const path of config.disallow) {
      lines.push(`Disallow: ${path}`);
    }
  }
  if (config.crawlDelay && config.crawlDelay > 0) {
    lines.push(`Crawl-delay: ${config.crawlDelay}`);
  }
  lines.push("");

  // Per-UA overrides
  for (const rule of config.userAgents ?? []) {
    lines.push(`User-agent: ${rule.userAgent}`);
    for (const path of rule.disallow) {
      lines.push(`Disallow: ${path}`);
    }
    lines.push("");
  }

  if (config.includeSitemap) {
    lines.push(`Sitemap: ${baseUrl.replace(/\/$/, "")}/sitemap.xml`);
  }

  return lines.join("\n");
}

export type SitemapEntry = {
  loc: string;
  lastmod?: string;
  changefreq?:
    | "always"
    | "hourly"
    | "daily"
    | "weekly"
    | "monthly"
    | "yearly"
    | "never";
  priority?: number;
};

export function buildSitemapXml(entries: SitemapEntry[]): string {
  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ];
  for (const e of entries) {
    xml.push("  <url>");
    xml.push(`    <loc>${escapeXml(e.loc)}</loc>`);
    if (e.lastmod) xml.push(`    <lastmod>${escapeXml(e.lastmod)}</lastmod>`);
    if (e.changefreq) xml.push(`    <changefreq>${e.changefreq}</changefreq>`);
    if (typeof e.priority === "number")
      xml.push(`    <priority>${e.priority.toFixed(1)}</priority>`);
    xml.push("  </url>");
  }
  xml.push("</urlset>");
  return xml.join("\n");
}

export function buildSitemapEntriesFromPages(
  project: Project,
  pages: Page[],
): SitemapEntry[] {
  const baseUrl = `https://${project.domain}`.replace(/\/$/, "");
  return pages
    .filter((p) => p.status === "published" && p.seo.indexable)
    .map((p) => {
      const slugClean = p.slug.replace(/^\/+/, "");
      const loc = slugClean ? `${baseUrl}/${slugClean}` : `${baseUrl}/`;
      return {
        loc,
        lastmod: p.updatedAt.toISOString().slice(0, 10),
        changefreq: "weekly" as const,
        priority: p.slug === "/" || p.slug === "" ? 1.0 : 0.7,
      };
    });
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
