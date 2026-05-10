"use client";

import { useEffect } from "react";
import type { CMSCollection, CMSItem, PageSEO } from "@/types";

type ResolvedSeo = {
  title: string;
  description: string;
  ogImage?: string;
  canonical?: string;
  jsonLd: Record<string, unknown>;
};

function getValue(
  item: CMSItem,
  fieldId: string | undefined,
): unknown {
  if (!fieldId) return undefined;
  const source = item.liveData ?? item.draftData;
  return source[fieldId];
}

function imageUrl(v: unknown): string | undefined {
  if (!v) return undefined;
  if (typeof v === "string") return v;
  if (typeof v === "object" && v !== null && "url" in v) {
    const u = (v as { url: unknown }).url;
    return typeof u === "string" ? u : undefined;
  }
  return undefined;
}

export function resolveSeo(
  seo: PageSEO,
  collection: CMSCollection,
  item: CMSItem,
  itemSlug: string,
): ResolvedSeo {
  const b = seo.bindings ?? {};
  const titleVal = getValue(item, b.metaTitle);
  const descVal = getValue(item, b.metaDescription);
  const ogImageVal = getValue(item, b.ogImage);
  const slugVal = getValue(item, b.canonical) ?? itemSlug;

  const title =
    typeof titleVal === "string" && titleVal.length > 0
      ? titleVal
      : seo.metaTitle.replace(/\{name\}/g, String(item.draftData.name ?? ""));
  const description =
    typeof descVal === "string" && descVal.length > 0
      ? stripHtml(descVal).slice(0, 160)
      : seo.metaDescription;
  const ogImage = imageUrl(ogImageVal) ?? seo.og.image;
  const canonical = `/${collection.slug}/${String(slugVal)}`;

  const jsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": seo.schemaType ?? "Article",
    headline: title,
    description,
    image: ogImage,
    url: canonical,
    datePublished: item.lastPublishedAt
      ? new Date(item.lastPublishedAt).toISOString()
      : new Date(item.createdAt).toISOString(),
    dateModified: new Date(item.updatedAt).toISOString(),
    author: seo.author
      ? { "@type": "Person", name: seo.author.name, url: seo.author.url }
      : undefined,
  };

  return { title, description, ogImage, canonical, jsonLd };
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function SeoMetadataInjector({
  resolved,
  indexable,
}: {
  resolved: ResolvedSeo;
  indexable: boolean;
}) {
  useEffect(() => {
    const prev = document.title;
    document.title = resolved.title;
    return () => {
      document.title = prev;
    };
  }, [resolved.title]);
  return (
    <>
      <title>{resolved.title}</title>
      <meta name="description" content={resolved.description} />
      {!indexable && <meta name="robots" content="noindex,nofollow" />}
      {resolved.canonical && (
        <link rel="canonical" href={resolved.canonical} />
      )}
      <meta property="og:title" content={resolved.title} />
      <meta property="og:description" content={resolved.description} />
      {resolved.ogImage && (
        <meta property="og:image" content={resolved.ogImage} />
      )}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={resolved.title} />
      <meta name="twitter:description" content={resolved.description} />
      {resolved.ogImage && (
        <meta name="twitter:image" content={resolved.ogImage} />
      )}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(resolved.jsonLd),
        }}
      />
    </>
  );
}
