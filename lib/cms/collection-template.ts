import type { Data as PuckData } from "@measured/puck";
import type { CMSCollection, Page, PageSEO, PageAnalytics } from "@/types";

/**
 * Costruisce il PuckData seed per la Collection Page template.
 * Webflow-style: 1 H1 bound a `name` + 1 cover image bound a primo Image field
 * + 1 paragrafo bound a primo Rich text/Plain text non-name.
 */
export function buildCollectionTemplatePuckData(
  collection: CMSCollection,
): PuckData {
  const fields = collection.fields;
  const imageField = fields.find((f) => f.type === "image");
  const bodyField = fields.find(
    (f) =>
      f.type === "rich-text" ||
      (f.type === "plain-text" && !["name", "slug"].includes(f.id)),
  );

  const content: PuckData["content"] = [
    {
      type: "BindableHeading",
      props: {
        id: "h1-name",
        text: collection.singularName,
        bindingKey: "name",
        level: "h1",
        alignment: "left",
      },
    },
  ];

  if (imageField) {
    content.push({
      type: "BindableImage",
      props: {
        id: "img-cover",
        src: "/mock-images/placeholder.svg",
        bindingKey: imageField.id,
        alt: collection.singularName,
        aspectRatio: "16/9",
      },
    });
  }

  if (bodyField) {
    content.push({
      type: "BindableParagraph",
      props: {
        id: "p-body",
        text: "Static fallback — Source pesca dall'item della collection.",
        bindingKey: bodyField.id,
        alignment: "left",
      },
    });
  }

  return {
    content,
    root: {
      props: {
        title: `${collection.singularName} · template`,
      },
    },
  };
}

export function buildCollectionTemplatePage(
  collection: CMSCollection,
  options: { id?: string } = {},
): Page {
  const fields = collection.fields;
  const firstImage = fields.find((f) => f.type === "image");
  const firstText = fields.find(
    (f) =>
      (f.type === "plain-text" || f.type === "rich-text") &&
      !["name", "slug"].includes(f.id),
  );
  const seo: PageSEO = {
    metaTitle: `${collection.singularName} · {name}`,
    metaDescription: "",
    canonicalUrl: "",
    indexable: true,
    internalSearch: false,
    og: {},
    schemaType: "Article",
    bindings: {
      metaTitle: "name",
      metaDescription: firstText?.id,
      ogImage: firstImage?.id,
      canonical: "slug",
    },
  };
  const analytics: PageAnalytics = {
    pageviews7d: 0,
    pageviews30d: 0,
    bounceRate: 0,
    avgPosition: 0,
    topKeyword: "",
    seoScore: 60,
  };
  const id = options.id ?? `tpl-${collection.id}`;
  const now = new Date();
  return {
    id,
    projectId: collection.projectId,
    title: `${collection.pluralName} · template`,
    slug: `__template/${collection.slug}`,
    status: "draft",
    puckData: buildCollectionTemplatePuckData(collection),
    seo,
    analytics,
    templateForCollectionId: collection.id,
    createdAt: now,
    updatedAt: now,
  };
}

export function findTemplatePageFor(
  pages: Page[],
  collectionId: string,
): Page | undefined {
  return pages.find((p) => p.templateForCollectionId === collectionId);
}
