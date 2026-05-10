import type { CMSCollection, CMSItem } from "@/types";
import { DEFAULT_COLLECTION_LIMITS } from "@/types/cms";

export const MOCK_COLLECTIONS: CMSCollection[] = [
  {
    id: "progetti",
    hashId: "65e445c87b7e5e5ac14407b5",
    projectId: "impresa-edile-carfi",
    name: "Progetti",
    displayName: "Progetti",
    singularName: "Progetto",
    pluralName: "Progetti",
    slug: "progetti",
    fields: [
      { id: "name", name: "Name", type: "plain-text", required: true },
      { id: "slug", name: "Slug", type: "plain-text", required: true },
      { id: "localita", name: "Località", type: "plain-text", required: true },
      { id: "anno", name: "Anno", type: "number", required: true },
      { id: "galleria", name: "Galleria", type: "multi-image", required: false },
      { id: "descrizione", name: "Descrizione", type: "rich-text", required: true },
    ],
    limits: DEFAULT_COLLECTION_LIMITS,
    createdAt: new Date("2026-01-20T10:00:00Z"),
  },
];

export const MOCK_CMS_ITEMS: CMSItem[] = [];
