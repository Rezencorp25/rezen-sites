import type { Alert } from "@/types";

export const MOCK_ALERTS: Alert[] = [
  {
    id: "a1",
    projectId: "verumflow-ch",
    severity: "critical",
    title: "Meta description mancante su /blog/post-3",
    description:
      "Il post non ha una meta description. Google potrebbe mostrare snippet automatico sub-ottimale.",
    page: "/blog/post-3",
    createdAt: new Date("2026-04-18T09:00:00Z"),
    acknowledged: false,
  },
  {
    id: "a2",
    projectId: "verumflow-ch",
    severity: "warning",
    title: "Bounce rate > 80% su /contact",
    description:
      "Gli utenti stanno abbandonando la pagina contatti. Verificare form e loading.",
    page: "/contact",
    createdAt: new Date("2026-04-17T14:22:00Z"),
    acknowledged: false,
  },
  {
    id: "a3",
    projectId: "verumflow-ch",
    severity: "ok",
    title: "Tutti i pixel verificati",
    description:
      "GA4, Meta Pixel, AdSense e Google Ads conversion tracking operativi.",
    createdAt: new Date("2026-04-17T10:00:00Z"),
    acknowledged: false,
  },
  {
    id: "a4",
    projectId: "verumflow-ch",
    severity: "warning",
    title: "Backlink toxic rilevato su /blog",
    description:
      "Un backlink da dominio spam è stato rilevato. Valutare disavow.",
    page: "/blog",
    createdAt: new Date("2026-04-16T16:40:00Z"),
    acknowledged: false,
  },
  {
    id: "a5",
    projectId: "verumflow-ch",
    severity: "critical",
    title: "SEO score sotto 50 su /privacy",
    description:
      "Missing meta description, canonical e indexability policy incoerente.",
    page: "/privacy",
    createdAt: new Date("2026-04-15T08:30:00Z"),
    acknowledged: false,
  },
  {
    id: "a6",
    projectId: "impresa-edile-carfi",
    severity: "info",
    title: "Setup completato",
    description: "Dominio custom attivato e SSL verificato.",
    createdAt: new Date("2026-04-10T12:00:00Z"),
    acknowledged: false,
  },
];
