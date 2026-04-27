import type { Redirect, Version } from "@/types";

export const MOCK_REDIRECTS: Redirect[] = [
  {
    id: "r1",
    projectId: "verumflow-ch",
    oldPath: "/old-blog",
    newPath: "/blog",
    type: 301,
    active: true,
    createdAt: new Date("2026-02-11T09:00:00Z"),
  },
  {
    id: "r2",
    projectId: "verumflow-ch",
    oldPath: "/services",
    newPath: "/servizi",
    type: 301,
    active: true,
    createdAt: new Date("2026-02-20T09:00:00Z"),
  },
  {
    id: "r3",
    projectId: "verumflow-ch",
    oldPath: "/team",
    newPath: "/chi-siamo",
    type: 302,
    active: false,
    createdAt: new Date("2026-03-15T09:00:00Z"),
  },
];

export const MOCK_VERSIONS: Version[] = [
  {
    id: "v-latest",
    projectId: "verumflow-ch",
    versionTag: "Latest",
    status: "LIVE",
    publishedBy: "admin@verumflow.ch",
    publishedAt: new Date("2026-04-18T14:30:00Z"),
    changes: ["/audit", "/blog/ai-content-2026"],
    description: "Aggiornato audit CTA + nuovo articolo blog.",
  },
  {
    id: "v-1-2",
    projectId: "verumflow-ch",
    versionTag: "v1.2",
    status: "READY",
    publishedBy: "admin@verumflow.ch",
    publishedAt: new Date("2026-04-12T10:00:00Z"),
    changes: ["/", "/audit"],
    description: "Rilascio hero redesign.",
  },
  {
    id: "v-1-1",
    projectId: "verumflow-ch",
    versionTag: "v1.1",
    status: "READY",
    publishedBy: "admin@verumflow.ch",
    publishedAt: new Date("2026-03-28T10:00:00Z"),
    changes: ["/contact"],
  },
  {
    id: "v-1-0",
    projectId: "verumflow-ch",
    versionTag: "v1.0",
    status: "READY",
    publishedBy: "admin@verumflow.ch",
    publishedAt: new Date("2026-02-14T10:00:00Z"),
    changes: ["/", "/audit", "/contact", "/blog"],
    description: "Initial release.",
  },
];
