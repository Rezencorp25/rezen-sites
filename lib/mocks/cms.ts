import type { CMSCollection, CMSItem } from "@/types";

export const MOCK_COLLECTIONS: CMSCollection[] = [
  {
    id: "blog-posts",
    projectId: "verumflow-ch",
    name: "Blog Posts",
    slug: "blog-posts",
    fields: [
      { id: "title", name: "Title", type: "text", required: true },
      { id: "slug", name: "Slug", type: "text", required: true },
      { id: "excerpt", name: "Excerpt", type: "text", required: false },
      { id: "body", name: "Body", type: "richtext", required: true },
      { id: "coverImage", name: "Cover Image", type: "image", required: false },
      { id: "publishedAt", name: "Published At", type: "date", required: true },
    ],
    createdAt: new Date("2025-12-01T10:00:00Z"),
  },
  {
    id: "case-studies",
    projectId: "verumflow-ch",
    name: "Case Studies",
    slug: "case-studies",
    fields: [
      { id: "client", name: "Client", type: "text", required: true },
      { id: "industry", name: "Industry", type: "text", required: false },
      { id: "summary", name: "Summary", type: "richtext", required: true },
      { id: "outcome", name: "Outcome", type: "text", required: true },
      {
        id: "featured",
        name: "Featured",
        type: "boolean",
        required: false,
      },
    ],
    createdAt: new Date("2026-01-15T10:00:00Z"),
  },
  {
    id: "progetti",
    projectId: "impresa-edile-carfi",
    name: "Progetti",
    slug: "progetti",
    fields: [
      { id: "nome", name: "Nome", type: "text", required: true },
      { id: "localita", name: "Località", type: "text", required: true },
      { id: "anno", name: "Anno", type: "number", required: true },
      { id: "galleria", name: "Galleria", type: "image", required: false },
      { id: "descrizione", name: "Descrizione", type: "richtext", required: true },
    ],
    createdAt: new Date("2026-01-20T10:00:00Z"),
  },
];

export const MOCK_CMS_ITEMS: CMSItem[] = [
  {
    id: "post-1",
    collectionId: "blog-posts",
    projectId: "verumflow-ch",
    data: {
      title: "Claude Opus 4.7 per generare landing page",
      slug: "claude-opus-4-7-landing",
      excerpt:
        "Come usare il nuovo modello Claude Opus 4.7 con tool use per generare siti completi.",
      body: "...",
      publishedAt: "2026-04-10",
    },
    status: "published",
    createdAt: new Date("2026-04-10T10:00:00Z"),
    updatedAt: new Date("2026-04-10T10:00:00Z"),
  },
  {
    id: "post-2",
    collectionId: "blog-posts",
    projectId: "verumflow-ch",
    data: {
      title: "Firestore composite keys per time-series data",
      slug: "firestore-composite-keys",
      excerpt:
        "Pattern per modellare AdSense daily rollup in Firestore.",
      body: "...",
      publishedAt: "2026-04-05",
    },
    status: "published",
    createdAt: new Date("2026-04-05T10:00:00Z"),
    updatedAt: new Date("2026-04-05T10:00:00Z"),
  },
  {
    id: "post-3",
    collectionId: "blog-posts",
    projectId: "verumflow-ch",
    data: {
      title: "Perché i pixel meta sono più importanti di quanto pensi",
      slug: "meta-pixel-importance",
      excerpt: "Conversion tracking non è solo marketing.",
      body: "...",
      publishedAt: "2026-03-28",
    },
    status: "published",
    createdAt: new Date("2026-03-28T10:00:00Z"),
    updatedAt: new Date("2026-04-18T10:00:00Z"),
  },
  {
    id: "post-4",
    collectionId: "blog-posts",
    projectId: "verumflow-ch",
    data: {
      title: "Bozza: GDPR + analytics in 2026",
      slug: "gdpr-analytics-2026",
      excerpt: "Stato dell'arte normativo.",
      body: "...",
      publishedAt: "2026-04-20",
    },
    status: "draft",
    createdAt: new Date("2026-04-18T09:00:00Z"),
    updatedAt: new Date("2026-04-19T11:00:00Z"),
  },
  {
    id: "cs-1",
    collectionId: "case-studies",
    projectId: "verumflow-ch",
    data: {
      client: "A&F Real Estate",
      industry: "Real Estate",
      summary:
        "Gestionale su misura per la gestione portfolio immobiliare.",
      outcome: "40% tempo risparmiato su pratiche amministrative.",
      featured: true,
    },
    status: "published",
    createdAt: new Date("2026-02-10T10:00:00Z"),
    updatedAt: new Date("2026-02-10T10:00:00Z"),
  },
];
