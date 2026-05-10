import type { Redirect, Version } from "@/types";

export const MOCK_REDIRECTS: Redirect[] = [];

export const MOCK_VERSIONS: Version[] = [
  {
    id: "v-import",
    projectId: "verumflow-ch",
    versionTag: "import-1",
    status: "LIVE",
    publishedBy: "admin@verumflow.ch",
    publishedAt: new Date("2026-05-10T14:00:00Z"),
    changes: ["/"],
    description: "Sito reale importato da VerumFlow.zip (passthrough statico).",
  },
];
