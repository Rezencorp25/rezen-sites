/**
 * Schema.org JSON-LD generator.
 *
 * Production-grade. NOT mock — output is real schema markup that can be
 * embedded in HTML <head> and validates on Google Rich Results Test.
 */

import type { Project, Page } from "@/types";

export type SchemaType =
  | "Organization"
  | "WebSite"
  | "Article"
  | "NewsArticle"
  | "BlogPosting"
  | "FAQPage"
  | "BreadcrumbList"
  | "LocalBusiness"
  | "Product"
  | "Service";

export type FAQItem = { question: string; answer: string };

export type LocalBusinessInput = {
  name: string;
  url: string;
  telephone?: string;
  address?: {
    streetAddress: string;
    addressLocality: string;
    postalCode: string;
    addressCountry: string;
    addressRegion?: string;
  };
  geo?: { latitude: number; longitude: number };
  openingHours?: string[]; // e.g. ["Mo-Fr 09:00-18:00", "Sa 10:00-13:00"]
  priceRange?: string; // "€€"
  serviceArea?: string[]; // ["Lugano", "Bellinzona"]
  image?: string;
  sameAs?: string[];
};

function clean<T extends Record<string, unknown>>(obj: T): T {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined || v === null) continue;
    if (Array.isArray(v) && v.length === 0) continue;
    if (typeof v === "object" && !Array.isArray(v)) {
      const nested = clean(v as Record<string, unknown>);
      if (Object.keys(nested).length > 0) out[k] = nested;
    } else {
      out[k] = v;
    }
  }
  return out as T;
}

export function organizationSchema(project: Project): Record<string, unknown> {
  return clean({
    "@context": "https://schema.org",
    "@type": "Organization",
    name: project.name,
    url: `https://${project.domain}`,
    logo: `https://${project.domain}/logo.png`,
  });
}

export function websiteSchema(project: Project): Record<string, unknown> {
  return clean({
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: project.name,
    url: `https://${project.domain}`,
    potentialAction: {
      "@type": "SearchAction",
      target: `https://${project.domain}/search?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  });
}

export function articleSchema(
  project: Project,
  page: Page,
  options: {
    author?: string;
    image?: string;
    datePublished?: Date;
    dateModified?: Date;
  } = {},
): Record<string, unknown> {
  const url = `https://${project.domain}/${page.slug}`.replace(/\/+$/, "");
  return clean({
    "@context": "https://schema.org",
    "@type": "Article",
    headline: page.seo.metaTitle || page.title,
    description: page.seo.metaDescription,
    image: options.image ?? page.seo.og?.image,
    author: options.author
      ? { "@type": "Person", name: options.author }
      : { "@type": "Organization", name: project.name },
    publisher: {
      "@type": "Organization",
      name: project.name,
      logo: { "@type": "ImageObject", url: `https://${project.domain}/logo.png` },
    },
    datePublished: (options.datePublished ?? page.createdAt).toISOString(),
    dateModified: (options.dateModified ?? page.updatedAt).toISOString(),
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
  });
}

export function faqSchema(items: FAQItem[]): Record<string, unknown> {
  return clean({
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((it) => ({
      "@type": "Question",
      name: it.question,
      acceptedAnswer: { "@type": "Answer", text: it.answer },
    })),
  });
}

export function breadcrumbSchema(
  items: { name: string; url: string }[],
): Record<string, unknown> {
  return clean({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: it.url,
    })),
  });
}

export function localBusinessSchema(
  input: LocalBusinessInput,
): Record<string, unknown> {
  return clean({
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: input.name,
    url: input.url,
    telephone: input.telephone,
    priceRange: input.priceRange,
    image: input.image,
    sameAs: input.sameAs,
    address: input.address
      ? {
          "@type": "PostalAddress",
          ...input.address,
        }
      : undefined,
    geo: input.geo
      ? { "@type": "GeoCoordinates", ...input.geo }
      : undefined,
    openingHoursSpecification: input.openingHours,
    areaServed: input.serviceArea,
  });
}

export function jsonLdScript(schema: Record<string, unknown>): string {
  return `<script type="application/ld+json">${JSON.stringify(schema)}</script>`;
}
